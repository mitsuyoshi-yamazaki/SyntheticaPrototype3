/**
 * 物理演算エンジンと力場システムの統合テスト
 */

import { PhysicsEngine } from "./physics-engine"
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
  radius: number = 10,
  mass: number = 100,
  vx: number = 0,
  vy: number = 0
): GameObject => {
  return {
    id: createTestObjectId(id),
    type: "ENERGY",
    position: Vec2Utils.create(x, y),
    velocity: Vec2Utils.create(vx, vy),
    radius,
    energy: mass,
    mass,
  }
}

// テスト用の力場生成
const createLinearField = (
  id: number,
  x: number,
  y: number,
  radius: number,
  directionX: number,
  directionY: number
): DirectionalForceField => {
  return {
    id: createTestObjectId(id),
    type: "LINEAR",
    position: Vec2Utils.create(x, y),
    radius,
    strength: 1,
    direction: Vec2Utils.create(directionX, directionY),
  }
}

const createRadialField = (
  id: number,
  x: number,
  y: number,
  radius: number,
  strength: number
): DirectionalForceField => {
  return {
    id: createTestObjectId(id),
    type: "RADIAL",
    position: Vec2Utils.create(x, y),
    radius,
    strength,
  }
}

const createSpiralField = (
  id: number,
  x: number,
  y: number,
  radius: number,
  strength: number
): DirectionalForceField => {
  return {
    id: createTestObjectId(id),
    type: "SPIRAL",
    position: Vec2Utils.create(x, y),
    radius,
    strength,
  }
}

