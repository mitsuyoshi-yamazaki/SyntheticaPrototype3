/**
 * エネルギーソース管理システム
 */

import type { EnergySource, ObjectId, Vec2, EnergyObject } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { EnergySystem } from "./energy-system"

/** エネルギー生成の結果 */
export type EnergyGenerationResult = {
  /** 生成されたエネルギーオブジェクト */
  readonly generatedObjects: EnergyObject[]
  /** 生成された総エネルギー量 */
  readonly totalEnergy: number
}

/** エネルギーソース管理のパラメータ */
export type EnergySourceParameters = {
  /** エネルギー生成時の初期速度の範囲 */
  readonly spawnVelocityRange: number
  /** エネルギーソースからの生成距離 */
  readonly spawnDistance: number
  /** 1tickで1つのソースから生成される最大オブジェクト数 */
  readonly maxObjectsPerSource: number
}

/** デフォルトパラメータ */
export const DEFAULT_SOURCE_PARAMETERS: EnergySourceParameters = {
  spawnVelocityRange: 5,
  spawnDistance: 20,
  maxObjectsPerSource: 10,
}

export class EnergySourceManager {
  private readonly _energySystem: EnergySystem
  private readonly _parameters: EnergySourceParameters

  public constructor(
    worldWidth: number,
    worldHeight: number,
    parameters: EnergySourceParameters = DEFAULT_SOURCE_PARAMETERS
  ) {
    this._parameters = parameters
    this._energySystem = new EnergySystem(worldWidth, worldHeight)
  }

  /**
   * エネルギーソースを作成
   * @param id ソースのID
   * @param position 位置
   * @param energyPerTick 1tickあたりの生成エネルギー量
   * @returns エネルギーソース
   */
  public createEnergySource(id: ObjectId, position: Vec2, energyPerTick: number): EnergySource {
    return {
      id,
      position: Vec2Utils.copy(position),
      energyPerTick: Math.max(1, Math.floor(energyPerTick)),
    }
  }

  /**
   * エネルギーソースからエネルギーを生成
   * @param source エネルギーソース
   * @param idGenerator 新しいIDを生成する関数
   * @returns 生成結果
   */
  public generateEnergy(source: EnergySource, idGenerator: () => ObjectId): EnergyGenerationResult {
    const generatedObjects: EnergyObject[] = []
    let remainingEnergy = source.energyPerTick

    // エネルギーを複数のオブジェクトに分割して生成
    for (let i = 0; i < this._parameters.maxObjectsPerSource && remainingEnergy > 0; i++) {
      // 生成するエネルギー量を決定（ランダムな分割）
      let amount: number
      if (i === this._parameters.maxObjectsPerSource - 1 || remainingEnergy <= 100) {
        // 最後のオブジェクトまたは残りが少ない場合は全て
        amount = remainingEnergy
      } else {
        // ランダムに分割（最低10E、最大で残りの半分）
        const maxAmount = Math.min(remainingEnergy / 2, 1000)
        amount = Math.floor(10 + Math.random() * (maxAmount - 10))
      }

      // 生成位置（ソースの周囲にランダム配置）
      const angle = Math.random() * 2 * Math.PI
      const distance = this._parameters.spawnDistance
      const position = Vec2Utils.create(
        source.position.x + Math.cos(angle) * distance,
        source.position.y + Math.sin(angle) * distance
      )

      // 初期速度（外向き）
      const speed = Math.random() * this._parameters.spawnVelocityRange
      const velocity = Vec2Utils.create(Math.cos(angle) * speed, Math.sin(angle) * speed)

      // エネルギーオブジェクトを生成
      const energyObj = this._energySystem.createEnergyObject(idGenerator(), position, amount)

      // 速度を設定
      const energyObjWithVelocity: EnergyObject = {
        ...energyObj,
        velocity,
      }

      generatedObjects.push(energyObjWithVelocity)
      remainingEnergy -= amount
    }

    return {
      generatedObjects,
      totalEnergy: source.energyPerTick,
    }
  }

  /**
   * 複数のエネルギーソースから一括生成
   * @param sources エネルギーソースの配列
   * @param idGenerator 新しいIDを生成する関数
   * @returns 全ソースの生成結果
   */
  public generateFromMultipleSources(
    sources: EnergySource[],
    idGenerator: () => ObjectId
  ): EnergyGenerationResult {
    const allGeneratedObjects: EnergyObject[] = []
    let totalEnergy = 0

    for (const source of sources) {
      const result = this.generateEnergy(source, idGenerator)
      allGeneratedObjects.push(...result.generatedObjects)
      totalEnergy += result.totalEnergy
    }

    return {
      generatedObjects: allGeneratedObjects,
      totalEnergy,
    }
  }

  /**
   * エネルギーソースの位置を更新
   * @param source エネルギーソース
   * @param newPosition 新しい位置
   * @returns 更新されたエネルギーソース
   */
  public updateSourcePosition(source: EnergySource, newPosition: Vec2): EnergySource {
    return {
      ...source,
      position: Vec2Utils.copy(newPosition),
    }
  }

  /**
   * エネルギーソースの生成率を更新
   * @param source エネルギーソース
   * @param newRate 新しい生成率
   * @returns 更新されたエネルギーソース
   */
  public updateSourceRate(source: EnergySource, newRate: number): EnergySource {
    return {
      ...source,
      energyPerTick: Math.max(1, Math.floor(newRate)),
    }
  }
}
