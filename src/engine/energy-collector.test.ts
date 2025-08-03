/**
 * エネルギー収集システムのテスト
 */

import { EnergyCollector, DEFAULT_COLLECTOR_PARAMETERS } from "./energy-collector"
import type { EnergyCollectorParameters } from "./energy-collector"
import type { ObjectId, EnergyObject, Hull } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  return value as unknown as ObjectId
}

// テスト用のHULL生成
const createTestHull = (
  id: string | number,
  x: number,
  y: number,
  radius: number,
  energy: number = 1000
): Hull => {
  return {
    id: createTestObjectId(id),
    type: "HULL",
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(0, 0),
    radius,
    energy,
    mass: 100 + energy, // 本体質量100 + エネルギー
    spec: {
      type: "PRIME",
      maxEnergy: 10000,
    },
    mountedUnits: [],
  }
}

// テスト用のエネルギーオブジェクト生成
const createTestEnergyObject = (
  id: string | number,
  x: number,
  y: number,
  energy: number
): EnergyObject => {
  return {
    id: createTestObjectId(id),
    type: "ENERGY",
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(0, 0),
    radius: Math.sqrt(energy) * 0.5, // 仮の半径計算
    energy,
    mass: energy,
  }
}

describe("EnergyCollector", () => {
  let collector: EnergyCollector
  const worldWidth = 1000
  const worldHeight = 1000

  beforeEach(() => {
    collector = new EnergyCollector(worldWidth, worldHeight)
  })

  describe("基本的なエネルギー収集", () => {
    test("範囲内のエネルギーを収集", () => {
      const hull = createTestHull("hull1", 500, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // HULLの近くにエネルギーオブジェクトを配置
      const energy1 = createTestEnergyObject("e1", 520, 500, 100) // 20単位離れている
      const energy2 = createTestEnergyObject("e2", 500, 520, 50) // 20単位離れている
      energyObjects.set(energy1.id, energy1)
      energyObjects.set(energy2.id, energy2)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(2)
      expect(result.collectedIds).toContain(energy1.id)
      expect(result.collectedIds).toContain(energy2.id)
      expect(result.totalEnergy).toBe(150)
      expect(result.updatedHull.energy).toBe(1150)
      expect(result.updatedHull.mass).toBe(100 + 1150)
    })

    test("範囲外のエネルギーは収集しない", () => {
      const hull = createTestHull("hull1", 500, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // HULLから離れた位置にエネルギーオブジェクトを配置
      const energy1 = createTestEnergyObject("e1", 600, 500, 100) // 100単位離れている
      const energy2 = createTestEnergyObject("e2", 500, 600, 50) // 100単位離れている
      energyObjects.set(energy1.id, energy1)
      energyObjects.set(energy2.id, energy2)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(0)
      expect(result.totalEnergy).toBe(0)
      expect(result.updatedHull.energy).toBe(1000)
    })

    test("より近いエネルギーを優先して収集", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxCollectPerTick: 2,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // 異なる距離にエネルギーオブジェクトを配置
      const energy1 = createTestEnergyObject("e1", 510, 500, 100) // 10単位
      const energy2 = createTestEnergyObject("e2", 515, 500, 50) // 15単位
      const energy3 = createTestEnergyObject("e3", 520, 500, 75) // 20単位
      const energy4 = createTestEnergyObject("e4", 525, 500, 25) // 25単位
      energyObjects.set(energy1.id, energy1)
      energyObjects.set(energy2.id, energy2)
      energyObjects.set(energy3.id, energy3)
      energyObjects.set(energy4.id, energy4)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(2)
      expect(result.collectedIds).toContain(energy1.id) // 最も近い
      expect(result.collectedIds).toContain(energy2.id) // 2番目に近い
      expect(result.totalEnergy).toBe(150)
    })

    test("最大収集数の制限", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxCollectPerTick: 3,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // 5つのエネルギーオブジェクトを近くに配置
      for (let i = 0; i < 5; i++) {
        const energy = createTestEnergyObject(`e${i}`, 510 + i * 2, 500, 50)
        energyObjects.set(energy.id, energy)
      }

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(3) // 最大3つまで
      expect(result.totalEnergy).toBe(150)
    })
  })

  describe("容量制限付きの収集", () => {
    test("容量制限に達するまで収集", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxHullCapacity: 1200,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1000) // 現在1000E
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      const energy1 = createTestEnergyObject("e1", 510, 500, 100)
      const energy2 = createTestEnergyObject("e2", 515, 500, 150) // これを収集すると容量オーバー
      const energy3 = createTestEnergyObject("e3", 520, 500, 50)
      energyObjects.set(energy1.id, energy1)
      energyObjects.set(energy2.id, energy2)
      energyObjects.set(energy3.id, energy3)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(2)
      expect(result.collectedIds).toContain(energy1.id)
      expect(result.collectedIds).toContain(energy3.id)
      expect(result.collectedIds).not.toContain(energy2.id) // 容量オーバーのため収集されない
      expect(result.totalEnergy).toBe(150)
      expect(result.updatedHull.energy).toBe(1150)
    })

    test("容量いっぱいの場合は収集しない", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxHullCapacity: 1000,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1000) // すでに容量いっぱい
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      const energy1 = createTestEnergyObject("e1", 510, 500, 100)
      energyObjects.set(energy1.id, energy1)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(0)
      expect(result.totalEnergy).toBe(0)
      expect(result.updatedHull.energy).toBe(1000)
    })
  })

  describe("複数HULLによる競合収集", () => {
    test("より近いHULLが優先して収集", () => {
      const hull1 = createTestHull("hull1", 490, 500, 20, 1000)
      const hull2 = createTestHull("hull2", 510, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // 中間地点にエネルギーオブジェクトを配置
      const energy = createTestEnergyObject("e1", 500, 500, 100)
      energyObjects.set(energy.id, energy)

      const results = collector.collectEnergyMultiple([hull1, hull2], energyObjects)

      const result1 = results.get(hull1.id)!
      const result2 = results.get(hull2.id)!

      // hull1の方が近いので収集
      expect(result1.collectedIds).toHaveLength(1)
      expect(result1.collectedIds).toContain(energy.id)
      expect(result1.totalEnergy).toBe(100)

      // hull2は収集できない
      expect(result2.collectedIds).toHaveLength(0)
      expect(result2.totalEnergy).toBe(0)
    })

    test("複数のエネルギーを複数のHULLで分け合う", () => {
      const hull1 = createTestHull("hull1", 200, 200, 20, 1000)
      const hull2 = createTestHull("hull2", 800, 800, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // 各HULLの近くにエネルギーを配置
      const energy1 = createTestEnergyObject("e1", 210, 200, 50) // hull1の近く
      const energy2 = createTestEnergyObject("e2", 790, 800, 75) // hull2の近く
      const energy3 = createTestEnergyObject("e3", 500, 500, 100) // 中間（どちらからも遠い）
      energyObjects.set(energy1.id, energy1)
      energyObjects.set(energy2.id, energy2)
      energyObjects.set(energy3.id, energy3)

      const results = collector.collectEnergyMultiple([hull1, hull2], energyObjects)

      const result1 = results.get(hull1.id)!
      const result2 = results.get(hull2.id)!

      expect(result1.collectedIds).toHaveLength(1)
      expect(result1.collectedIds).toContain(energy1.id)
      expect(result1.totalEnergy).toBe(50)

      expect(result2.collectedIds).toHaveLength(1)
      expect(result2.collectedIds).toContain(energy2.id)
      expect(result2.totalEnergy).toBe(75)
    })
  })

  describe("トーラス境界での収集", () => {
    test("境界を跨いだ収集", () => {
      const hull = createTestHull("hull1", 10, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()
      
      // 反対側の境界近くにエネルギーを配置
      const energy = createTestEnergyObject("e1", worldWidth - 15, 500, 100)
      energyObjects.set(energy.id, energy)

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(1)
      expect(result.collectedIds).toContain(energy.id)
      expect(result.totalEnergy).toBe(100)
    })
  })

  describe("ユーティリティメソッド", () => {
    test("収集可能チェック", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxHullCapacity: 2000,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1500)

      expect(collector.canCollect(hull, 400)).toBe(true)
      expect(collector.canCollect(hull, 500)).toBe(true)
      expect(collector.canCollect(hull, 600)).toBe(false)
    })

    test("残り容量の取得", () => {
      const params: EnergyCollectorParameters = {
        ...DEFAULT_COLLECTOR_PARAMETERS,
        maxHullCapacity: 2000,
      }
      collector = new EnergyCollector(worldWidth, worldHeight, params)

      const hull = createTestHull("hull1", 500, 500, 20, 1500)

      expect(collector.getRemainingCapacity(hull)).toBe(500)
    })

    test("容量無制限の場合", () => {
      const hull = createTestHull("hull1", 500, 500, 20, 10000)

      expect(collector.canCollect(hull, 999999)).toBe(true)
      expect(collector.getRemainingCapacity(hull)).toBeNull()
    })
  })

  describe("エッジケース", () => {
    test("エネルギーオブジェクトが空の場合", () => {
      const hull = createTestHull("hull1", 500, 500, 20, 1000)
      const energyObjects = new Map<ObjectId, EnergyObject>()

      const result = collector.collectEnergy(hull, energyObjects)

      expect(result.collectedIds).toHaveLength(0)
      expect(result.totalEnergy).toBe(0)
      expect(result.updatedHull.energy).toBe(1000)
    })

    test("HULLが空の配列の場合", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()
      const energy = createTestEnergyObject("e1", 500, 500, 100)
      energyObjects.set(energy.id, energy)

      const results = collector.collectEnergyMultiple([], energyObjects)

      expect(results.size).toBe(0)
    })
  })
})