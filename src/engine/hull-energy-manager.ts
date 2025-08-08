/**
 * HULLのエネルギー管理システム
 */

import type { Hull, ObjectId, GameObject } from "@/types/game"

/** HULLエネルギー管理の結果 */
export type HullEnergyResult = {
  /** 更新されたHULL */
  readonly updatedHull: Hull
  /** 実際に転送/消費されたエネルギー量 */
  readonly energyTransferred: number
  /** 操作が成功したか */
  readonly success: boolean
  /** 失敗理由（失敗時のみ） */
  readonly failureReason?: string
}

/** HULLエネルギー管理パラメータ */
export type HullEnergyParameters = {
  /** 最大転送レート（エネルギー/tick） */
  readonly maxTransferRate: number
  /** エネルギー転送時の効率（0-1） */
  readonly transferEfficiency: number
  /** 自己修復のエネルギーコスト（1ポイントあたり） */
  readonly repairCostPerPoint: number
}

/** デフォルトパラメータ */
export const DEFAULT_HULL_ENERGY_PARAMETERS: HullEnergyParameters = {
  maxTransferRate: 100,
  transferEfficiency: 0.95,
  repairCostPerPoint: 10,
}

export class HullEnergyManager {
  private readonly _parameters: HullEnergyParameters

  public constructor(parameters: HullEnergyParameters = DEFAULT_HULL_ENERGY_PARAMETERS) {
    this._parameters = parameters
  }

