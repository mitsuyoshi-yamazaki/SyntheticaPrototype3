/**
 * HULLエネルギー管理システムのテスト
 */

import { HullEnergyManager, DEFAULT_HULL_ENERGY_PARAMETERS } from "./hull-energy-manager"
import type { HullEnergyParameters } from "./hull-energy-manager"
import type { Hull, ObjectId, GameObject } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  return value as unknown as ObjectId
}

// テスト用のHULL生成
const createTestHull = (
  id: string | number,
  capacity: number,
  storedEnergy: number,
  currentEnergy?: number,
  buildEnergy?: number
): Hull => {
  const actualBuildEnergy = buildEnergy ?? 1100
  return {
    id: createTestObjectId(id),
    type: "HULL",
    position: Vec2Utils.create(0, 0),
    velocity: Vec2Utils.create(0, 0),
    radius: 20,
    energy: actualBuildEnergy + storedEnergy,
    mass: 100 + actualBuildEnergy + storedEnergy,
    buildEnergy: actualBuildEnergy,
    currentEnergy: currentEnergy ?? actualBuildEnergy,
    capacity,
    storedEnergy,
    attachedUnitIds: [],
  }
}

// テスト用のゲームオブジェクト生成
const createTestObject = (id: string | number, energy: number): GameObject => {
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

describe("HullEnergyManager", () => {
  let manager: HullEnergyManager

  beforeEach(() => {
    manager = new HullEnergyManager()
  })

  describe("エネルギー追加", () => {
    test("正常にエネルギーを追加", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const result = manager.addEnergy(hull, 200)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(200)
      expect(result.updatedHull.storedEnergy).toBe(700)
      expect(result.updatedHull.energy).toBe(hull.energy + 200)
      expect(result.updatedHull.mass).toBe(hull.mass + 200)
    })

    test("容量制限でエネルギー追加が部分的", () => {
      const hull = createTestHull("hull1", 1000, 900)
      const result = manager.addEnergy(hull, 200)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(100) // 残り容量分のみ
      expect(result.updatedHull.storedEnergy).toBe(1000)
    })

    test("容量満杯でエネルギー追加失敗", () => {
      const hull = createTestHull("hull1", 1000, 1000)
      const result = manager.addEnergy(hull, 100)

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("満杯")
      expect(result.updatedHull).toEqual(hull)
    })

    test("負のエネルギー量で失敗", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const result = manager.addEnergy(hull, -100)

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("正の値")
    })
  })

  describe("エネルギー消費", () => {
    test("正常にエネルギーを消費", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const result = manager.consumeEnergy(hull, 200)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(200)
      expect(result.updatedHull.storedEnergy).toBe(300)
      expect(result.updatedHull.energy).toBe(hull.energy - 200)
      expect(result.updatedHull.mass).toBe(hull.mass - 200)
    })

    test("エネルギー不足で消費失敗", () => {
      const hull = createTestHull("hull1", 1000, 100)
      const result = manager.consumeEnergy(hull, 200)

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("不足")
      expect(result.updatedHull).toEqual(hull)
    })

    test("ちょうど全エネルギーを消費", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const result = manager.consumeEnergy(hull, 500)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(500)
      expect(result.updatedHull.storedEnergy).toBe(0)
    })
  })

  describe("エネルギー転送", () => {
    test("正常にエネルギーを転送", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const target = createTestObject("target1", 100)
      const result = manager.transferEnergy(hull, target, 50)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(47) // 95%効率
      expect(result.updatedHull.storedEnergy).toBe(450)
      expect(result.updatedTarget.energy).toBe(147)
      expect(result.updatedTarget.mass).toBe(147)
    })

    test("転送レート制限", () => {
      const hull = createTestHull("hull1", 1000, 500)
      const target = createTestObject("target1", 100)
      const result = manager.transferEnergy(hull, target, 200) // レート制限は100

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(95) // 100 * 0.95
      expect(result.updatedHull.storedEnergy).toBe(400) // 100消費
    })

    test("エネルギー不足で転送失敗", () => {
      const hull = createTestHull("hull1", 1000, 50)
      const target = createTestObject("target1", 100)
      const result = manager.transferEnergy(hull, target, 100)

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("不足")
    })

    test("カスタム転送効率", () => {
      const params: HullEnergyParameters = {
        ...DEFAULT_HULL_ENERGY_PARAMETERS,
        transferEfficiency: 0.8,
      }
      manager = new HullEnergyManager(params)

      const hull = createTestHull("hull1", 1000, 500)
      const target = createTestObject("target1", 100)
      const result = manager.transferEnergy(hull, target, 100)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(80) // 100 * 0.8
      expect(result.updatedHull.storedEnergy).toBe(400) // 100消費
    })
  })

  describe("自己修復", () => {
    test("正常に修復", () => {
      const hull = createTestHull("hull1", 1000, 1000, 900) // 100ダメージ、十分なエネルギー
      const result = manager.repairHull(hull, 100)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(1000) // 100 * 10（コスト）
      expect(result.updatedHull.currentEnergy).toBe(1000) // 完全修復
      expect(result.updatedHull.storedEnergy).toBe(0) // 1000 - 1000 = 0
    })

    test("修復コストを正しく計算", () => {
      const hull = createTestHull("hull1", 1000, 500, 900) // 100ダメージ
      const result = manager.repairHull(hull, 50)

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(500) // 50 * 10
      expect(result.updatedHull.currentEnergy).toBe(950)
      expect(result.updatedHull.storedEnergy).toBe(0)
    })

    test("修復に必要なエネルギー不足", () => {
      const hull = createTestHull("hull1", 1000, 100, 900) // 100ダメージ、100エネルギー
      const result = manager.repairHull(hull, 50) // 500エネルギー必要

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("不足")
    })

    test("修復の必要がない", () => {
      const hull = createTestHull("hull1", 1000, 500) // ダメージなし
      const result = manager.repairHull(hull, 50)

      expect(result.success).toBe(false)
      expect(result.energyTransferred).toBe(0)
      expect(result.failureReason).toContain("必要がありません")
    })

    test("最大修復量の制限", () => {
      const hull = createTestHull("hull1", 3000, 2500, 900) // buildEnergy=1100, 200ダメージ、十分なエネルギー（2500）
      const result = manager.repairHull(hull, 300) // 200までしか修復できない

      expect(result.success).toBe(true)
      expect(result.energyTransferred).toBe(2000) // 200 * 10
      expect(result.updatedHull.currentEnergy).toBe(1100) // 完全修復
      expect(result.updatedHull.storedEnergy).toBe(500) // 2500 - 2000
    })
  })

  describe("アタッチユニットへの供給", () => {
    test("単一ユニットへの供給", () => {
      const hull = createTestHull("hull1", 1000, 500)
      hull.attachedUnitIds = [createTestObjectId("unit1")]

      const units = new Map<ObjectId, GameObject>()
      units.set(createTestObjectId("unit1"), createTestObject("unit1", 100))

      const requests = new Map<ObjectId, number>()
      requests.set(createTestObjectId("unit1"), 50)

      const result = manager.supplyAttachedUnits(hull, units, requests)

      expect(result.totalSupplied).toBe(47) // 50 * 0.95
      expect(result.suppliedAmounts.get(createTestObjectId("unit1"))).toBe(47)
      expect(result.updatedHull.storedEnergy).toBe(450)
    })

    test("複数ユニットへの供給", () => {
      const hull = createTestHull("hull1", 1000, 500)
      hull.attachedUnitIds = [createTestObjectId("unit1"), createTestObjectId("unit2")]

      const units = new Map<ObjectId, GameObject>()
      units.set(createTestObjectId("unit1"), createTestObject("unit1", 100))
      units.set(createTestObjectId("unit2"), createTestObject("unit2", 100))

      const requests = new Map<ObjectId, number>()
      requests.set(createTestObjectId("unit1"), 30)
      requests.set(createTestObjectId("unit2"), 40)

      const result = manager.supplyAttachedUnits(hull, units, requests)

      expect(result.totalSupplied).toBe(66) // (30 + 40) * 0.95
      expect(result.suppliedAmounts.get(createTestObjectId("unit1"))).toBe(28) // 30 * 0.95
      expect(result.suppliedAmounts.get(createTestObjectId("unit2"))).toBe(38) // 40 * 0.95
      expect(result.updatedHull.storedEnergy).toBe(430)
    })

    test("転送レート制限での供給", () => {
      const hull = createTestHull("hull1", 1000, 500)
      hull.attachedUnitIds = [createTestObjectId("unit1"), createTestObjectId("unit2")]

      const units = new Map<ObjectId, GameObject>()
      units.set(createTestObjectId("unit1"), createTestObject("unit1", 100))
      units.set(createTestObjectId("unit2"), createTestObject("unit2", 100))

      const requests = new Map<ObjectId, number>()
      requests.set(createTestObjectId("unit1"), 60)
      requests.set(createTestObjectId("unit2"), 60) // 合計120だが、レート制限100

      const result = manager.supplyAttachedUnits(hull, units, requests)

      expect(result.updatedHull.storedEnergy).toBe(400) // 100消費
      expect(result.totalSupplied).toBeLessThanOrEqual(95) // 100 * 0.95
    })
  })

  describe("ユーティリティメソッド", () => {
    test("残り容量の取得", () => {
      const hull = createTestHull("hull1", 1000, 300)
      expect(manager.getRemainingCapacity(hull)).toBe(700)

      const fullHull = createTestHull("hull2", 1000, 1000)
      expect(manager.getRemainingCapacity(fullHull)).toBe(0)
    })

    test("充填率の取得", () => {
      const hull = createTestHull("hull1", 1000, 500)
      expect(manager.getFillRate(hull)).toBe(0.5)

      const emptyHull = createTestHull("hull2", 1000, 0)
      expect(manager.getFillRate(emptyHull)).toBe(0)

      const fullHull = createTestHull("hull3", 1000, 1000)
      expect(manager.getFillRate(fullHull)).toBe(1)
    })

    test("損傷率の取得", () => {
      const hull = createTestHull("hull1", 1000, 500, 900) // buildEnergy=1100, currentEnergy=900, 200ダメージ
      const buildEnergy = hull.buildEnergy
      expect(manager.getDamageRate(hull)).toBeCloseTo(200 / buildEnergy)

      const undamagedHull = createTestHull("hull2", 1000, 500)
      expect(manager.getDamageRate(undamagedHull)).toBe(0)

      const destroyedHull = createTestHull("hull3", 1000, 500, 0)
      expect(manager.getDamageRate(destroyedHull)).toBe(1)
    })
  })
})
