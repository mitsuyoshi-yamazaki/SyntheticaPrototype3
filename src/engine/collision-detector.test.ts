/**
 * CollisionDetector テスト
 */

import { CollisionDetector } from "./collision-detector"
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
  radius: number,
  type: "ENERGY" | "HULL" = "ENERGY"
): GameObject => {
  return {
    id: createTestObjectId(id),
    type,
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(0, 0),
    radius,
    energy: 100,
    mass: 100,
  }
}

describe("CollisionDetector", () => {
  const cellSize = 100
  const worldWidth = 1000
  const worldHeight = 1000
  let detector: CollisionDetector

  beforeEach(() => {
    detector = new CollisionDetector(cellSize, worldWidth, worldHeight)
  })

  describe("基本的な衝突検出", () => {
    test("衝突していない2つのオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 300, 300, 10) // 異なるセルに配置
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(0)
      expect(result.totalChecks).toBe(0)
      expect(result.actualCollisions).toBe(0)
    })

    test("衝突している2つのオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 115, 100, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(1)
      expect(result.totalChecks).toBe(1)
      expect(result.actualCollisions).toBe(1)

      const pair = result.pairs[0]!
      expect(pair.object1).toBe(obj1)
      expect(pair.object2).toBe(obj2)
      expect(pair.distance).toBeCloseTo(15, 5)
      expect(pair.overlap).toBeCloseTo(25, 5) // 40 - 15 = 25
    })

    test("接触している2つのオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 120, 100, 10)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(0) // 接触は衝突とみなさない
      expect(result.actualCollisions).toBe(0)
    })

    test("複数オブジェクトでの衝突検出", () => {
      const objects = new Map<ObjectId, GameObject>()

      // 3つのオブジェクトが一列に並んでいる
      const obj1 = createTestObject(1, 100, 100, 25)
      const obj2 = createTestObject(2, 140, 100, 25) // obj1と衝突
      const obj3 = createTestObject(3, 180, 100, 25) // obj2と衝突
      const obj4 = createTestObject(4, 300, 300, 10) // 誰とも衝突しない

      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)
      objects.set(obj3.id, obj3)
      objects.set(obj4.id, obj4)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(2)
      expect(result.actualCollisions).toBe(2)

      // ペアの順序は保証されないので、IDでソート
      const sortedPairs = result.pairs.sort((a, b) => {
        const aId1 = a.object1.id as unknown as number
        const bId1 = b.object1.id as unknown as number
        return aId1 - bId1
      })

      expect(sortedPairs[0]!.object1.id).toBe(createTestObjectId(1))
      expect(sortedPairs[0]!.object2.id).toBe(createTestObjectId(2))
      expect(sortedPairs[1]!.object1.id).toBe(createTestObjectId(2))
      expect(sortedPairs[1]!.object2.id).toBe(createTestObjectId(3))
    })
  })

  describe("トーラス境界での衝突検出", () => {
    test("左右境界を跨ぐ衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 10, 100, 20)
      const obj2 = createTestObject(2, worldWidth - 10, 100, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(1)
      expect(result.pairs[0]!.distance).toBeCloseTo(20, 5)
      expect(result.pairs[0]!.overlap).toBeCloseTo(20, 5)
    })

    test("上下境界を跨ぐ衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 10, 20)
      const obj2 = createTestObject(2, 100, worldHeight - 10, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(1)
      expect(result.pairs[0]!.distance).toBeCloseTo(20, 5)
    })

    test("コーナーでの衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 10, 10, 20)
      const obj2 = createTestObject(2, worldWidth - 10, worldHeight - 10, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(1)
      const expectedDistance = Math.sqrt(20 * 20 + 20 * 20)
      expect(result.pairs[0]!.distance).toBeCloseTo(expectedDistance, 5)
    })
  })

  describe("位置指定での衝突検出", () => {
    test("指定位置で衝突するオブジェクトを検出", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 200, 200, 20)
      const obj3 = createTestObject(3, 110, 110, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)
      objects.set(obj3.id, obj3)

      const position = Vec2Utils.create(105, 105)
      const collisions = detector.detectCollisionsAtPosition(position, 15, objects)

      expect(collisions).toHaveLength(2)
      expect(collisions).toContain(obj1)
      expect(collisions).toContain(obj3)
      expect(collisions).not.toContain(obj2)
    })

    test("除外IDを指定して衝突検出", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 110, 100, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const position = Vec2Utils.create(105, 100)
      const collisions = detector.detectCollisionsAtPosition(position, 10, objects, obj1.id)

      expect(collisions).toHaveLength(1)
      expect(collisions[0]).toBe(obj2)
    })

    test("境界を跨ぐ位置での衝突検出", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, worldWidth - 10, 100, 20)
      objects.set(obj1.id, obj1)

      const position = Vec2Utils.create(10, 100)
      const collisions = detector.detectCollisionsAtPosition(position, 15, objects)

      expect(collisions).toHaveLength(1)
      expect(collisions[0]).toBe(obj1)
    })
  })

  describe("オブジェクトの更新", () => {
    test("オブジェクトの移動を反映", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 200, 100, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      // 初回の衝突検出
      let result = detector.detectCollisions(objects)
      expect(result.pairs).toHaveLength(0)

      // obj2を移動
      const oldObj2 = obj2
      const newObj2 = { ...obj2, position: Vec2Utils.create(115, 100) }
      objects.set(obj2.id, newObj2)
      detector.updateObject(oldObj2, newObj2)

      // 再度衝突検出
      result = detector.detectCollisions(objects)
      expect(result.pairs).toHaveLength(1)
    })
  })

  describe("パフォーマンステスト", () => {
    test("多数のオブジェクトでの衝突検出", () => {
      const objects = new Map<ObjectId, GameObject>()
      const objectCount = 100

      // グリッド状に配置（一部は衝突する）
      for (let i = 0; i < objectCount; i++) {
        const x = (i % 10) * 18 // 半径20の円が少し重なる距離
        const y = Math.floor(i / 10) * 18
        const obj = createTestObject(i, x, y, 10)
        objects.set(obj.id, obj)
      }

      const startTime = performance.now()
      const result = detector.detectCollisions(objects)
      const endTime = performance.now()

      // パフォーマンスの確認
      expect(endTime - startTime).toBeLessThan(100) // 100ms以内
      expect(result.totalChecks).toBeGreaterThan(0)
      expect(result.actualCollisions).toBeGreaterThan(0)

      // 総当たりより効率的であることを確認
      const bruteForceChecks = (objectCount * (objectCount - 1)) / 2
      expect(result.totalChecks).toBeLessThan(bruteForceChecks)
    })

    test("スパースな配置での効率性", () => {
      const objects = new Map<ObjectId, GameObject>()

      // 離れた位置に配置
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * worldWidth
        const y = Math.random() * worldHeight
        const obj = createTestObject(i, x, y, 5)
        objects.set(obj.id, obj)
      }

      const result = detector.detectCollisions(objects)

      // ほとんど衝突しないはず
      expect(result.actualCollisions).toBeLessThan(5)
      // チェック数も少ないはず
      expect(result.totalChecks).toBeLessThan(100)
    })
  })

  describe("エッジケース", () => {
    test("空のオブジェクトマップ", () => {
      const objects = new Map<ObjectId, GameObject>()
      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(0)
      expect(result.totalChecks).toBe(0)
      expect(result.actualCollisions).toBe(0)
    })

    test("1つのオブジェクトのみ", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 20)
      objects.set(obj.id, obj)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(0)
      expect(result.totalChecks).toBe(0)
    })

    test("同じ位置に複数のオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 100, 100, 10)
      const obj3 = createTestObject(3, 100, 100, 10)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)
      objects.set(obj3.id, obj3)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(3) // 3つのペア
      expect(result.actualCollisions).toBe(3)

      // すべての距離が0
      for (const pair of result.pairs) {
        expect(pair.distance).toBe(0)
        expect(pair.overlap).toBe(20) // 半径の合計
      }
    })

    test("半径0のオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 0)
      const obj2 = createTestObject(2, 100, 100, 10)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(0) // 半径0は衝突しない
    })

    test("非常に大きな半径", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 0, 0, worldWidth)
      const obj2 = createTestObject(2, worldWidth / 2, worldHeight / 2, 10)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const result = detector.detectCollisions(objects)

      expect(result.pairs).toHaveLength(1) // 巨大オブジェクトはすべてと衝突
    })
  })

  describe("デバッグ情報", () => {
    test("デバッグ情報の取得", () => {
      const objects = new Map<ObjectId, GameObject>()
      for (let i = 0; i < 10; i++) {
        const obj = createTestObject(i, i * 100, i * 100, 20)
        objects.set(obj.id, obj)
      }

      detector.detectCollisions(objects)
      const debugInfo = detector.getDebugInfo()

      expect(debugInfo.gridInfo).toBeDefined()
      expect(debugInfo.gridInfo.totalCells).toBeGreaterThan(0)
      expect(debugInfo.gridInfo.totalObjects).toBeGreaterThan(0)
    })
  })
})