  /**
   * HULLにエネルギーを追加
   * @param hull 対象のHULL
   * @param amount 追加するエネルギー量
   * @returns 更新結果
   */
  public addEnergy(hull: Hull, amount: number): HullEnergyResult {
    if (amount <= 0) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "エネルギー量は正の値である必要があります",
      }
    }

    const currentTotal = hull.energy
    const availableCapacity = hull.capacity - hull.storedEnergy
    const actualAmount = Math.min(amount, availableCapacity)

    if (actualAmount === 0) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "エネルギー容量が満杯です",
      }
    }

    const updatedHull: Hull = {
      ...hull,
      storedEnergy: hull.storedEnergy + actualAmount,
      energy: currentTotal + actualAmount,
      mass: hull.mass + actualAmount,
    }

    return {
      updatedHull,
      energyTransferred: actualAmount,
      success: true,
    }
  }

  /**
   * HULLからエネルギーを消費
   * @param hull 対象のHULL
   * @param amount 消費するエネルギー量
   * @returns 更新結果
   */
  public consumeEnergy(hull: Hull, amount: number): HullEnergyResult {
    if (amount <= 0) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "エネルギー量は正の値である必要があります",
      }
    }

    if (hull.storedEnergy < amount) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "エネルギーが不足しています",
      }
    }

    const updatedHull: Hull = {
      ...hull,
      storedEnergy: hull.storedEnergy - amount,
      energy: hull.energy - amount,
      mass: hull.mass - amount,
    }

    return {
      updatedHull,
      energyTransferred: amount,
      success: true,
    }
  }

  /**
   * HULLから他のオブジェクトへエネルギーを転送
   * @param hull 転送元のHULL
   * @param target 転送先のオブジェクト
   * @param amount 転送するエネルギー量
   * @returns 更新結果
   */
  public transferEnergy(
    hull: Hull,
    target: GameObject,
    amount: number
  ): HullEnergyResult & { updatedTarget: GameObject } {
    // 転送レート制限
    const limitedAmount = Math.min(amount, this._parameters.maxTransferRate)

    // エネルギーチェック
    if (hull.storedEnergy < limitedAmount) {
      return {
        updatedHull: hull,
        updatedTarget: target,
        energyTransferred: 0,
        success: false,
        failureReason: "転送に必要なエネルギーが不足しています",
      }
    }

    // 転送効率を適用
    const actualTransferred = Math.floor(limitedAmount * this._parameters.transferEfficiency)
    const consumed = limitedAmount

    // HULLからエネルギーを消費
    const updatedHull: Hull = {
      ...hull,
      storedEnergy: hull.storedEnergy - consumed,
      energy: hull.energy - consumed,
      mass: hull.mass - consumed,
    }

    // ターゲットにエネルギーを追加
    const updatedTarget: GameObject = {
      ...target,
      energy: target.energy + actualTransferred,
      mass: target.mass + actualTransferred,
    }

    return {
      updatedHull,
      updatedTarget,
      energyTransferred: actualTransferred,
      success: true,
    }
  }

  /**
   * HULLの自己修復
   * @param hull 対象のHULL
   * @param repairAmount 修復量
   * @returns 更新結果
   */
  public repairHull(hull: Hull, repairAmount: number): HullEnergyResult {
    if (repairAmount <= 0) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "修復量は正の値である必要があります",
      }
    }

    // 必要な修復量を計算（最大でbuildEnergyまで）
    const currentDamage = hull.buildEnergy - hull.currentEnergy
    const actualRepair = Math.min(repairAmount, currentDamage)

    if (actualRepair === 0) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "修復の必要がありません",
      }
    }

    // 修復コストを計算
    const repairCost = actualRepair * this._parameters.repairCostPerPoint

    if (hull.storedEnergy < repairCost) {
      return {
        updatedHull: hull,
        energyTransferred: 0,
        success: false,
        failureReason: "修復に必要なエネルギーが不足しています",
      }
    }

    // 修復を実行
    const updatedHull: Hull = {
      ...hull,
      storedEnergy: hull.storedEnergy - repairCost,
      energy: hull.energy - repairCost,
      mass: hull.mass - repairCost,
      currentEnergy: hull.currentEnergy + actualRepair,
    }

    return {
      updatedHull,
      energyTransferred: repairCost,
      success: true,
    }
  }

  /**
   * アタッチされたユニットにエネルギーを供給
   * @param hull 供給元のHULL
   * @param units アタッチされたユニットのマップ
   * @param requestedAmounts 各ユニットが要求するエネルギー量
   * @returns 更新結果
   */
  public supplyAttachedUnits(
    hull: Hull,
    units: Map<ObjectId, GameObject>,
    requestedAmounts: Map<ObjectId, number>
  ): {
    updatedHull: Hull
    suppliedAmounts: Map<ObjectId, number>
    totalSupplied: number
  } {
    let remainingEnergy = Math.min(hull.storedEnergy, this._parameters.maxTransferRate)
    const suppliedAmounts = new Map<ObjectId, number>()
    let totalSupplied = 0

    // アタッチされたユニットに順番に供給
    const allUnitIds = [
      ...hull.attachedUnits.hulls.map(h => h.id),
      ...hull.attachedUnits.assemblers.map(a => a.id),
      ...hull.attachedUnits.computers.map(c => c.id),
    ]
    for (const unitId of allUnitIds) {
      if (remainingEnergy <= 0) {
        break
      }

      const unit = units.get(unitId)
      const requested = requestedAmounts.get(unitId) ?? 0

      if (unit == null || requested <= 0) {
        continue
      }

      // 供給量を計算（効率を適用）
      const supplied = Math.min(requested, remainingEnergy)
      const actualSupplied = Math.floor(supplied * this._parameters.transferEfficiency)

      suppliedAmounts.set(unitId, actualSupplied)
      totalSupplied += actualSupplied
      remainingEnergy -= supplied
    }

    // エネルギーを消費
    const consumed = Math.min(hull.storedEnergy, this._parameters.maxTransferRate) - remainingEnergy

    const updatedHull: Hull = {
      ...hull,
      storedEnergy: hull.storedEnergy - consumed,
      energy: hull.energy - consumed,
      mass: hull.mass - consumed,
    }

    return {
      updatedHull,
      suppliedAmounts,
      totalSupplied,
    }
  }

  /**
   * HULLの残りエネルギー容量を取得
   * @param hull 対象のHULL
   * @returns 残り容量
   */
  public getRemainingCapacity(hull: Hull): number {
    return Math.max(0, hull.capacity - hull.storedEnergy)
  }

  /**
   * HULLのエネルギー充填率を取得（0-1）
   * @param hull 対象のHULL
   * @returns 充填率
   */
  public getFillRate(hull: Hull): number {
    return hull.capacity > 0 ? hull.storedEnergy / hull.capacity : 0
  }

  /**
   * HULLの損傷率を取得（0-1）
   * @param hull 対象のHULL
   * @returns 損傷率
   */
  public getDamageRate(hull: Hull): number {
    return hull.buildEnergy > 0 ? (hull.buildEnergy - hull.currentEnergy) / hull.buildEnergy : 0
  }
}
