/**
 * WorldStateManager テスト
 * ObjectId生成とユニーク性保証を含む
 */

import { WorldStateManager, DEFAULT_PARAMETERS } from "./world-state"
import type { ObjectId, GameObject, EnergySource, DirectionalForceField } from "@/types/game"
import { Vec2 } from "@/utils/vec2"

describe("WorldStateManager", () => {
  let manager: WorldStateManager
  const worldWidth = 1000
  const worldHeight = 800

  beforeEach(() => {
    manager = new WorldStateManager(worldWidth, worldHeight)
  })

  describe("初期化", () => {
    test("正しい初期状態で作成される", () => {
      const state = manager.state
      expect(state.width).toBe(worldWidth)
      expect(state.height).toBe(worldHeight)
      expect(state.tick).toBe(0)
      expect(state.objects.size).toBe(0)
      expect(state.energySources.size).toBe(0)
      expect(state.forceFields.size).toBe(0)
      expect(state.spatialIndex.size).toBe(0)
      expect(state.parameters).toEqual(DEFAULT_PARAMETERS)
    })

    test("デフォルトパラメータはEnergyParametersから生成される", () => {
      const customManager = new WorldStateManager(worldWidth, worldHeight)
      const params = customManager.state.parameters

      // パラメータが存在することを確認
      expect(params.maxForce).toBeDefined()
      expect(params.friction).toBeDefined()
      expect(params.energySourceCount).toBeDefined()
      expect(params.forceScale).toBeDefined()
      expect(params.heatDiffusionRate).toBeDefined()
    })
  })

  describe("ObjectId生成とユニーク性保証", () => {
    test("連続したユニークなIDを生成する", () => {
      const ids: ObjectId[] = []
      const count = 1000

      for (let i = 0; i < count; i++) {
        ids.push(manager.generateObjectId())
      }

      // 全てのIDがユニークであることを確認
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(count)

      // IDが連続していることを確認（1から始まる）
      for (let i = 0; i < count; i++) {
        expect(ids[i]).toBe((i + 1) as ObjectId)
      }
    })

    test("大量のID生成でも重複しない", () => {
      const ids = new Set<ObjectId>()
      const count = 100000

      for (let i = 0; i < count; i++) {
        const id = manager.generateObjectId()
        expect(ids.has(id)).toBe(false)
        ids.add(id)
      }

      expect(ids.size).toBe(count)
    })

    test("複数のWorldStateManagerインスタンス間でIDは独立している", () => {
      const manager1 = new WorldStateManager(100, 100)
      const manager2 = new WorldStateManager(100, 100)

      const id1_1 = manager1.generateObjectId()
      const id1_2 = manager1.generateObjectId()
      const id2_1 = manager2.generateObjectId()
      const id2_2 = manager2.generateObjectId()

      // 各マネージャーは独自のIDシーケンスを持つ
      expect(id1_1).toBe(1 as ObjectId)
      expect(id1_2).toBe(2 as ObjectId)
      expect(id2_1).toBe(1 as ObjectId)
      expect(id2_2).toBe(2 as ObjectId)
    })

    test("オブジェクト追加・削除後もIDは再利用されない", () => {
      const obj1: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(100, 100),
        velocity: Vec2.create(0, 0),
        radius: 10,
        energy: 100,
        mass: 100,
      }

      manager.addObject(obj1)
      const id1 = obj1.id

      // オブジェクトを削除
      manager.removeObject(id1)

      // 新しいIDを生成
      const id2 = manager.generateObjectId()
      const id3 = manager.generateObjectId()

      // 削除されたIDは再利用されない
      expect(id2).not.toBe(id1)
      expect(id3).not.toBe(id1)
      expect(id2).toBeGreaterThan(id1)
    })
  })

  describe("オブジェクト管理", () => {
    test("オブジェクトを追加・取得できる", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(100, 200),
        velocity: Vec2.create(1, 2),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      const retrieved = manager.getObject(obj.id)

      expect(retrieved).toEqual(obj)
      expect(manager.state.objects.size).toBe(1)
    })

    test("存在しないオブジェクトを取得するとundefined", () => {
      const fakeId = 999 as ObjectId
      expect(manager.getObject(fakeId)).toBeUndefined()
    })

    test("オブジェクトを削除できる", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(0, 0),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      expect(manager.state.objects.size).toBe(1)

      manager.removeObject(obj.id)
      expect(manager.state.objects.size).toBe(0)
      expect(manager.getObject(obj.id)).toBeUndefined()
    })

    test("存在しないオブジェクトの削除は何も起こらない", () => {
      const fakeId = 999 as ObjectId
      expect(() => manager.removeObject(fakeId)).not.toThrow()
    })
  })

  describe("エネルギーソース管理", () => {
    test("エネルギーソースを追加・削除できる", () => {
      const source: EnergySource = {
        id: manager.generateObjectId(),
        position: Vec2.create(500, 400),
        energyPerTick: 50,
      }

      manager.addEnergySource(source)
      expect(manager.state.energySources.size).toBe(1)
      expect(manager.state.energySources.get(source.id)).toEqual(source)

      manager.removeEnergySource(source.id)
      expect(manager.state.energySources.size).toBe(0)
    })
  })

  describe("力場管理", () => {
    test("力場を追加・削除できる", () => {
      const field: DirectionalForceField = {
        id: manager.generateObjectId(),
        type: "LINEAR",
        position: Vec2.create(500, 400),
        radius: 100,
        strength: 10,
        direction: Vec2.create(1, 0),
      }

      manager.addForceField(field)
      expect(manager.state.forceFields.size).toBe(1)
      expect(manager.state.forceFields.get(field.id)).toEqual(field)

      manager.removeForceField(field.id)
      expect(manager.state.forceFields.size).toBe(0)
    })
  })

  describe("空間インデックス", () => {
    test("オブジェクト追加時に空間インデックスが更新される", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(150, 250),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)

      // セルサイズ100なので、(150,250)は(1,2)のセルに入る
      const cellKey = `1,2`
      const cell = manager.state.spatialIndex.get(cellKey)
      expect(cell).toBeDefined()
      expect(cell?.objects.has(obj.id)).toBe(true)
    })

    test("オブジェクト削除時に空間インデックスから削除される", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(150, 250),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      const cellKey = `1,2`
      expect(manager.state.spatialIndex.get(cellKey)?.objects.has(obj.id)).toBe(true)

      manager.removeObject(obj.id)
      // 空のセルは削除される
      expect(manager.state.spatialIndex.has(cellKey)).toBe(false)
    })

    test("範囲内のオブジェクトを取得できる", () => {
      const objects: GameObject[] = [
        {
          id: manager.generateObjectId(),
          type: "ENERGY",
          position: Vec2.create(100, 100),
          velocity: Vec2.create(0, 0),
          radius: 5,
          energy: 50,
          mass: 50,
        },
        {
          id: manager.generateObjectId(),
          type: "ENERGY",
          position: Vec2.create(120, 120),
          velocity: Vec2.create(0, 0),
          radius: 5,
          energy: 50,
          mass: 50,
        },
        {
          id: manager.generateObjectId(),
          type: "ENERGY",
          position: Vec2.create(300, 300), // 遠い
          velocity: Vec2.create(0, 0),
          radius: 5,
          energy: 50,
          mass: 50,
        },
      ]

      objects.forEach(obj => manager.addObject(obj))

      const nearbyObjects = manager.getObjectsInRange(110, 110, 50)
      expect(nearbyObjects).toHaveLength(2)
      expect(nearbyObjects.some(obj => obj.id === objects[0]?.id)).toBe(true)
      expect(nearbyObjects.some(obj => obj.id === objects[1]?.id)).toBe(true)
      expect(nearbyObjects.some(obj => obj.id === objects[2]?.id)).toBe(false)
    })

    test("空間インデックスを再構築できる", () => {
      const obj1: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(50, 50),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }
      const obj2: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(250, 250),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj1)
      manager.addObject(obj2)

      // インデックスをクリアして再構築
      manager.state.spatialIndex.clear()
      expect(manager.state.spatialIndex.size).toBe(0)

      manager.rebuildSpatialIndex()
      expect(manager.state.spatialIndex.size).toBe(2)
      expect(manager.state.spatialIndex.get(`0,0`)?.objects.has(obj1.id)).toBe(true)
      expect(manager.state.spatialIndex.get(`2,2`)?.objects.has(obj2.id)).toBe(true)
    })
  })

  describe("その他の機能", () => {
    test("tickを進められる", () => {
      expect(manager.state.tick).toBe(0)
      manager.incrementTick()
      expect(manager.state.tick).toBe(1)
      manager.incrementTick()
      expect(manager.state.tick).toBe(2)
    })

    test("パラメータを更新できる", () => {
      const newParams = {
        maxForce: 15,
        friction: 0.9,
      }

      manager.updateParameters(newParams)
      expect(manager.state.parameters.maxForce).toBe(15)
      expect(manager.state.parameters.friction).toBe(0.9)
      // 他のパラメータは変更されない
      expect(manager.state.parameters.energySourceCount).toBe(DEFAULT_PARAMETERS.energySourceCount)
    })
  })

  describe("境界値テスト", () => {
    test("位置が0の場合の空間インデックス", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(0, 0),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      expect(manager.state.spatialIndex.get(`0,0`)?.objects.has(obj.id)).toBe(true)
    })

    test("負の位置の場合の空間インデックス", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(-150, -250),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      // -150/100 = -1.5 → floor = -2, -250/100 = -2.5 → floor = -3
      expect(manager.state.spatialIndex.get(`-2,-3`)?.objects.has(obj.id)).toBe(true)
    })

    test("非常に大きな範囲でのオブジェクト検索", () => {
      const obj: GameObject = {
        id: manager.generateObjectId(),
        type: "ENERGY",
        position: Vec2.create(500, 500),
        velocity: Vec2.create(0, 0),
        radius: 5,
        energy: 50,
        mass: 50,
      }

      manager.addObject(obj)
      const objects = manager.getObjectsInRange(0, 0, 10000)
      expect(objects).toHaveLength(1)
      expect(objects[0]?.id).toBe(obj.id)
    })
  })
})
