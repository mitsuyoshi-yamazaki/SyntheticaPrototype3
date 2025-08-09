import { AssemblerConstructionSystem, UnitCostCalculator } from "./assembler-construction-system"
import type { ObjectId, UnitSpec, Hull, Assembler, Computer } from "@/types/game"
import { Vec2 } from "@/utils/vec2"

describe("UnitCostCalculator", () => {
  describe("HULL cost calculation", () => {
    test("capacity 100 HULL", () => {
      const buildEnergy = UnitCostCalculator.calculateHullBuildEnergy(100)
      expect(buildEnergy).toBe(200) // 100 * 2

      const productionEnergy = UnitCostCalculator.calculateHullProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(10) // ceil(200 * 0.05)

      const spec: UnitSpec = { type: "HULL", capacity: 100 }
      expect(UnitCostCalculator.calculateTotalCost(spec)).toBe(210)
    })

    test("capacity 1000 HULL", () => {
      const buildEnergy = UnitCostCalculator.calculateHullBuildEnergy(1000)
      expect(buildEnergy).toBe(2000)

      const productionEnergy = UnitCostCalculator.calculateHullProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(100) // ceil(2000 * 0.05)
    })
  })

  describe("ASSEMBLER cost calculation", () => {
    test("assemblePower 1 ASSEMBLER", () => {
      const buildEnergy = UnitCostCalculator.calculateAssemblerBuildEnergy(1)
      expect(buildEnergy).toBe(1000) // 800 + 1 * 200

      const productionEnergy = UnitCostCalculator.calculateAssemblerProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(200) // ceil(1000 * 0.2)

      const spec: UnitSpec = { type: "ASSEMBLER", assemblePower: 1 }
      expect(UnitCostCalculator.calculateTotalCost(spec)).toBe(1200)
    })

    test("assemblePower 5 ASSEMBLER", () => {
      const buildEnergy = UnitCostCalculator.calculateAssemblerBuildEnergy(5)
      expect(buildEnergy).toBe(1800) // 800 + 5 * 200

      const productionEnergy = UnitCostCalculator.calculateAssemblerProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(360) // ceil(1800 * 0.2)
    })
  })

  describe("COMPUTER cost calculation", () => {
    test("processingPower 1, memory 64 COMPUTER", () => {
      const buildEnergy = UnitCostCalculator.calculateComputerBuildEnergy(1, 64)
      // const frequencyTerm = Math.ceil(Math.pow(1 / 5, 2) * 100) // ceil(0.04 * 100) = 5
      expect(buildEnergy).toBe(3705) // 500 + 5 + 64 * 50

      const productionEnergy = UnitCostCalculator.calculateComputerProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(371) // ceil(3705 * 0.1)

      const spec: UnitSpec = { type: "COMPUTER", processingPower: 1, memorySize: 64 }
      expect(UnitCostCalculator.calculateTotalCost(spec)).toBe(4076)
    })

    test("processingPower 10, memory 256 COMPUTER", () => {
      const buildEnergy = UnitCostCalculator.calculateComputerBuildEnergy(10, 256)
      // const frequencyTerm = Math.ceil(Math.pow(10 / 5, 2) * 100) // ceil(4 * 100) = 400
      expect(buildEnergy).toBe(13700) // 500 + 400 + 256 * 50

      const productionEnergy = UnitCostCalculator.calculateComputerProductionEnergy(buildEnergy)
      expect(productionEnergy).toBe(1370) // ceil(13700 * 0.1)
    })
  })
})