describe("物理演算と力場システムの統合", () => {
  const cellSize = 100
  const worldWidth = 1000
  const worldHeight = 1000
  let engine: PhysicsEngine

  beforeEach(() => {
    engine = new PhysicsEngine(cellSize, worldWidth, worldHeight)
  })

  describe("線形力場の影響", () => {
    test("線形力場によるオブジェクトの加速", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 100, 100, 10, 100) // 静止したオブジェクト
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createLinearField(10, 100, 100, 200, 20, 0) // 右向きの力
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      // 力による加速: a = F/m = 20/100 = 0.2
      // 速度: v = at = 0.2 * 0.1 = 0.02
      const expectedVelocityX = 0.02 * 0.98 // 摩擦を考慮
      expect(updated.velocity.x).toBeCloseTo(expectedVelocityX, 5)
      expect(updated.velocity.y).toBeCloseTo(0, 5)
    })

    test("力場の範囲外では力が働かない", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 500, 500, 10, 100) // 力場から離れた位置
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createLinearField(10, 100, 100, 100, 20, 0) // 範囲100
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      expect(updated.velocity.x).toBe(0)
      expect(updated.velocity.y).toBe(0)
    })

    test("複数の線形力場の重ね合わせ", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 200, 200, 10, 100)
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field1 = createLinearField(10, 200, 200, 100, 10, 0) // 右向き
      const field2 = createLinearField(11, 200, 200, 100, 0, 10) // 下向き
      forceFields.set(field1.id, field1)
      forceFields.set(field2.id, field2)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      // 合成力は (10, 10)
      const expectedVelocity = 0.1 * 0.1 * 0.98 // (力/質量) * 時間 * 摩擦
      expect(updated.velocity.x).toBeCloseTo(expectedVelocity, 5)
      expect(updated.velocity.y).toBeCloseTo(expectedVelocity, 5)
    })
  })

  describe("放射状力場の影響", () => {
    test("放射状力場による外向きの力", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 150, 100, 10, 100) // 力場中心の右側
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createRadialField(10, 100, 100, 100, 20) // 外向きの力
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      // 右向きに加速されるはず
      expect(updated.velocity.x).toBeGreaterThan(0)
      expect(updated.velocity.y).toBeCloseTo(0, 5)
    })

    test("負の強度で内向きの力", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 150, 100, 10, 100) // 力場中心の右側
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createRadialField(10, 100, 100, 100, -20) // 内向きの力
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      // 左向き（中心に向かって）に加速されるはず
      expect(updated.velocity.x).toBeLessThan(0)
      expect(updated.velocity.y).toBeCloseTo(0, 5)
    })
  })

  describe("渦巻き力場の影響", () => {
    test("渦巻き力場による回転運動", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 150, 100, 10, 100) // 力場中心の右側
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createSpiralField(10, 100, 100, 100, 20)
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated = objects.get(obj.id)!
      // 主に接線方向（下向き）に加速されるはず
      expect(updated.velocity.y).toBeGreaterThan(0)
      // わずかに外向きの成分もある
      expect(updated.velocity.x).toBeGreaterThan(0)
    })

    test("複数ステップでの軌道", () => {
      const objects = new Map<ObjectId, GameObject>()
      const obj = createTestObject(1, 150, 100, 10, 100)
      objects.set(obj.id, obj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createSpiralField(10, 100, 100, 200, 30)
      forceFields.set(field.id, field)

      const positions: Vec2[] = []
      const deltaTime = 0.05

      // 20ステップ実行
      for (let i = 0; i < 20; i++) {
        engine.update(objects, forceFields, deltaTime)
        const updated = objects.get(obj.id)!
        positions.push(Vec2Utils.copy(updated.position))
      }

      // 渦巻き軌道を描いているはず
      // 中心からの距離が徐々に増加
      const initialDistance = Vec2Utils.distance(positions[0]!, field.position)
      const finalDistance = Vec2Utils.distance(positions[19]!, field.position)
      expect(finalDistance).toBeGreaterThan(initialDistance)

      // 角度も変化している
      const initialAngle = Math.atan2(
        positions[0]!.y - field.position.y,
        positions[0]!.x - field.position.x
      )
      const finalAngle = Math.atan2(
        positions[19]!.y - field.position.y,
        positions[19]!.x - field.position.x
      )
      expect(Math.abs(finalAngle - initialAngle)).toBeGreaterThan(0.001)
    })
  })

  describe("力場と衝突の相互作用", () => {
    test("力場内での衝突", () => {
      const objects = new Map<ObjectId, GameObject>()
      // 2つの近接したオブジェクト
      const obj1 = createTestObject(1, 100, 100, 20, 100)
      const obj2 = createTestObject(2, 110, 100, 20, 100)
      objects.set(obj1.id, obj1)
      objects.set(obj2.id, obj2)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createLinearField(10, 100, 100, 200, 0, 20) // 下向きの力
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updated1 = objects.get(obj1.id)!
      const updated2 = objects.get(obj2.id)!

      // 両オブジェクトとも下向きの力を受ける
      expect(updated1.velocity.y).toBeGreaterThan(0)
      expect(updated2.velocity.y).toBeGreaterThan(0)

      // 衝突により左右に離れる
      expect(updated1.velocity.x).toBeLessThan(0)
      expect(updated2.velocity.x).toBeGreaterThan(0)
    })
  })

  describe("質量による影響の違い", () => {
    test("軽いオブジェクトほど大きく加速", () => {
      const objects = new Map<ObjectId, GameObject>()
      const lightObj = createTestObject(1, 100, 100, 10, 50) // 軽い
      const heavyObj = createTestObject(2, 100, 200, 10, 200) // 重い
      objects.set(lightObj.id, lightObj)
      objects.set(heavyObj.id, heavyObj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createLinearField(10, 100, 150, 200, 20, 0)
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updatedLight = objects.get(lightObj.id)!
      const updatedHeavy = objects.get(heavyObj.id)!

      // 軽いオブジェクトの方が大きく加速
      expect(updatedLight.velocity.x).toBeGreaterThan(updatedHeavy.velocity.x)
      // 加速度の比は質量の逆比
      const ratio = updatedLight.velocity.x / updatedHeavy.velocity.x
      expect(ratio).toBeCloseTo(200 / 50, 1)
    })
  })

  describe("力場の減衰", () => {
    test("力場の端での減衰効果", () => {
      const objects = new Map<ObjectId, GameObject>()
      // 力場の中心と端にオブジェクトを配置
      const centerObj = createTestObject(1, 100, 100, 10, 100)
      const edgeObj = createTestObject(2, 195, 100, 10, 100) // ほぼ端
      objects.set(centerObj.id, centerObj)
      objects.set(edgeObj.id, edgeObj)

      const forceFields = new Map<ObjectId, DirectionalForceField>()
      const field = createLinearField(10, 100, 100, 100, 20, 0)
      forceFields.set(field.id, field)

      const deltaTime = 0.1
      engine.update(objects, forceFields, deltaTime)

      const updatedCenter = objects.get(centerObj.id)!
      const updatedEdge = objects.get(edgeObj.id)!

      // 中心の方が大きく加速
      expect(updatedCenter.velocity.x).toBeGreaterThan(updatedEdge.velocity.x)
      // 端では約50-60%の強度（減衰開始位置に依存）
      const ratio = updatedEdge.velocity.x / updatedCenter.velocity.x
      expect(ratio).toBeGreaterThan(0.45)
      expect(ratio).toBeLessThan(0.65)
    })
  })
})