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
  AgentDefinition,
  EnergyType,
  HullType,
  AssemblerType,
  ComputerType,
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
      type: "ENERGY" as EnergyType,
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
    buildEnergy: number,
    capacity: number,
    velocity: Vec2 = Vec2Utils.create(0, 0)
  ): Hull {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)

    return {
      id,
      type: "HULL" as HullType,
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateHullRadius(capacity, buildEnergy),
      energy: buildEnergy,
      mass: buildEnergy,
      buildEnergy,
      currentEnergy: buildEnergy,
      capacity,
      storedEnergy: 0,
      attachedUnits: [],
    }
  }

  /** ASSEMBLERを作成 */
  public createAssembler(
    id: ObjectId,
    position: Vec2,
    buildEnergy: number,
    assemblePower: number,
    parentHull?: ObjectId,
    velocity: Vec2 = Vec2Utils.create(0, 0)
  ): Assembler {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)

    return {
      id,
      type: "ASSEMBLER" as AssemblerType,
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateUnitRadius(buildEnergy),
      energy: buildEnergy,
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
    buildEnergy: number,
    processingPower: number,
    memorySize: number,
    parentHull?: ObjectId,
    velocity: Vec2 = Vec2Utils.create(0, 0),
    program?: Uint8Array
  ): Computer {
    const wrappedPos = wrapPosition(position, this._worldWidth, this._worldHeight)

    const memory = new Uint8Array(memorySize)
    if (program !== undefined) {
      memory.set(program.slice(0, memorySize))
    }

    return {
      id,
      type: "COMPUTER" as ComputerType,
      position: wrappedPos,
      velocity: { ...velocity },
      radius: calculateUnitRadius(buildEnergy),
      energy: buildEnergy,
      mass: buildEnergy,
      buildEnergy,
      currentEnergy: buildEnergy,
      ...(parentHull !== undefined ? { parentHull } : {}),
      processingPower,
      memorySize,
      memory,
      programCounter: 0,
      registers: new Uint16Array(8),
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
        return this.createHull(id, position, spec.buildEnergy, spec.capacity ?? 100)

      case "ASSEMBLER":
        return this.createAssembler(
          id,
          position,
          spec.buildEnergy,
          spec.assemblePower ?? 1,
          parentHull
        )

      case "COMPUTER":
        return this.createComputer(
          id,
          position,
          spec.buildEnergy,
          spec.processingPower ?? 1,
          spec.memorySize ?? 0,
          parentHull
        )

      case "ENERGY":
        return this.createEnergyObject(id, position, spec.buildEnergy)

      default:
        throw new Error(`Unknown object type: ${String(spec.type)}`)
    }
  }

  /** エージェント定義からオブジェクト群を作成 */
  public createAgent(
    generateId: () => ObjectId,
    definition: AgentDefinition,
    position?: Vec2
  ): GameObject[] {
    const objects: GameObject[] = []

    // 位置を決定
    const agentPos =
      position ??
      definition.position ??
      Vec2Utils.create(Math.random() * this._worldWidth, Math.random() * this._worldHeight)

    // HULLを作成
    const hullId = generateId()
    const hull = this.createHull(
      hullId,
      agentPos,
      definition.hull.buildEnergy,
      definition.hull.capacity
    )
    objects.push(hull)

    // ユニットを作成してHULLに固定
    for (const unitDef of definition.units) {
      const unitId = generateId()

      let unit: GameObject
      switch (unitDef.type) {
        case "ASSEMBLER":
          unit = this.createAssembler(
            unitId,
            agentPos,
            unitDef.buildEnergy,
            unitDef.assemblePower ?? 1,
            hullId
          )
          break

        case "COMPUTER":
          unit = this.createComputer(
            unitId,
            agentPos,
            unitDef.buildEnergy,
            unitDef.processingPower ?? 1,
            unitDef.memorySize ?? 0,
            hullId,
            Vec2Utils.create(0, 0),
            unitDef.program
          )
          break

        default:
          throw new Error(`Unknown unit type: ${String(unitDef.type)}`)
      }

      objects.push(unit)
      hull.attachedUnits.push(unitId)
    }

    return objects
  }
}