describe("AssemblerConstructionSystem", () => {
  let system: AssemblerConstructionSystem
  let nextId: number

  beforeEach(() => {
    nextId = 1
    system = new AssemblerConstructionSystem(() => nextId++ as ObjectId)
  })

  describe("startProduction", () => {
    test("HULL生産開始", () => {
      const spec: UnitSpec = { type: "HULL", capacity: 100 }
      const position = Vec2.create(50, 50)
      // const buildEnergy = 200
      // const initialCost = Math.ceil(buildEnergy * 0.05) // 10

      // エネルギー不足
      let result = system.startProduction(spec, position, 5)
      expect(result.success).toBe(false)
      expect(result.error).toContain("Insufficient energy")

      // 成功
      result = system.startProduction(spec, position, 100)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(10)
      expect(result.producingUnit).toBeDefined()

      const producingUnit = result.producingUnit!
      expect(producingUnit.type).toBe("HULL")
      expect(producingUnit.isProducing).toBe(true)
      expect(producingUnit.targetSpec).toEqual(spec)
      expect(producingUnit.requiredEnergy).toBe(200)
      expect(producingUnit.accumulatedEnergy).toBe(10)
      expect(producingUnit.mass).toBe(10)
      expect(producingUnit.energy).toBe(0) // 生産中は機能しない
    })

    test("ASSEMBLER生産開始", () => {
      const spec: UnitSpec = { type: "ASSEMBLER", assemblePower: 5 }
      const position = Vec2.create(100, 100)
      // const buildEnergy = 1800
      // const initialCost = Math.ceil(buildEnergy * 0.05) // 90

      const result = system.startProduction(spec, position, 1000)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(90)

      const producingUnit = result.producingUnit!
      expect(producingUnit.type).toBe("ASSEMBLER")
      expect(producingUnit.requiredEnergy).toBe(1800)
      expect(producingUnit.accumulatedEnergy).toBe(90)
    })

    test("半径計算", () => {
      // HULL: 容積 + エネルギー半径
      const hullSpec: UnitSpec = { type: "HULL", capacity: 100 }
      const hullResult = system.startProduction(hullSpec, Vec2.zero, 1000)
      const hullRadius = hullResult.producingUnit!.radius
      const volumeRadius = Math.sqrt(100 / Math.PI)
      const energyRadius = Math.sqrt(200 / Math.PI)
      expect(hullRadius).toBeCloseTo(volumeRadius + energyRadius)

      // ASSEMBLER: エネルギー半径のみ
      const assemblerSpec: UnitSpec = { type: "ASSEMBLER", assemblePower: 1 }
      const assemblerResult = system.startProduction(assemblerSpec, Vec2.zero, 1000)
      const assemblerRadius = assemblerResult.producingUnit!.radius
      expect(assemblerRadius).toBeCloseTo(Math.sqrt(1000 / Math.PI))
    })
  })

  describe("continueProduction", () => {
    test("生産継続と完成", () => {
      const spec: UnitSpec = { type: "HULL", capacity: 100 }
      const startResult = system.startProduction(spec, Vec2.zero, 1000)
      const producingUnit = startResult.producingUnit!

      // 生産継続（エネルギー不足）
      let result = system.continueProduction(producingUnit, 10, 0)
      expect(result.success).toBe(false)
      expect(result.error).toContain("No energy available")

      // 生産継続（部分的）
      result = system.continueProduction(producingUnit, 10, 50)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(10) // assemblePowerで制限
      expect(producingUnit.accumulatedEnergy).toBe(20) // 10 + 10
      expect(result.completedUnit).toBeUndefined()

      // 生産継続（完成）
      result = system.continueProduction(producingUnit, 200, 500)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(180) // 200 - 20
      expect(result.completedUnit).toBeDefined()

      const completedUnit = result.completedUnit as Hull
      expect(completedUnit.type).toBe("HULL")
      expect(completedUnit.energy).toBe(200)
      expect(completedUnit.currentEnergy).toBe(200)
      expect(completedUnit.buildEnergy).toBe(200)
      expect(completedUnit.capacity).toBe(100)
      expect(completedUnit.storedEnergy).toBe(0)
      expect(completedUnit.attachedUnitIds).toEqual([])
    })

    test("ASSEMBLER完成", () => {
      const spec: UnitSpec = { type: "ASSEMBLER", assemblePower: 2 }
      const startResult = system.startProduction(spec, Vec2.zero, 1000)
      const producingUnit = startResult.producingUnit!

      // 一気に完成
      const result = system.continueProduction(producingUnit, 1500, 2000)
      expect(result.success).toBe(true)
      expect(result.completedUnit).toBeDefined()

      const completedUnit = result.completedUnit as Assembler
      expect(completedUnit.type).toBe("ASSEMBLER")
      expect(completedUnit.assemblePower).toBe(2)
      expect(completedUnit.isAssembling).toBe(false)
      expect(completedUnit.progress).toBe(0)
    })

    test("COMPUTER完成", () => {
      const spec: UnitSpec = { type: "COMPUTER", processingPower: 1, memorySize: 64 }
      const startResult = system.startProduction(spec, Vec2.zero, 5000)
      const producingUnit = startResult.producingUnit!

      const result = system.continueProduction(producingUnit, 4000, 4000)
      expect(result.success).toBe(true)
      expect(result.completedUnit).toBeDefined()

      const completedUnit = result.completedUnit as Computer
      expect(completedUnit.type).toBe("COMPUTER")
      expect(completedUnit.processingPower).toBe(1)
      expect(completedUnit.memorySize).toBe(64)
      expect(completedUnit.memory.length).toBe(64)
      expect(completedUnit.programCounter).toBe(0)
      expect(completedUnit.registers.length).toBe(8)
    })
  })

  describe("repair", () => {
    test("HULL修理", () => {
      const hull: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 150,
        mass: 150,
        buildEnergy: 200,
        currentEnergy: 150, // 50ダメージ
        capacity: 100,
        storedEnergy: 0,
        attachedUnitIds: [],
      }

      // 修理コスト計算
      const cost = system.calculateRepairCost(hull, 50)
      // const productionRatio = 0.05
      const expectedRepairCost = Math.ceil(((50 * 10) / 200) * 1.1) // (50 * 生産エネルギー10 / 構成200) * 1.1
      expect(cost.energyCost).toBe(50)
      expect(cost.repairCost).toBe(expectedRepairCost)

      // エネルギー不足
      let result = system.repair(hull, 100, 10)
      expect(result.success).toBe(false)

      // 修理成功
      result = system.repair(hull, 100, 200)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(50 + expectedRepairCost)
      expect(hull.currentEnergy).toBe(200)
      expect(hull.energy).toBe(200)

      // 既に完全
      result = system.repair(hull, 100, 200)
      expect(result.success).toBe(true)
      expect(result.energyConsumed).toBe(0)
      expect(result.error).toContain("no damage")
    })

    test("ASSEMBLER修理（部分的）", () => {
      const assembler: Assembler = {
        id: 1 as ObjectId,
        type: "ASSEMBLER",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 800,
        mass: 800,
        buildEnergy: 1000,
        currentEnergy: 800, // 200ダメージ
        assemblePower: 1,
        isAssembling: false,
        progress: 0,
      }

      // assemblePowerで制限される修理
      const result = system.repair(assembler, 50, 1000)
      expect(result.success).toBe(true)
      expect(assembler.currentEnergy).toBe(850) // 50修理

      // 修理コスト: 50 + ceil((50 * 200 / 1000) * 1.1) = 50 + 11 = 61
      expect(result.energyConsumed).toBe(61)
    })
  })

  describe("ユーティリティ関数", () => {
    test("isProducingUnit", () => {
      const spec: UnitSpec = { type: "HULL", capacity: 100 }
      const result = system.startProduction(spec, Vec2.zero, 1000)
      const producingUnit = result.producingUnit!

      expect(AssemblerConstructionSystem.isProducingUnit(producingUnit)).toBe(true)

      const normalUnit: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnitIds: [],
      }

      expect(AssemblerConstructionSystem.isProducingUnit(normalUnit)).toBe(false)
    })

    test("getProductionProgress", () => {
      const spec: UnitSpec = { type: "HULL", capacity: 100 }
      const result = system.startProduction(spec, Vec2.zero, 1000)
      const producingUnit = result.producingUnit!

      expect(AssemblerConstructionSystem.getProductionProgress(producingUnit)).toBeCloseTo(0.05) // 10/200

      producingUnit.accumulatedEnergy = 100
      expect(AssemblerConstructionSystem.getProductionProgress(producingUnit)).toBeCloseTo(0.5)

      producingUnit.accumulatedEnergy = 200
      expect(AssemblerConstructionSystem.getProductionProgress(producingUnit)).toBe(1)
    })
  })
})
