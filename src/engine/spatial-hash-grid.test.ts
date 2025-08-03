/**
 * SpatialHashGrid テスト
 */

import { SpatialHashGrid } from "./spatial-hash-grid"
import type { GameObject, ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  return value as unknown as ObjectId
}

// テスト用のGameObject生成
const createTestObject = (
  id: string | number,
  x: number,
  y: number,
  radius: number
): GameObject => {
  return {
    id: createTestObjectId(id),
    type: "ENERGY",
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(0, 0),
    radius,
    energy: 100,
    mass: 100,
  }
}

describe("SpatialHashGrid", () => {
  const cellSize = 100
  const worldWidth = 1000
  const worldHeight = 1000
  let grid: SpatialHashGrid

  beforeEach(() => {
    grid = new SpatialHashGrid(cellSize, worldWidth, worldHeight)
  })

  describe("基本機能", () => {
    test("グリッドの初期化", () => {
      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(0)
      expect(debugInfo.totalObjects).toBe(0)
    })

    test("オブジェクトの登録", () => {
      const obj = createTestObject("obj1", 50, 50, 10)
      grid.register(obj)

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(1)
      expect(debugInfo.totalObjects).toBe(1)
    })

    test("オブジェクトの削除", () => {
      const obj = createTestObject("obj1", 50, 50, 10)
      grid.register(obj)
      grid.unregister(obj)

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(0)
      expect(debugInfo.totalObjects).toBe(0)
    })

    test("グリッドのクリア", () => {
      const obj1 = createTestObject("obj1", 50, 50, 10)
      const obj2 = createTestObject("obj2", 250, 250, 10)
      grid.register(obj1)
      grid.register(obj2)

      grid.clear()

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(0)
      expect(debugInfo.totalObjects).toBe(0)
    })
  })

  describe("近傍オブジェクト検索", () => {
    test("同じセル内のオブジェクトを検出", () => {
      const obj1 = createTestObject("obj1", 50, 50, 10)
      const obj2 = createTestObject("obj2", 60, 60, 10)
      grid.register(obj1)
      grid.register(obj2)

      const nearbyIds = grid.getNearbyObjects(obj1)
      expect(nearbyIds.size).toBe(1)
      expect(nearbyIds.has(createTestObjectId("obj2"))).toBe(true)
    })

    test("異なるセルのオブジェクトは検出しない", () => {
      const obj1 = createTestObject("obj1", 50, 50, 10)
      const obj2 = createTestObject("obj2", 250, 250, 10)
      grid.register(obj1)
      grid.register(obj2)

      const nearbyIds = grid.getNearbyObjects(obj1)
      expect(nearbyIds.size).toBe(0)
    })

    test("自身は近傍リストに含まれない", () => {
      const obj = createTestObject("obj1", 50, 50, 10)
      grid.register(obj)

      const nearbyIds = grid.getNearbyObjects(obj)
      expect(nearbyIds.has(obj.id)).toBe(false)
    })

    test("位置指定での近傍検索", () => {
      const obj1 = createTestObject("obj1", 50, 50, 10)
      const obj2 = createTestObject("obj2", 60, 60, 10)
      const obj3 = createTestObject("obj3", 250, 250, 10)
      grid.register(obj1)
      grid.register(obj2)
      grid.register(obj3)

      const nearbyIds = grid.getNearbyObjectsAtPosition(Vec2Utils.create(55, 55), 20)
      expect(nearbyIds.size).toBe(2)
      expect(nearbyIds.has(createTestObjectId("obj1"))).toBe(true)
      expect(nearbyIds.has(createTestObjectId("obj2"))).toBe(true)
      expect(nearbyIds.has(createTestObjectId("obj3"))).toBe(false)
    })
  })

  describe("複数セル占有", () => {
    test("大きなオブジェクトが複数セルを占有", () => {
      // セルサイズ100に対して、半径60のオブジェクトをセル境界付近に配置
      const obj = createTestObject("obj1", 95, 95, 60)
      grid.register(obj)

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(4) // 4つのセルにまたがる
      expect(debugInfo.totalObjects).toBe(4) // 各セルに1つずつ登録
    })

    test("セル境界をまたぐオブジェクトの近傍検索", () => {
      // セル(0,0)とセル(1,0)の境界
      const obj1 = createTestObject("obj1", 95, 50, 10)
      // セル(1,0)
      const obj2 = createTestObject("obj2", 105, 50, 10)
      grid.register(obj1)
      grid.register(obj2)

      const nearbyIds = grid.getNearbyObjects(obj1)
      expect(nearbyIds.size).toBe(1)
      expect(nearbyIds.has(createTestObjectId("obj2"))).toBe(true)
    })
  })

  describe("トーラス境界", () => {
    test("世界境界を超えるオブジェクトの登録", () => {
      // x座標が世界幅を超える位置
      const obj = createTestObject("obj1", worldWidth - 10, 50, 20)
      grid.register(obj)

      // 左端のセルにも登録されているはず
      const leftObj = createTestObject("obj2", 10, 50, 10)
      grid.register(leftObj)

      const nearbyIds = grid.getNearbyObjects(leftObj)
      expect(nearbyIds.size).toBe(1)
      expect(nearbyIds.has(createTestObjectId("obj1"))).toBe(true)
    })

    test("負の座標でのセル計算", () => {
      // 内部的に負の座標を処理（トーラスラップ前）
      const obj1 = createTestObject("obj1", 10, 10, 20)
      const obj2 = createTestObject("obj2", worldWidth - 10, 10, 20)
      grid.register(obj1)
      grid.register(obj2)

      // obj2の近傍にobj1が検出される
      const nearbyIds = grid.getNearbyObjects(obj2)
      expect(nearbyIds.size).toBe(1)
      expect(nearbyIds.has(createTestObjectId("obj1"))).toBe(true)
    })

    test("コーナーケース：4隅にまたがるオブジェクト", () => {
      // 世界の右下隅
      const obj = createTestObject("obj1", worldWidth - 10, worldHeight - 10, 20)
      grid.register(obj)

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(4) // 4隅すべてのセルに登録
    })
  })

  describe("パフォーマンステスト", () => {
    test("多数のオブジェクトの登録と検索", () => {
      const objects: GameObject[] = []
      const objectCount = 1000

      // ランダムに配置
      for (let i = 0; i < objectCount; i++) {
        const obj = createTestObject(
          `obj${i}`,
          Math.random() * worldWidth,
          Math.random() * worldHeight,
          5 + Math.random() * 20
        )
        objects.push(obj)
        grid.register(obj)
      }

      // デバッグ情報を確認
      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalObjects).toBeGreaterThan(0)

      // いくつかのオブジェクトで近傍検索
      for (let i = 0; i < 10; i++) {
        const nearbyIds = grid.getNearbyObjects(objects[i]!)
        // 少なくとも自分以外のオブジェクトが近くにある可能性
        expect(nearbyIds).toBeDefined()
      }
    })

    test("大量の登録・削除操作", () => {
      const objects: GameObject[] = []

      // 登録
      for (let i = 0; i < 100; i++) {
        const obj = createTestObject(`obj${i}`, i * 10, i * 10, 10)
        objects.push(obj)
        grid.register(obj)
      }

      // 削除
      for (const obj of objects) {
        grid.unregister(obj)
      }

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(0)
      expect(debugInfo.totalObjects).toBe(0)
    })
  })

  describe("エッジケース", () => {
    test("半径0のオブジェクト", () => {
      const obj = createTestObject("obj1", 50, 50, 0)
      grid.register(obj)

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalCells).toBe(1)
    })

    test("非常に大きな半径のオブジェクト", () => {
      // 世界サイズより大きな半径
      const obj = createTestObject("obj1", 500, 500, worldWidth * 2)
      grid.register(obj)

      const debugInfo = grid.getDebugInfo()
      // すべてのセルに登録される
      expect(debugInfo.totalCells).toBe(100) // 10x10グリッド
    })

    test("同じオブジェクトの重複登録", () => {
      const obj = createTestObject("obj1", 50, 50, 10)
      grid.register(obj)
      grid.register(obj) // 重複登録

      const debugInfo = grid.getDebugInfo()
      expect(debugInfo.totalObjects).toBe(1) // Setなので重複しない
    })

    test("存在しないオブジェクトの削除", () => {
      const obj = createTestObject("obj1", 50, 50, 10)
      // 登録せずに削除を試みる
      expect(() => grid.unregister(obj)).not.toThrow()
    })
  })
})
