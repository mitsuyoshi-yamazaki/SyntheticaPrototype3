import type {
  ObjectId,
  GameObject,
  Unit,
  Hull,
  Assembler,
  Computer,
  UnitSpec,
  Vec2,
} from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

/** 生産中ユニットの状態 */
export type ProducingUnit = Unit & {
  readonly isProducing: true
  readonly targetSpec: UnitSpec
  readonly requiredEnergy: number // 完成に必要な総エネルギー
  accumulatedEnergy: number // 蓄積されたエネルギー
}

/** 構築システムのパラメータ */
export type ConstructionParameters = {
  readonly producingUnitRatio: number // 生産中ユニット生成コスト比率（デフォルト: 0.05）
  readonly repairCostMultiplier: number // 修理コスト倍率（デフォルト: 1.1）
}

/** 構築結果 */
export type ConstructionResult = {
  readonly success: boolean
  readonly energyConsumed: number
  readonly producingUnit?: ProducingUnit
  readonly completedUnit?: Unit
  readonly error?: string
}

/** ユニット構築コスト計算 */
export const UnitCostCalculator = {
  /** HULLの構成エネルギー計算 */
  calculateHullBuildEnergy(capacity: number): number {
    return capacity * 2
  },

  /** HULLの生産エネルギー計算 */
  calculateHullProductionEnergy(buildEnergy: number): number {
    return Math.ceil(buildEnergy * 0.05)
  },

  /** ASSEMBLERの構成エネルギー計算 */
  calculateAssemblerBuildEnergy(assemblePower: number): number {
    return 800 + assemblePower * 200
  },

  /** ASSEMBLERの生産エネルギー計算 */
  calculateAssemblerProductionEnergy(buildEnergy: number): number {
    return Math.ceil(buildEnergy * 0.2)
  },

  /** COMPUTERの構成エネルギー計算 */
  calculateComputerBuildEnergy(processingPower: number, memorySize: number): number {
    const frequencyTerm = Math.ceil(Math.pow(processingPower / 5, 2) * 100)
    return 500 + frequencyTerm + memorySize * 50
  },

  /** COMPUTERの生産エネルギー計算 */
  calculateComputerProductionEnergy(buildEnergy: number): number {
    return Math.ceil(buildEnergy * 0.1)
  },

  /** ユニット仕様から構成エネルギーを計算 */
  calculateBuildEnergy(spec: UnitSpec): number {
    switch (spec.type) {
      case "HULL":
        return this.calculateHullBuildEnergy(spec.capacity)
      case "ASSEMBLER":
        return this.calculateAssemblerBuildEnergy(spec.assemblePower)
      case "COMPUTER":
        return this.calculateComputerBuildEnergy(spec.processingPower, spec.memorySize)
    }
  },

  /** ユニット仕様から生産エネルギーを計算 */
  calculateProductionEnergy(spec: UnitSpec): number {
    const buildEnergy = this.calculateBuildEnergy(spec)
    switch (spec.type) {
      case "HULL":
        return this.calculateHullProductionEnergy(buildEnergy)
      case "ASSEMBLER":
        return this.calculateAssemblerProductionEnergy(buildEnergy)
      case "COMPUTER":
        return this.calculateComputerProductionEnergy(buildEnergy)
    }
  },

  /** ユニット仕様から総コストを計算 */
  calculateTotalCost(spec: UnitSpec): number {
    return this.calculateBuildEnergy(spec) + this.calculateProductionEnergy(spec)
  },
}

/** ASSEMBLER構築システム */
export class AssemblerConstructionSystem {
  private readonly _parameters: ConstructionParameters
  private readonly _nextId: () => ObjectId

  public constructor(parameters: Partial<ConstructionParameters> = {}, nextId: () => ObjectId) {
    this._parameters = {
      producingUnitRatio: parameters.producingUnitRatio ?? 0.05,
      repairCostMultiplier: parameters.repairCostMultiplier ?? 1.1,
    }
    this._nextId = nextId
  }

