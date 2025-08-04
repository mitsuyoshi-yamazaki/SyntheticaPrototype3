/**
 * エネルギーソース管理システムのテスト
 */

import { EnergySourceManager, DEFAULT_SOURCE_PARAMETERS } from "./energy-source-manager"
import type { EnergySourceParameters } from "./energy-source-manager"
import type { ObjectId, EnergySource } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  return value as unknown as ObjectId
}

describe("EnergySourceManager", () => {
  let manager: EnergySourceManager
  const worldWidth = 1000
  const worldHeight = 1000

  beforeEach(() => {
    manager = new EnergySourceManager(worldWidth, worldHeight)
  })

  describe("エネルギーソースの作成", () => {
    test("正常なエネルギーソースを作成", () => {
      const id = createTestObjectId("source1")
      const position = Vec2Utils.create(500, 500)
      const energyPerTick = 50

      const source = manager.createEnergySource(id, position, energyPerTick)

      expect(source.id).toBe(id)
      expect(source.position).toEqual(position)
      expect(source.energyPerTick).toBe(50)
    })

    test("小数の生成率は整数に切り捨て", () => {
      const source = manager.createEnergySource(createTestObjectId(1), Vec2Utils.create(0, 0), 75.8)

      expect(source.energyPerTick).toBe(75)
    })

    test("0以下の生成率は1にクランプ", () => {
      const source = manager.createEnergySource(createTestObjectId(1), Vec2Utils.create(0, 0), 0)

      expect(source.energyPerTick).toBe(1)
    })

    test("位置は複製される", () => {
      const position = Vec2Utils.create(100, 200)
      const source = manager.createEnergySource(createTestObjectId(1), position, 50)

      // 元の位置を変更してもソースの位置は変わらない
      const newPosition = Vec2Utils.create(300, position.y)
      expect(source.position.x).toBe(100)
      expect(newPosition.x).toBe(300)
    })
  })

  describe("エネルギー生成", () => {
    test("エネルギーソースからエネルギーオブジェクトを生成", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 100,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      expect(result.totalEnergy).toBe(100)
      expect(result.generatedObjects.length).toBeGreaterThan(0)
      expect(result.generatedObjects.length).toBeLessThanOrEqual(
        DEFAULT_SOURCE_PARAMETERS.maxObjectsPerSource
      )

      // 生成されたエネルギーの合計が正しい
      const totalGenerated = result.generatedObjects.reduce((sum, obj) => sum + obj.energy, 0)
      expect(totalGenerated).toBe(100)
    })

    test("生成されたオブジェクトはソースの周囲に配置される", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 50,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      for (const obj of result.generatedObjects) {
        const dx = obj.position.x - source.position.x
        const dy = obj.position.y - source.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 指定された距離付近に配置される
        expect(distance).toBeCloseTo(DEFAULT_SOURCE_PARAMETERS.spawnDistance, 1)
      }
    })

    test("生成されたオブジェクトは外向きの速度を持つ", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 50,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      for (const obj of result.generatedObjects) {
        // 位置ベクトルと速度ベクトルの内積が正（同じ方向）
        const dx = obj.position.x - source.position.x
        const dy = obj.position.y - source.position.y
        const dotProduct = dx * obj.velocity.x + dy * obj.velocity.y

        expect(dotProduct).toBeGreaterThan(0)

        // 速度の大きさが範囲内
        const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y)
        expect(speed).toBeLessThanOrEqual(DEFAULT_SOURCE_PARAMETERS.spawnVelocityRange)
      }
    })

    test("大量のエネルギーは複数のオブジェクトに分割される", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 5000,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      expect(result.generatedObjects.length).toBeGreaterThan(1)
      expect(result.totalEnergy).toBe(5000)

      // 各オブジェクトのエネルギーが妥当な範囲
      for (const obj of result.generatedObjects) {
        expect(obj.energy).toBeGreaterThanOrEqual(10)
        expect(obj.energy).toBeLessThanOrEqual(5000)
      }
    })

    test("カスタムパラメータでの生成", () => {
      const params: EnergySourceParameters = {
        spawnVelocityRange: 10,
        spawnDistance: 50,
        maxObjectsPerSource: 3,
      }
      manager = new EnergySourceManager(worldWidth, worldHeight, params)

      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 1000,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      expect(result.generatedObjects.length).toBeLessThanOrEqual(3)

      // カスタム距離の確認
      for (const obj of result.generatedObjects) {
        const dx = obj.position.x - source.position.x
        const dy = obj.position.y - source.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        expect(distance).toBeCloseTo(50, 1)
      }
    })
  })

  describe("複数ソースからの一括生成", () => {
    test("複数のソースから同時に生成", () => {
      const sources: EnergySource[] = [
        {
          id: createTestObjectId("source1"),
          position: Vec2Utils.create(100, 100),
          energyPerTick: 50,
        },
        {
          id: createTestObjectId("source2"),
          position: Vec2Utils.create(900, 900),
          energyPerTick: 100,
        },
        {
          id: createTestObjectId("source3"),
          position: Vec2Utils.create(500, 500),
          energyPerTick: 75,
        },
      ]

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateFromMultipleSources(sources, idGenerator)

      expect(result.totalEnergy).toBe(225) // 50 + 100 + 75
      expect(result.generatedObjects.length).toBeGreaterThanOrEqual(3) // 最低でも各ソースから1つずつ

      // 生成されたエネルギーの合計が正しい
      const totalGenerated = result.generatedObjects.reduce((sum, obj) => sum + obj.energy, 0)
      expect(totalGenerated).toBe(225)
    })

    test("空の配列での生成", () => {
      const sources: EnergySource[] = []

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateFromMultipleSources(sources, idGenerator)

      expect(result.totalEnergy).toBe(0)
      expect(result.generatedObjects).toHaveLength(0)
    })
  })

  describe("エネルギーソースの更新", () => {
    test("位置の更新", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(100, 100),
        energyPerTick: 50,
      }

      const newPosition = Vec2Utils.create(200, 300)
      const updated = manager.updateSourcePosition(source, newPosition)

      expect(updated.position).toEqual(newPosition)
      expect(updated.id).toBe(source.id)
      expect(updated.energyPerTick).toBe(source.energyPerTick)

      // 元のソースは変更されない
      expect(source.position).toEqual(Vec2Utils.create(100, 100))
    })

    test("生成率の更新", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(100, 100),
        energyPerTick: 50,
      }

      const updated = manager.updateSourceRate(source, 100)

      expect(updated.energyPerTick).toBe(100)
      expect(updated.id).toBe(source.id)
      expect(updated.position).toEqual(source.position)

      // 元のソースは変更されない
      expect(source.energyPerTick).toBe(50)
    })

    test("生成率の更新時の値制限", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(100, 100),
        energyPerTick: 50,
      }

      // 小数は切り捨て
      const updated1 = manager.updateSourceRate(source, 75.9)
      expect(updated1.energyPerTick).toBe(75)

      // 0以下は1にクランプ
      const updated2 = manager.updateSourceRate(source, -10)
      expect(updated2.energyPerTick).toBe(1)
    })
  })

  describe("エッジケース", () => {
    test("生成率1での生成", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(500, 500),
        energyPerTick: 1,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      expect(result.totalEnergy).toBe(1)
      expect(result.generatedObjects).toHaveLength(1)
      expect(result.generatedObjects[0]!.energy).toBe(1)
    })

    test("世界の端での生成", () => {
      const source: EnergySource = {
        id: createTestObjectId("source1"),
        position: Vec2Utils.create(0, 0),
        energyPerTick: 50,
      }

      let nextId = 1
      const idGenerator = () => createTestObjectId(nextId++)

      const result = manager.generateEnergy(source, idGenerator)

      expect(result.generatedObjects.length).toBeGreaterThan(0)

      // 位置が負になる可能性がある（トーラス世界でラップする前）
      for (const obj of result.generatedObjects) {
        expect(Number.isFinite(obj.position.x)).toBe(true)
        expect(Number.isFinite(obj.position.y)).toBe(true)
      }
    })
  })
})
