/**
 * エネルギー自然崩壊システム
 */

import type { ObjectId, EnergyObject } from "@/types/game"

/** エネルギー崩壊の結果 */
export type EnergyDecayResult = {
  /** 崩壊したエネルギーオブジェクトのID */
  readonly decayedIds: ObjectId[]
  /** 崩壊により消滅したオブジェクトのID */
  readonly removedIds: ObjectId[]
  /** 崩壊により発生した総熱量 */
  readonly totalHeatGenerated: number
  /** 更新されたエネルギーオブジェクト */
  readonly updatedObjects: Map<ObjectId, EnergyObject>
}

/** エネルギー崩壊システムのパラメータ */
export type EnergyDecayParameters = {
  /** 崩壊率の除数（大きいほど崩壊が遅い） */
  readonly decayRateDivisor: number
}

/** デフォルトパラメータ */
export const DEFAULT_DECAY_PARAMETERS: EnergyDecayParameters = {
  decayRateDivisor: 10,
}

export class EnergyDecaySystem {
  private readonly _parameters: EnergyDecayParameters

  public constructor(parameters: EnergyDecayParameters = DEFAULT_DECAY_PARAMETERS) {
    this._parameters = parameters
  }

  /**
   * エネルギーオブジェクトの自然崩壊を処理
   * @param energyObjects 処理対象のエネルギーオブジェクト
   * @returns 崩壊結果
   */
  public processDecay(energyObjects: Map<ObjectId, EnergyObject>): EnergyDecayResult {
    const decayedIds: ObjectId[] = []
    const removedIds: ObjectId[] = []
    const updatedObjects = new Map<ObjectId, EnergyObject>()
    let totalHeatGenerated = 0

    for (const [id, energyObj] of energyObjects.entries()) {
      // 崩壊量の計算
      const decayAmount = this.calculateDecayAmount(energyObj.energy)
      
      // エネルギーを減少
      const newEnergy = energyObj.energy - decayAmount
      
      if (newEnergy <= 0) {
        // エネルギーが完全に崩壊
        removedIds.push(id)
        totalHeatGenerated += energyObj.energy
      } else {
        // 部分的な崩壊
        const updatedObj: EnergyObject = {
          ...energyObj,
          energy: newEnergy,
          mass: newEnergy, // 質量も同時に更新
        }
        updatedObjects.set(id, updatedObj)
        decayedIds.push(id)
        totalHeatGenerated += decayAmount
      }
    }

    return {
      decayedIds,
      removedIds,
      totalHeatGenerated,
      updatedObjects,
    }
  }

  /**
   * 崩壊量を計算
   * @param energy 現在のエネルギー量
   * @returns tick当たりの崩壊量
   */
  public calculateDecayAmount(energy: number): number {
    return Math.ceil(Math.sqrt(energy) / this._parameters.decayRateDivisor)
  }

  /**
   * エネルギー量から半減期を推定（参考値）
   * @param energy エネルギー量
   * @returns 推定半減期（tick数）
   */
  public estimateHalfLife(energy: number): number {
    let remaining = energy
    let ticks = 0
    const halfEnergy = energy / 2

    while (remaining > halfEnergy && ticks < 10000) {
      const decay = this.calculateDecayAmount(remaining)
      remaining -= decay
      ticks++
    }

    return ticks
  }
}