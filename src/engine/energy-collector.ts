/**
 * エネルギー収集システム - HULLによるエネルギー収集
 */

import type { ObjectId, EnergyObject, Hull } from "@/types/game"
import { shortestVector } from "@/utils/torus-math"

/** エネルギー収集の結果 */
export type EnergyCollectionResult = {
  /** 収集されたエネルギーオブジェクトのID */
  readonly collectedIds: ObjectId[]
  /** 収集された総エネルギー量 */
  readonly totalEnergy: number
  /** 更新されたHULL（エネルギーが追加された） */
  readonly updatedHull: Hull
}

/** エネルギー収集のパラメータ */
export type EnergyCollectorParameters = {
  /** 収集可能な最大距離（HULLの半径に追加される） */
  readonly collectionRange: number
  /** 1tickで収集可能な最大オブジェクト数 */
  readonly maxCollectPerTick: number
  /** HULLの最大エネルギー容量（nullの場合は無制限） */
  readonly maxHullCapacity: number | null
}

/** デフォルトパラメータ */
export const DEFAULT_COLLECTOR_PARAMETERS: EnergyCollectorParameters = {
  collectionRange: 5, // HULLの半径 + 5の範囲で収集
  maxCollectPerTick: 10,
  maxHullCapacity: null, // デフォルトは無制限
}

export class EnergyCollector {
  private readonly _parameters: EnergyCollectorParameters
  private readonly _worldWidth: number
  private readonly _worldHeight: number

  public constructor(
    worldWidth: number,
    worldHeight: number,
    parameters: EnergyCollectorParameters = DEFAULT_COLLECTOR_PARAMETERS
  ) {
    this._worldWidth = worldWidth
    this._worldHeight = worldHeight
    this._parameters = parameters
  }

  /**
   * HULLがエネルギーオブジェクトを収集
   * @param hull 収集を行うHULL
   * @param energyObjects 利用可能なエネルギーオブジェクト
   * @returns 収集結果
   */
  public collectEnergy(
    hull: Hull,
    energyObjects: Map<ObjectId, EnergyObject>
  ): EnergyCollectionResult {
    const collectedIds: ObjectId[] = []
    let totalCollected = 0

    // 収集可能な範囲
    const collectionRadius = hull.radius + this._parameters.collectionRange
    const collectionRadiusSq = collectionRadius * collectionRadius

    // 収集候補を距離順にソート
    const candidates: { obj: EnergyObject; distanceSq: number }[] = []

    for (const energyObj of energyObjects.values()) {
      // トーラス世界での最短距離を計算
      const delta = shortestVector(
        hull.position,
        energyObj.position,
        this._worldWidth,
        this._worldHeight
      )
      const distanceSq = delta.x * delta.x + delta.y * delta.y

      // 収集範囲内かチェック
      if (distanceSq <= collectionRadiusSq) {
        candidates.push({ obj: energyObj, distanceSq })
      }
    }

    // 近い順にソート
    candidates.sort((a, b) => a.distanceSq - b.distanceSq)

    // 容量チェック用の現在のエネルギー
    let currentEnergy = hull.energy

    // 収集処理
    for (let i = 0; i < Math.min(candidates.length, this._parameters.maxCollectPerTick); i++) {
      const candidate = candidates[i]
      if (candidate === undefined) {
        continue
      }
      const energyObj = candidate.obj

      // 容量チェック
      if (this._parameters.maxHullCapacity != null) {
        const remainingCapacity = this._parameters.maxHullCapacity - currentEnergy
        if (remainingCapacity <= 0) {
          break // 容量いっぱい
        }

        // 部分的に収集する場合の処理（今回は全部収集のみ）
        if (energyObj.energy > remainingCapacity) {
          continue // このオブジェクトは収集できない
        }
      }

      // 収集
      collectedIds.push(energyObj.id)
      totalCollected += energyObj.energy
      currentEnergy += energyObj.energy
    }

    // HULLを更新
    const updatedHull: Hull = {
      ...hull,
      energy: hull.energy + totalCollected,
      mass: hull.mass + totalCollected, // エネルギー = 質量
    }

    return {
      collectedIds,
      totalEnergy: totalCollected,
      updatedHull,
    }
  }

