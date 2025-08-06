/**
 * エネルギー自然崩壊システムのテスト
 */

import { EnergyDecaySystem } from "./energy-decay-system"
import type { EnergyDecayParameters } from "./energy-decay-system"
import type { EnergyObject, ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: number): ObjectId => {
  return value as ObjectId
}

// テスト用のエネルギーオブジェクト生成
const createTestEnergyObject = (id: number, energy: number): EnergyObject => {
  return {
    id: createTestObjectId(id),
    type: "ENERGY",
    position: Vec2Utils.create(0, 0),
    velocity: Vec2Utils.create(0, 0),
    radius: 10,
    energy,
    mass: energy,
  }
}

describe("EnergyDecaySystem", () => {
  let system: EnergyDecaySystem

  beforeEach(() => {
    system = new EnergyDecaySystem()
  })

  describe("崩壊量の計算", () => {
    test("崩壊量の計算式が正しい", () => {
      // ceil(sqrt(energy) / 10)
      expect(system.calculateDecayAmount(1)).toBe(1) // ceil(1/10) = 1
      expect(system.calculateDecayAmount(10)).toBe(1) // ceil(3.16/10) = 1
      expect(system.calculateDecayAmount(100)).toBe(1) // ceil(10/10) = 1
      expect(system.calculateDecayAmount(400)).toBe(2) // ceil(20/10) = 2
      expect(system.calculateDecayAmount(1000)).toBe(4) // ceil(31.62/10) = 4
      expect(system.calculateDecayAmount(2500)).toBe(5) // ceil(50/10) = 5
      expect(system.calculateDecayAmount(10000)).toBe(10) // ceil(100/10) = 10
    })

    test("カスタム除数での計算", () => {
      const params: EnergyDecayParameters = {
        decayRateDivisor: 5,
      }
      system = new EnergyDecaySystem(params)

      expect(system.calculateDecayAmount(100)).toBe(2) // ceil(10/5) = 2
      expect(system.calculateDecayAmount(400)).toBe(4) // ceil(20/5) = 4
    })
  })

  describe("エネルギー崩壊処理", () => {
    test("単一エネルギーオブジェクトの崩壊", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>([
        [createTestObjectId(1), createTestEnergyObject(1, 100)],
      ])

      const result = system.processDecay(energyObjects)

      expect(result.decayedIds).toHaveLength(1)
      expect(result.removedIds).toHaveLength(0)
      expect(result.totalHeatGenerated).toBe(1) // 100Eから1E崩壊
      expect(result.updatedObjects.size).toBe(1)

      const updated = result.updatedObjects.get(createTestObjectId(1))
      expect(updated?.energy).toBe(99)
      expect(updated?.mass).toBe(99)
    })

    test("複数エネルギーオブジェクトの崩壊", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>([
        [createTestObjectId(1), createTestEnergyObject(1, 100)], // 1E崩壊
        [createTestObjectId(2), createTestEnergyObject(2, 400)], // 2E崩壊
        [createTestObjectId(3), createTestEnergyObject(3, 1000)], // 4E崩壊
      ])

      const result = system.processDecay(energyObjects)

      expect(result.decayedIds).toHaveLength(3)
      expect(result.removedIds).toHaveLength(0)
      expect(result.totalHeatGenerated).toBe(7) // 1 + 2 + 4
      expect(result.updatedObjects.size).toBe(3)

      expect(result.updatedObjects.get(createTestObjectId(1))?.energy).toBe(99)
      expect(result.updatedObjects.get(createTestObjectId(2))?.energy).toBe(398)
      expect(result.updatedObjects.get(createTestObjectId(3))?.energy).toBe(996)
    })

    test("完全崩壊によるオブジェクト削除", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>([
        [createTestObjectId(1), createTestEnergyObject(1, 1)], // 1E崩壊で消滅
        [createTestObjectId(2), createTestEnergyObject(2, 100)], // 1E崩壊で残存
      ])

      const result = system.processDecay(energyObjects)

      expect(result.decayedIds).toHaveLength(1) // ID 2のみ
      expect(result.removedIds).toHaveLength(1) // ID 1が削除
      expect(result.removedIds[0]).toBe(createTestObjectId(1))
      expect(result.totalHeatGenerated).toBe(2) // 1 + 1
      expect(result.updatedObjects.size).toBe(1)
      expect(result.updatedObjects.has(createTestObjectId(1))).toBe(false)
    })

    test("空のマップでの処理", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()

      const result = system.processDecay(energyObjects)

      expect(result.decayedIds).toHaveLength(0)
      expect(result.removedIds).toHaveLength(0)
      expect(result.totalHeatGenerated).toBe(0)
      expect(result.updatedObjects.size).toBe(0)
    })
  })

  describe("半減期の推定", () => {
    test("小さなエネルギーの半減期", () => {
      const halfLife1 = system.estimateHalfLife(1)
      expect(halfLife1).toBe(1) // 1tickで消滅（1E → 0.5E以下）

      const halfLife10 = system.estimateHalfLife(10)
      expect(halfLife10).toBeLessThan(10)
    })

    test("中規模エネルギーの半減期", () => {
      const halfLife100 = system.estimateHalfLife(100)
      expect(halfLife100).toBeGreaterThan(30)
      expect(halfLife100).toBeLessThan(60)

      const halfLife1000 = system.estimateHalfLife(1000)
      expect(halfLife1000).toBeGreaterThan(150)
      expect(halfLife1000).toBeLessThan(200)
    })

    test("大規模エネルギーの半減期", () => {
      const halfLife10000 = system.estimateHalfLife(10000)
      expect(halfLife10000).toBeGreaterThan(500)
      expect(halfLife10000).toBeLessThan(600)
    })
  })
})
