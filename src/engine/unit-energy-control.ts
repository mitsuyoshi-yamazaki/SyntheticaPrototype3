/**
 * ユニットのエネルギー操作システム
 */

import type { Unit, Hull } from "@/types/game"

/** ENERGY命令のサブコマンド */
export const ENERGY_SUBCOMMANDS = {
  /** HULLのエネルギー残量を取得 */
  GET_HULL_ENERGY: 0x01,
  /** HULLのエネルギー容量を取得 */
  GET_HULL_CAPACITY: 0x02,
  /** HULLのエネルギー収集状態を取得 */
  GET_COLLECTING_STATE: 0x03,
  /** HULLのエネルギー収集を開始 */
  START_COLLECTING: 0x10,
  /** HULLのエネルギー収集を停止 */
  STOP_COLLECTING: 0x11,
  /** ユニット自身の現在エネルギーを取得 */
  GET_UNIT_ENERGY: 0x20,
  /** ユニット自身の構築エネルギーを取得 */
  GET_BUILD_ENERGY: 0x21,
} as const

export type EnergySubcommand = (typeof ENERGY_SUBCOMMANDS)[keyof typeof ENERGY_SUBCOMMANDS]

/** ENERGY命令の実行結果 */
export type EnergyOperationResult = {
  success: boolean
  value?: number
  error?: string
}

/** ユニットのエネルギー制御システム */
export const UnitEnergyControlSystem = {
  /**
   * ENERGY命令を実行
   * @param unit 実行ユニット
   * @param subcommand サブコマンド
   * @returns 実行結果
   */
  executeEnergyCommand(unit: Unit, subcommand: number): EnergyOperationResult {
    switch (subcommand) {
      case ENERGY_SUBCOMMANDS.GET_HULL_ENERGY:
        return this.getHullEnergy(unit)

      case ENERGY_SUBCOMMANDS.GET_HULL_CAPACITY:
        return this.getHullCapacity(unit)

      case ENERGY_SUBCOMMANDS.GET_COLLECTING_STATE:
        return this.getCollectingState(unit)

      case ENERGY_SUBCOMMANDS.START_COLLECTING:
        return this.startCollecting(unit)

      case ENERGY_SUBCOMMANDS.STOP_COLLECTING:
        return this.stopCollecting(unit)

      case ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY:
        return this.getUnitEnergy(unit)

      case ENERGY_SUBCOMMANDS.GET_BUILD_ENERGY:
        return this.getBuildEnergy(unit)

      default:
        return {
          success: false,
          error: `Unknown energy subcommand: 0x${subcommand.toString(16).padStart(2, "0")}`,
        }
    }
  },

  /**
   * HULLのエネルギー残量を取得
   */
  getHullEnergy(unit: Unit): EnergyOperationResult {
    // ユニットが所属するHULLを取得
    const hull = this.getParentHull(unit)
    if (hull == null) {
      return {
        success: false,
        error: "Unit is not attached to a HULL",
      }
    }

    return {
      success: true,
      value: hull.energy,
    }
  },

  /**
   * HULLのエネルギー容量を取得
   */
  getHullCapacity(unit: Unit): EnergyOperationResult {
    const hull = this.getParentHull(unit)
    if (hull == null) {
      return {
        success: false,
        error: "Unit is not attached to a HULL",
      }
    }

    return {
      success: true,
      value: hull.capacity,
    }
  },

  /**
   * HULLのエネルギー収集状態を取得
   */
  getCollectingState(unit: Unit): EnergyOperationResult {
    const hull = this.getParentHull(unit)
    if (hull == null) {
      return {
        success: false,
        error: "Unit is not attached to a HULL",
      }
    }

    return {
      success: true,
      value: hull.collectingEnergy === true ? 1 : 0,
    }
  },

  /**
   * HULLのエネルギー収集を開始
   */
  startCollecting(unit: Unit): EnergyOperationResult {
    const hull = this.getParentHull(unit)
    if (hull == null) {
      return {
        success: false,
        error: "Unit is not attached to a HULL",
      }
    }

    hull.collectingEnergy = true
    return {
      success: true,
      value: 1,
    }
  },

  /**
   * HULLのエネルギー収集を停止
   */
  stopCollecting(unit: Unit): EnergyOperationResult {
    const hull = this.getParentHull(unit)
    if (hull == null) {
      return {
        success: false,
        error: "Unit is not attached to a HULL",
      }
    }

    hull.collectingEnergy = false
    return {
      success: true,
      value: 0,
    }
  },

  /**
   * ユニット自身の現在エネルギーを取得
   */
  getUnitEnergy(unit: Unit): EnergyOperationResult {
    return {
      success: true,
      value: unit.currentEnergy,
    }
  },

  /**
   * ユニット自身の構築エネルギーを取得
   */
  getBuildEnergy(unit: Unit): EnergyOperationResult {
    return {
      success: true,
      value: unit.buildEnergy,
    }
  },

  /**
   * ユニットが所属するHULLを取得
   * @param unit ユニット
   * @returns HULLまたはnull
   */
  getParentHull(_unit: Unit): Hull | null {
    // TODO: 実際の実装では、WorldStateManagerからHULLを検索
    // 現在は仮実装としてnullを返す
    return null
  },
}
