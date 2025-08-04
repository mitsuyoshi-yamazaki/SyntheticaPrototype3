/**
 * 物理演算エンジンのテスト
 */

import { PhysicsEngine, DEFAULT_PHYSICS_PARAMETERS } from "./physics-engine"
import type { PhysicsParameters } from "./physics-engine"
import type { GameObject, ObjectId, DirectionalForceField } from "@/types/game"
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
  vx: number = 0,
  vy: number = 0,
  mass: number = 100,
  type: "ENERGY" | "HULL" = "ENERGY"
): GameObject => {
  return {
    id: createTestObjectId(id),
    type,
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(vx, vy),
    radius,
    energy: mass,
    mass,
  }
}

describe("PhysicsEngine", () => {
  const cellSize = 100
  const worldWidth = 1000
  const worldHeight = 1000
  let engine: PhysicsEngine

  beforeEach(() => {
    engine = new PhysicsEngine(cellSize, worldWidth, worldHeight)
  })

  describe("基本的な物理演算", () => {
    test("衝突していないオブジェクトは等速直線運動", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 10, 10, 0) // 右に移動
      const obj2 = createTestObject(2, 500, 500, 10, 0, 10) // 下に移動
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const deltaTime = 1.0
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated1 = objects.get(obj1.id)!
      const updated2 = objects.get(obj2.id)!

      // 摩擦を考慮した位置更新
      const friction = DEFAULT_PHYSICS_PARAMETERS.frictionCoefficient
      expect(updated1.position.x).toBeCloseTo(100 + 10 * friction * deltaTime, 5)
      expect(updated1.position.y).toBeCloseTo(100, 5)
      expect(updated2.position.x).toBeCloseTo(500, 5)
      expect(updated2.position.y).toBeCloseTo(500 + 10 * friction * deltaTime, 5)

      // 速度は摩擦により減少
      expect(updated1.velocity.x).toBeCloseTo(10 * friction, 5)
      expect(updated1.velocity.y).toBeCloseTo(0, 5)
      expect(updated2.velocity.x).toBeCloseTo(0, 5)
      expect(updated2.velocity.y).toBeCloseTo(10 * friction, 5)
    })

    test("静止しているオブジェクトは静止を維持", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 300, 300, 20, 0, 0)
      objects.set(obj.id, obj)

      const deltaTime = 1.0
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated = objects.get(obj.id)!
      expect(updated.position.x).toBe(300)
      expect(updated.position.y).toBe(300)
      expect(updated.velocity.x).toBe(0)
      expect(updated.velocity.y).toBe(0)
    })

    test("衝突しているオブジェクトは反発する", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20, 0, 0, 100)
      const obj2 = createTestObject(2, 110, 100, 20, 0, 0, 100) // 30単位重なる
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const deltaTime = 0.1
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated1 = objects.get(obj1.id)!
      const updated2 = objects.get(obj2.id)!

      // obj1は左に、obj2は右に移動
      expect(updated1.position.x).toBeLessThan(100)
      expect(updated2.position.x).toBeGreaterThan(110)
      expect(updated1.position.y).toBeCloseTo(100, 5)
      expect(updated2.position.y).toBeCloseTo(100, 5)

      // 反対方向の速度を持つ
      expect(updated1.velocity.x).toBeLessThan(0)
      expect(updated2.velocity.x).toBeGreaterThan(0)
    })

    test("質量差による反発の違い", () => {
      const objects = new Map<ObjectId, GameObject>()
      const heavy = createTestObject(1, 100, 100, 20, 0, 0, 1000) // 重い
      const light = createTestObject(2, 110, 100, 20, 0, 0, 10) // 軽い
      objects.set(heavy.id, heavy)
      objects.set(light.id, light)

      const deltaTime = 0.1
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updatedHeavy = objects.get(heavy.id)!
      const updatedLight = objects.get(light.id)!

      // 軽いオブジェクトの方が大きく動く
      const heavyDisplacement = Math.abs(updatedHeavy.position.x - 100)
      const lightDisplacement = Math.abs(updatedLight.position.x - 110)
      expect(lightDisplacement).toBeGreaterThan(heavyDisplacement * 5)
    })
  })

  describe("トーラス境界での物理演算", () => {
    test("境界を越える運動", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, worldWidth - 10, 100, 10, 20, 0)
      objects.set(obj.id, obj)

      const deltaTime = 1.0
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated = objects.get(obj.id)!
      // ラップアラウンドして反対側に現れる
      const friction = DEFAULT_PHYSICS_PARAMETERS.frictionCoefficient
      const expectedX = (worldWidth - 10 + 20 * friction * deltaTime) % worldWidth
      expect(updated.position.x).toBeCloseTo(expectedX, 5)
    })

    test("境界を跨ぐ衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 10, 100, 20, 0, 0)
      const obj2 = createTestObject(2, worldWidth - 10, 100, 20, 0, 0) // 境界を跨いで20単位重なる
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const deltaTime = 0.1
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated1 = objects.get(obj1.id)!
      const updated2 = objects.get(obj2.id)!

      // obj1は右に、obj2は左に移動（境界を跨いで反発）
      expect(updated1.position.x).toBeGreaterThan(10)
      expect(updated2.position.x).toBeLessThan(worldWidth - 10)
    })
  })

  describe("摩擦の効果", () => {
    test("摩擦による減速", () => {
      const params: PhysicsParameters = {
        ...DEFAULT_PHYSICS_PARAMETERS,
        frictionCoefficient: 0.9, // 10%の減速
      }
      engine = new PhysicsEngine(cellSize, worldWidth, worldHeight, params)

      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 10, 100, 0) // 高速で移動
      objects.set(obj.id, obj)

      // 複数ステップで更新
      for (let i = 0; i < 10; i++) {
        engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 0.1)
      }

      const updated = objects.get(obj.id)!
      // 速度が減衰
      expect(updated.velocity.x).toBeLessThan(100 * Math.pow(0.9, 10) * 1.1) // 誤差を考慮
    })

    test("摩擦なしの場合", () => {
      const params: PhysicsParameters = {
        ...DEFAULT_PHYSICS_PARAMETERS,
        frictionCoefficient: 1.0, // 摩擦なし
      }
      engine = new PhysicsEngine(cellSize, worldWidth, worldHeight, params)

      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 10, 50, 0)
      objects.set(obj.id, obj)

      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 1.0)

      const updated = objects.get(obj.id)!
      // 速度が維持される
      expect(updated.velocity.x).toBeCloseTo(50, 5)
    })
  })

  describe("複数オブジェクトの相互作用", () => {
    test("3つのオブジェクトの連鎖衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      // 一列に並んだ3つのオブジェクト
      const obj1 = createTestObject(1, 100, 100, 25, 0, 0)
      const obj2 = createTestObject(2, 140, 100, 25, 0, 0) // obj1と10単位重なる
      const obj3 = createTestObject(3, 180, 100, 25, 0, 0) // obj2と10単位重なる
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)
      objects.set(obj3.id, obj3)

      const deltaTime = 0.1
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      const updated1 = objects.get(obj1.id)!
      const updated2 = objects.get(obj2.id)!
      const updated3 = objects.get(obj3.id)!

      // obj1は左に、obj3は右に、obj2は両方から力を受ける
      expect(updated1.position.x).toBeLessThan(100)
      expect(updated3.position.x).toBeGreaterThan(180)
      // obj2の移動は小さい（両側から押される）
      expect(Math.abs(updated2.position.x - 140)).toBeLessThan(Math.abs(updated1.position.x - 100))
    })

    test("多数のオブジェクトでのパフォーマンス", () => {
      const objects = new Map<ObjectId, GameObject>()
      // 100個のオブジェクトをランダム配置
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * worldWidth
        const y = Math.random() * worldHeight
        const vx = (Math.random() - 0.5) * 20
        const vy = (Math.random() - 0.5) * 20
        const obj = createTestObject(i, x, y, 10, vx, vy)
        objects.set(obj.id, obj)
      }

      const deltaTime = 0.1
      const result = engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      // パフォーマンス確認
      expect(result.elapsedTime).toBeLessThan(100) // 100ms以内
      expect(result.objectCount).toBe(100)
      expect(result.collisionCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe("緊急速度制限", () => {
    test("異常な高速度の制限", () => {
      const params: PhysicsParameters = {
        ...DEFAULT_PHYSICS_PARAMETERS,
        emergencyVelocityLimit: 100,
      }
      engine = new PhysicsEngine(cellSize, worldWidth, worldHeight, params)

      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 10, 10000, 0) // 異常に高速
      objects.set(obj.id, obj)

      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 0.1)

      const updated = objects.get(obj.id)!
      const speed = Math.sqrt(
        updated.velocity.x * updated.velocity.x + updated.velocity.y * updated.velocity.y
      )
      expect(speed).toBeLessThanOrEqual(100)
    })
  })

  describe("エッジケース", () => {
    test("質量0のオブジェクト", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20, 0, 0, 0) // 質量0
      const obj2 = createTestObject(2, 110, 100, 20, 0, 0, 100)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const deltaTime = 0.1
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      // エラーなく処理される
      expect(objects.get(obj1.id)).toBeDefined()
      expect(objects.get(obj2.id)).toBeDefined()
    })

    test("空のオブジェクトマップ", () => {
      const objects = new Map<ObjectId, GameObject>()

      const result = engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 1.0)

      expect(result.objectCount).toBe(0)
      expect(result.collisionCount).toBe(0)
    })

    test("1つのオブジェクトのみ", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 20, 10, 10)
      objects.set(obj.id, obj)

      const deltaTime = 1.0
      const result = engine.update(objects, new Map<ObjectId, DirectionalForceField>(), deltaTime)

      expect(result.objectCount).toBe(1)
      expect(result.collisionCount).toBe(0)

      const updated = objects.get(obj.id)!
      const friction = DEFAULT_PHYSICS_PARAMETERS.frictionCoefficient
      expect(updated.position.x).toBeCloseTo(100 + 10 * friction * deltaTime, 5)
      expect(updated.position.y).toBeCloseTo(100 + 10 * friction * deltaTime, 5)
    })
  })

  describe("衝突検出の委譲", () => {
    test("特定位置での衝突検出", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 110, 110, 20)
      const obj3 = createTestObject(3, 200, 200, 20)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)
      objects.set(obj3.id, obj3)

      const position = Vec2Utils.create(105, 105)
      const collisions = engine.detectCollisionsAtPosition(position, 15, objects)

      expect(collisions).toHaveLength(2)
      expect(collisions).toContain(obj1)
      expect(collisions).toContain(obj2)
      expect(collisions).not.toContain(obj3)
    })
  })

  describe("パラメータ更新", () => {
    test("実行時のパラメータ変更", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 10, 50, 0)
      objects.set(obj.id, obj)

      // 摩擦なしに変更
      engine.updateParameters({ frictionCoefficient: 1.0 })
      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 1.0)

      const updated = objects.get(obj.id)!
      expect(updated.velocity.x).toBeCloseTo(50, 5) // 速度が維持される
    })
  })

  describe("デバッグ情報", () => {
    test("デバッグ情報の取得", () => {
      const objects = new Map<ObjectId, GameObject>()
      for (let i = 0; i < 5; i++) {
        const obj = createTestObject(i, i * 100, i * 100, 20)
        objects.set(obj.id, obj)
      }

      engine.update(objects, new Map<ObjectId, DirectionalForceField>(), 0.1)
      const debugInfo = engine.getDebugInfo()

      expect(debugInfo.parameters).toEqual(DEFAULT_PHYSICS_PARAMETERS)
      expect(debugInfo.collisionDetectorInfo).toBeDefined()
      expect(debugInfo.collisionDetectorInfo.gridInfo).toBeDefined()
    })
  })
})