  /** 生産開始（生産中ユニット生成） */
  public startProduction(
    spec: UnitSpec,
    position: Vec2,
    availableEnergy: number
  ): ConstructionResult {
    const buildEnergy = UnitCostCalculator.calculateBuildEnergy(spec)
    const requiredInitialEnergy = Math.ceil(buildEnergy * this._parameters.producingUnitRatio)

    if (availableEnergy < requiredInitialEnergy) {
      return {
        success: false,
        energyConsumed: 0,
        error: `Insufficient energy: required ${requiredInitialEnergy}, available ${availableEnergy}`,
      }
    }

    // 生産中ユニットを生成
    const producingUnit: ProducingUnit = {
      id: this._nextId(),
      type: spec.type,
      position: Vec2Utils.copy(position),
      velocity: Vec2Utils.copy(Vec2Utils.zero),
      radius: this.calculateUnitRadius(spec),
      energy: 0, // 生産中は機能しない
      mass: requiredInitialEnergy, // 初期質量
      buildEnergy,
      currentEnergy: 0, // ダメージなし
      isProducing: true,
      targetSpec: spec,
      requiredEnergy: buildEnergy,
      accumulatedEnergy: requiredInitialEnergy,
      ...this.createSpecificFields(spec),
    }

    return {
      success: true,
      energyConsumed: requiredInitialEnergy,
      producingUnit,
    }
  }

  /** 生産継続（エネルギー蓄積） */
  public continueProduction(
    producingUnit: ProducingUnit,
    assemblePower: number,
    availableEnergy: number
  ): ConstructionResult {
    // 1tickで蓄積できるエネルギー量（assemblePowerに依存）
    const energyPerTick = Math.min(assemblePower, availableEnergy)

    if (energyPerTick === 0) {
      return {
        success: false,
        energyConsumed: 0,
        error: "No energy available for assembly",
      }
    }

    // エネルギーを蓄積
    const remainingEnergy = producingUnit.requiredEnergy - producingUnit.accumulatedEnergy
    const energyToAdd = Math.min(energyPerTick, remainingEnergy)

    producingUnit.accumulatedEnergy += energyToAdd
    producingUnit.mass += energyToAdd

    // 完成判定
    if (producingUnit.accumulatedEnergy >= producingUnit.requiredEnergy) {
      // 完成したユニットに変換
      const completedUnit = this.completeProduction(producingUnit)
      return {
        success: true,
        energyConsumed: energyToAdd,
        completedUnit,
      }
    }

    return {
      success: true,
      energyConsumed: energyToAdd,
      producingUnit,
    }
  }

  /** 生産完了（ユニット有効化） */
  private completeProduction(producingUnit: ProducingUnit): Unit {
    const unit: Unit = {
      id: producingUnit.id,
      type: producingUnit.type,
      position: producingUnit.position,
      velocity: producingUnit.velocity,
      radius: producingUnit.radius,
      energy: producingUnit.requiredEnergy, // フルエネルギー
      mass: producingUnit.requiredEnergy,
      buildEnergy: producingUnit.buildEnergy,
      currentEnergy: producingUnit.buildEnergy, // ダメージなし
    }

    // 型固有のフィールドを追加
    switch (producingUnit.targetSpec.type) {
      case "HULL":
        return {
          ...unit,
          type: "HULL",
          capacity: producingUnit.targetSpec.capacity,
          storedEnergy: 0,
          attachedUnits: [],
        } as Hull
      case "ASSEMBLER":
        return {
          ...unit,
          type: "ASSEMBLER",
          assemblePower: producingUnit.targetSpec.assemblePower,
          isAssembling: false,
          progress: 0,
        } as Assembler
      case "COMPUTER":
        return {
          ...unit,
          type: "COMPUTER",
          processingPower: producingUnit.targetSpec.processingPower,
          memorySize: producingUnit.targetSpec.memorySize,
          memory: new Uint8Array(producingUnit.targetSpec.memorySize),
          programCounter: 0,
          registers: new Uint16Array(8),
        } as Computer
    }
  }

