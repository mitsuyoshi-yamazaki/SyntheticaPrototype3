/**
 * ゲームオブジェクト生成ファクトリ
 */

import type {
  GameObject,
  EnergyObject,
  Hull,
  Assembler,
  Computer,
  ObjectId,
  Vec2,
  UnitSpec,
} from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { wrapPosition } from "@/utils/torus-math"

/** エネルギー量から半径を計算 */
export const calculateEnergyRadius = (energy: number): number => {
  const area = energy * 1.0 // ENERGY_TO_AREA_RATIO
  return Math.sqrt(area / Math.PI)
}

/** ユニットの半径を計算 */
export const calculateUnitRadius = (buildEnergy: number): number => {
  return calculateEnergyRadius(buildEnergy)
}

/** HULLの半径を計算 */
export const calculateHullRadius = (capacity: number, buildEnergy: number): number => {
  const volumeRadius = Math.sqrt(capacity / Math.PI)
  const energyRadius = calculateEnergyRadius(buildEnergy)
  return volumeRadius + energyRadius
}

/** HULLの構成エネルギーを計算 */
export const calculateHullBuildEnergy = (capacity: number): number => {
  return capacity * 2
}

/** ASSEMBLERの構成エネルギーを計算 */
export const calculateAssemblerBuildEnergy = (assemblePower: number): number => {
  return 8000 + assemblePower * 2000
}

/** COMPUTERの構成エネルギーを計算 */
export const calculateComputerBuildEnergy = (
  processingPower: number,
  memorySize: number
): number => {
  const frequencyComponent = Math.ceil(Math.pow(processingPower / 5, 2) * 100)
  return 500 + frequencyComponent + memorySize * 50
}

export class ObjectFactory {
  private readonly _worldWidth: number
  private readonly _worldHeight: number

  public constructor(worldWidth: number, worldHeight: number) {
    this._worldWidth = worldWidth
    this._worldHeight = worldHeight
  }

  /** エネルギーオブジェクトを作成 */
  public createEnergyObject(
    id: ObjectId,
    position: Vec2,
    energy: number,
    velocity: Vec2 = Vec2Utils.create(0, 0)
  ): EnergyObject {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)

    return {
      id,
      type: "ENERGY",
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateEnergyRadius(energy),
      energy,
      mass: energy,
    }
  }

  /** HULLを作成 */
  public createHull(
    id: ObjectId,
    position: Vec2,
    capacity: number,
    velocity: Vec2 = Vec2Utils.create(0, 0)
  ): Hull {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)
    const buildEnergy = calculateHullBuildEnergy(capacity)

    return {
      id,
      type: "HULL",
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateHullRadius(capacity, buildEnergy),
      energy: 0, // Units don't use energy property
      mass: buildEnergy,
      buildEnergy,
      currentEnergy: buildEnergy,
      capacity,
      storedEnergy: 0,
      attachedUnits: {
        hulls: [],
        assemblers: [],
        computers: [],
      },
    }
  }

  /** ASSEMBLERを作成 */
  public createAssembler(
    id: ObjectId,
    position: Vec2,
    assemblePower: number,
    parentHull?: ObjectId,
    velocity: Vec2 = Vec2Utils.create(0, 0)
  ): Assembler {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)
    const buildEnergy = calculateAssemblerBuildEnergy(assemblePower)

    return {
      id,
      type: "ASSEMBLER",
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateUnitRadius(buildEnergy),
      energy: 0, // Units don't use energy property
      mass: buildEnergy,
      buildEnergy,
      currentEnergy: buildEnergy,
      ...(parentHull !== undefined ? { parentHull } : {}),
      assemblePower,
      isAssembling: false,
      progress: 0,
    }
  }

  /** COMPUTERを作成 */
  public createComputer(
    id: ObjectId,
    position: Vec2,
    processingPower: number,
    memorySize: number,
    parentHull?: ObjectId,
    velocity: Vec2 = Vec2Utils.create(0, 0),
    program?: Uint8Array
  ): Computer {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)
    const buildEnergy = calculateComputerBuildEnergy(processingPower, memorySize)

    const memory = new Uint8Array(memorySize)
    if (program !== undefined) {
      memory.set(program.slice(0, memorySize))
    }

    return {
      id,
      type: "COMPUTER",
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateUnitRadius(buildEnergy),
      energy: 0, // Units don't use energy property
      mass: buildEnergy,
      buildEnergy,
      currentEnergy: buildEnergy,
      ...(parentHull !== undefined ? { parentHull } : {}),
      processingPower,
      memorySize,
      memory,
      programCounter: 0,
      registers: new Uint16Array(8),
      stackPointer: memorySize - 1, // スタックは最上位から下に向かって成長
      zeroFlag: false,
      carryFlag: false,
      isRunning: false,
      vmCyclesExecuted: 0,
    }
  }

  /** ユニット仕様からオブジェクトを作成 */
  public createFromSpec(
    id: ObjectId,
    spec: UnitSpec,
    position: Vec2,
    parentHull?: ObjectId
  ): GameObject {
    switch (spec.type) {
      case "HULL":
        return this.createHull(id, position, spec.capacity)

      case "ASSEMBLER":
        return this.createAssembler(id, position, spec.assemblePower, parentHull)

      case "COMPUTER":
        return this.createComputer(id, position, spec.processingPower, spec.memorySize, parentHull)

      default:
        // @ts-expect-error: Never type - all cases should be handled
        throw new Error(`Unknown object type: ${spec.type}`)
    }
  }
}
