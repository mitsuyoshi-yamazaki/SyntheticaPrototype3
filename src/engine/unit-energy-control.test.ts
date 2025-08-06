import { UnitEnergyControlSystem, ENERGY_SUBCOMMANDS } from "./unit-energy-control"
import { ObjectFactory } from "./object-factory"
import type { Unit, Hull, ObjectId } from "@/types/game"

describe("UnitEnergyControlSystem", () => {
  let factory: ObjectFactory
  let unit: Unit
  let hull: Hull

  beforeEach(() => {
    factory = new ObjectFactory(1000, 1000)
    hull = factory.createHull(
      1 as ObjectId,
      { x: 100, y: 100 },
      1024 // 容量
    )
    unit = factory.createComputer(
      2 as ObjectId,
      { x: 100, y: 100 },
      10,
      256,
      hull.id // parentHull
    )
  })

  describe("executeEnergyCommand", () => {
    test("GET_UNIT_ENERGY", () => {
      unit.currentEnergy = 500
      
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY
      )
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(500)
    })

    test("GET_BUILD_ENERGY", () => {
      unit.buildEnergy = 1234
      
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.GET_BUILD_ENERGY
      )
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(1234)
    })

    test("不明なサブコマンド", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        0xFF // 不明なサブコマンド
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain("Unknown energy subcommand")
      expect(result.error).toContain("0xff")
    })
  })

  describe("HULL関連コマンド（現状は未実装）", () => {
    test("GET_HULL_ENERGY - HULLなし", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.GET_HULL_ENERGY
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain("not attached to a HULL")
    })

    test("GET_HULL_CAPACITY - HULLなし", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.GET_HULL_CAPACITY
      )
      
      expect(result.success).toBe(false)
    })

    test("GET_COLLECTING_STATE - HULLなし", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.GET_COLLECTING_STATE
      )
      
      expect(result.success).toBe(false)
    })

    test("START_COLLECTING - HULLなし", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.START_COLLECTING
      )
      
      expect(result.success).toBe(false)
    })

    test("STOP_COLLECTING - HULLなし", () => {
      const result = UnitEnergyControlSystem.executeEnergyCommand(
        unit,
        ENERGY_SUBCOMMANDS.STOP_COLLECTING
      )
      
      expect(result.success).toBe(false)
    })
  })

  describe("getParentHull", () => {
    test("現在は常にnullを返す（TODO）", () => {
      const result = UnitEnergyControlSystem.getParentHull(unit)
      expect(result).toBeNull()
    })
  })
})