  /** 修理コスト計算 */
  public calculateRepairCost(
    unit: Unit,
    damageAmount: number
  ): { energyCost: number; repairCost: number } {
    const spec = this.getUnitSpec(unit)
    const productionEnergy = UnitCostCalculator.calculateProductionEnergy(spec)
    const buildEnergy = UnitCostCalculator.calculateBuildEnergy(spec)

    // 修理コスト = n + (n × 生産エネルギー / 構成エネルギー) × 1.1
    const repairCost = Math.ceil(
      ((damageAmount * productionEnergy) / buildEnergy) * this._parameters.repairCostMultiplier
    )

    return {
      energyCost: damageAmount, // 実際の修復エネルギー
      repairCost, // 修理作業コスト
    }
  }

  /** 修理実行 */
  public repair(unit: Unit, assemblePower: number, availableEnergy: number): ConstructionResult {
    const damage = unit.buildEnergy - unit.currentEnergy
    if (damage === 0) {
      return {
        success: true,
        energyConsumed: 0,
        error: "Unit has no damage",
      }
    }

    // 1tickで修理できる量（assemblePowerに制限）
    const repairPerTick = Math.min(assemblePower, damage)
    const { energyCost, repairCost } = this.calculateRepairCost(unit, repairPerTick)
    const totalCost = energyCost + repairCost

    if (availableEnergy < totalCost) {
      return {
        success: false,
        energyConsumed: 0,
        error: `Insufficient energy for repair: required ${totalCost}, available ${availableEnergy}`,
      }
    }

    // 修理実行
    unit.currentEnergy = Math.min(unit.currentEnergy + repairPerTick, unit.buildEnergy)
    unit.energy = unit.currentEnergy
    unit.mass = unit.currentEnergy + (unit.type === "HULL" ? (unit as Hull).storedEnergy : 0)

    return {
      success: true,
      energyConsumed: totalCost,
    }
  }

  /** ユニットの半径計算 */
  private calculateUnitRadius(spec: UnitSpec): number {
    const buildEnergy = UnitCostCalculator.calculateBuildEnergy(spec)

    if (spec.type === "HULL") {
      // HULLは容積も考慮
      const volumeRadius = Math.sqrt(spec.capacity / Math.PI)
      const energyRadius = Math.sqrt(buildEnergy / Math.PI)
      return volumeRadius + energyRadius
    }

    // その他のユニットは構成エネルギーのみ
    return Math.sqrt(buildEnergy / Math.PI)
  }

  /** ユニット固有フィールドの初期値生成 */
  private createSpecificFields(spec: UnitSpec): Partial<Unit> {
    switch (spec.type) {
      case "HULL":
        return {
          capacity: spec.capacity,
          storedEnergy: 0,
          attachedUnits: [],
        } as Partial<Hull>
      case "ASSEMBLER":
        return {
          assemblePower: spec.assemblePower,
          isAssembling: false,
          progress: 0,
        } as Partial<Assembler>
      case "COMPUTER":
        return {
          processingPower: spec.processingPower,
          memorySize: spec.memorySize,
          memory: new Uint8Array(spec.memorySize),
          programCounter: 0,
          registers: new Uint16Array(8),
        } as Partial<Computer>
    }
  }

  /** ユニットからスペックを取得 */
  private getUnitSpec(unit: Unit): UnitSpec {
    switch (unit.type) {
      case "HULL":
        return {
          type: "HULL",
          capacity: (unit as Hull).capacity,
        }
      case "ASSEMBLER":
        return {
          type: "ASSEMBLER",
          assemblePower: (unit as Assembler).assemblePower,
        }
      case "COMPUTER":
        return {
          type: "COMPUTER",
          processingPower: (unit as Computer).processingPower,
          memorySize: (unit as Computer).memorySize,
        }
      default:
        throw new Error(`Unknown unit type: ${unit.type}`)
    }
  }

  /** 生産中ユニットかどうかの判定 */
  public static isProducingUnit(obj: GameObject): obj is ProducingUnit {
    return "isProducing" in obj && obj.isProducing === true
  }

  /** 生産進捗率の取得（0-1） */
  public static getProductionProgress(unit: ProducingUnit): number {
    return unit.accumulatedEnergy / unit.requiredEnergy
  }
}