  /**
   * 複数のHULLによる同時収集（競合処理付き）
   * @param hulls 収集を行うHULLの配列
   * @param energyObjects 利用可能なエネルギーオブジェクト
   * @returns 各HULLの収集結果
   */
  public collectEnergyMultiple(
    hulls: Hull[],
    energyObjects: Map<ObjectId, EnergyObject>
  ): Map<ObjectId, EnergyCollectionResult> {
    const results = new Map<ObjectId, EnergyCollectionResult>()
    const claimedObjects = new Set<ObjectId>()

    // 各HULLについて収集範囲内のオブジェクトを特定
    type HullCandidate = {
      hull: Hull
      candidates: { obj: EnergyObject; distanceSq: number }[]
    }

    const hullCandidates: HullCandidate[] = []

    for (const hull of hulls) {
      const collectionRadius = hull.radius + this._parameters.collectionRange
      const collectionRadiusSq = collectionRadius * collectionRadius
      const candidates: { obj: EnergyObject; distanceSq: number }[] = []

      for (const energyObj of energyObjects.values()) {
        if (claimedObjects.has(energyObj.id)) {
          continue
        }

        const delta = shortestVector(
          hull.position,
          energyObj.position,
          this._worldWidth,
          this._worldHeight
        )
        const distanceSq = delta.x * delta.x + delta.y * delta.y

        if (distanceSq <= collectionRadiusSq) {
          candidates.push({ obj: energyObj, distanceSq })
        }
      }

      candidates.sort((a, b) => a.distanceSq - b.distanceSq)
      hullCandidates.push({ hull, candidates })
    }

    // 競合解決：より近いHULLが優先
    // 各エネルギーオブジェクトについて最も近いHULLを決定
    const objectClaims = new Map<ObjectId, { hull: Hull; distanceSq: number }>()

    for (const { hull, candidates } of hullCandidates) {
      for (const candidate of candidates) {
        const objId = candidate.obj.id
        const existing = objectClaims.get(objId)

        if (existing === undefined || candidate.distanceSq < existing.distanceSq) {
          objectClaims.set(objId, { hull, distanceSq: candidate.distanceSq })
        }
      }
    }

    // 各HULLの収集処理
    for (const { hull, candidates } of hullCandidates) {
      const collectedIds: ObjectId[] = []
      let totalCollected = 0
      let currentEnergy = hull.energy
      let collected = 0

      for (const candidate of candidates) {
        if (collected >= this._parameters.maxCollectPerTick) {
          break
        }

        const claim = objectClaims.get(candidate.obj.id)
        if (claim === undefined || claim.hull.id !== hull.id) {
          continue // 他のHULLが優先
        }

        // 容量チェック
        if (this._parameters.maxHullCapacity != null) {
          const remainingCapacity = this._parameters.maxHullCapacity - currentEnergy
          if (remainingCapacity <= 0 || candidate.obj.energy > remainingCapacity) {
            continue
          }
        }

        collectedIds.push(candidate.obj.id)
        totalCollected += candidate.obj.energy
        currentEnergy += candidate.obj.energy
        claimedObjects.add(candidate.obj.id)
        collected++
      }

      const updatedHull: Hull = {
        ...hull,
        energy: hull.energy + totalCollected,
        mass: hull.mass + totalCollected,
      }

      results.set(hull.id, {
        collectedIds,
        totalEnergy: totalCollected,
        updatedHull,
      })
    }

    return results
  }

  /**
   * HULLがエネルギーを収集可能かチェック
   * @param hull チェック対象のHULL
   * @param energyAmount 収集予定のエネルギー量
   * @returns 収集可能な場合true
   */
  public canCollect(hull: Hull, energyAmount: number): boolean {
    if (this._parameters.maxHullCapacity == null) {
      return true // 容量無制限
    }

    return hull.energy + energyAmount <= this._parameters.maxHullCapacity
  }

  /**
   * HULLの残り容量を取得
   * @param hull 対象のHULL
   * @returns 残り容量（無制限の場合はnull）
   */
  public getRemainingCapacity(hull: Hull): number | null {
    if (this._parameters.maxHullCapacity == null) {
      return null
    }

    return Math.max(0, this._parameters.maxHullCapacity - hull.energy)
  }
}
