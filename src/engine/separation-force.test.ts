/**
 * 反発力計算システムのテスト
 */

import {
  calculateSeparationForce,
  calculateTotalSeparationForce,
  type SeparationForceParameters,
} from "./separation-force"
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

describe("calculateSeparationForce", () => {
  const worldWidth = 1000
  const worldHeight = 1000

  describe("基本的な反発力計算", () => {
    test("衝突していない場合は反発力0", () => {
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 200, 200, 10)
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      expect(force.x).toBe(0)
      expect(force.y).toBe(0)
    })

    test("接触している場合は反発力0", () => {
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 120, 100, 10) // ちょうど接触
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      expect(force.x).toBe(0)
      expect(force.y).toBe(0)
    })

    test("重なっている場合は反発力が発生", () => {
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 110, 100, 20) // 30単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1はobj2から左方向に反発
      expect(force.x).toBeLessThan(0)
      expect(force.y).toBeCloseTo(0, 5)
      
      // 反発力の大きさを確認
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      expect(magnitude).toBeGreaterThan(0)
    })

    test("半径0のオブジェクトは反発力0", () => {
      const obj1 = createTestObject(1, 100, 100, 0)
      const obj2 = createTestObject(2, 100, 100, 20)
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      expect(force.x).toBe(0)
      expect(force.y).toBe(0)
    })

    test("完全に重なっている場合はランダム方向の反発力", () => {
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 100, 100, 20)
      
      // 複数回実行して方向が変わることを確認
      const forces = []
      for (let i = 0; i < 10; i++) {
        const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
        forces.push(force)
      }
      
      // 全ての反発力が同じ大きさを持つ
      const magnitudes = forces.map(f => Math.sqrt(f.x * f.x + f.y * f.y))
      const firstMag = magnitudes[0]!
      expect(magnitudes.every(m => Math.abs(m - firstMag) < 0.001)).toBe(true)
      
      // 少なくとも2つの異なる方向が存在する
      const directions = forces.map(f => Math.atan2(f.y, f.x))
      const uniqueDirections = new Set(directions.map(d => Math.round(d * 100) / 100))
      expect(uniqueDirections.size).toBeGreaterThan(1)
    })
  })

  describe("tanh関数による反発力制限", () => {
    test("小さな重なりでは線形的な反発力", () => {
      const params: SeparationForceParameters = {
        maxForce: 1000,
        forceScale: 10,
        minForce: 0,
      }
      
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 119, 100, 10) // 1単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight, params)
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      
      // tanh(0.1) ≈ 0.0997
      const expectedMagnitude = 1000 * Math.tanh(1 / 10)
      expect(magnitude).toBeCloseTo(expectedMagnitude, 1)
    })

    test("大きな重なりでは上限に漸近", () => {
      const params: SeparationForceParameters = {
        maxForce: 1000,
        forceScale: 10,
        minForce: 0,
      }
      
      const obj1 = createTestObject(1, 100, 100, 50)
      const obj2 = createTestObject(2, 100, 100, 50) // 100単位重なる（完全重複）
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight, params)
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      
      // tanh(10) ≈ 0.99999...
      expect(magnitude).toBeCloseTo(1000, 1)
      expect(magnitude).toBeLessThan(1000)
    })

    test("最小反発力の適用", () => {
      const params: SeparationForceParameters = {
        maxForce: 1000,
        forceScale: 1000, // 非常に大きなスケール
        minForce: 10,
      }
      
      const obj1 = createTestObject(1, 100, 100, 10)
      const obj2 = createTestObject(2, 119.9, 100, 10) // 0.1単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight, params)
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      
      // 最小反発力が適用される
      expect(magnitude).toBeCloseTo(10, 1)
    })
  })

  describe("トーラス境界での反発力計算", () => {
    test("左右境界を跨ぐ反発力", () => {
      const obj1 = createTestObject(1, 10, 100, 20)
      const obj2 = createTestObject(2, worldWidth - 10, 100, 20) // 20単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1は右方向に反発
      expect(force.x).toBeGreaterThan(0)
      expect(force.y).toBeCloseTo(0, 5)
    })

    test("上下境界を跨ぐ反発力", () => {
      const obj1 = createTestObject(1, 100, 10, 20)
      const obj2 = createTestObject(2, 100, worldHeight - 10, 20) // 20単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1は下方向に反発
      expect(force.x).toBeCloseTo(0, 5)
      expect(force.y).toBeGreaterThan(0)
    })

    test("コーナーでの反発力", () => {
      const obj1 = createTestObject(1, 10, 10, 20)
      const obj2 = createTestObject(2, worldWidth - 10, worldHeight - 10, 20)
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // 斜め方向の反発
      expect(force.x).toBeGreaterThan(0)
      expect(force.y).toBeGreaterThan(0)
    })
  })

  describe("反発力の方向", () => {
    test("水平方向の反発", () => {
      const obj1 = createTestObject(1, 100, 100, 15)
      const obj2 = createTestObject(2, 120, 100, 15) // 右側から10単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1は左方向に反発
      expect(force.x).toBeLessThan(0)
      expect(force.y).toBeCloseTo(0, 5)
    })

    test("垂直方向の反発", () => {
      const obj1 = createTestObject(1, 100, 100, 15)
      const obj2 = createTestObject(2, 100, 120, 15) // 下から10単位重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1は上方向に反発
      expect(force.x).toBeCloseTo(0, 5)
      expect(force.y).toBeLessThan(0)
    })

    test("斜め方向の反発", () => {
      const obj1 = createTestObject(1, 100, 100, 20)
      const obj2 = createTestObject(2, 120, 120, 20) // 右下から重なる
      
      const force = calculateSeparationForce(obj1, obj2, worldWidth, worldHeight)
      
      // obj1は左上方向に反発
      expect(force.x).toBeLessThan(0)
      expect(force.y).toBeLessThan(0)
      
      // 45度方向
      expect(Math.abs(force.x)).toBeCloseTo(Math.abs(force.y), 5)
    })
  })
})

describe("calculateTotalSeparationForce", () => {
  const worldWidth = 1000
  const worldHeight = 1000

  test("複数オブジェクトとの衝突による合成反発力", () => {
    const center = createTestObject(0, 200, 200, 20)
    const left = createTestObject(1, 170, 200, 20) // 左から10単位重なる
    const right = createTestObject(2, 230, 200, 20) // 右から10単位重なる
    const top = createTestObject(3, 200, 170, 20) // 上から10単位重なる
    
    const collidingObjects = [left, right, top]
    
    const totalForce = calculateTotalSeparationForce(
      center,
      collidingObjects,
      worldWidth,
      worldHeight
    )
    
    // 左右の反発力が相殺される
    expect(Math.abs(totalForce.x)).toBeLessThan(1)
    // 下方向への反発力のみ残る
    expect(totalForce.y).toBeGreaterThan(0)
  })

  test("衝突していないオブジェクトは無視される", () => {
    const obj = createTestObject(0, 100, 100, 10)
    const colliding = createTestObject(1, 115, 100, 10) // 5単位重なる
    const notColliding = createTestObject(2, 200, 200, 10) // 衝突しない
    
    const collidingObjects = [colliding, notColliding]
    
    const totalForce = calculateTotalSeparationForce(
      obj,
      collidingObjects,
      worldWidth,
      worldHeight
    )
    
    // colliding オブジェクトからの反発力のみ
    const singleForce = calculateSeparationForce(
      obj,
      colliding,
      worldWidth,
      worldHeight
    )
    
    expect(totalForce.x).toBeCloseTo(singleForce.x, 5)
    expect(totalForce.y).toBeCloseTo(singleForce.y, 5)
  })

  test("空の配列では反発力0", () => {
    const obj = createTestObject(0, 100, 100, 10)
    
    const totalForce = calculateTotalSeparationForce(
      obj,
      [],
      worldWidth,
      worldHeight
    )
    
    expect(totalForce.x).toBe(0)
    expect(totalForce.y).toBe(0)
  })

  test("周囲から押しつぶされる状況", () => {
    const center = createTestObject(0, 500, 500, 20)
    const surrounding = []
    
    // 8方向から囲む
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
      const x = 500 + Math.cos(angle) * 30
      const y = 500 + Math.sin(angle) * 30
      surrounding.push(createTestObject(angle, x, y, 20))
    }
    
    const totalForce = calculateTotalSeparationForce(
      center,
      surrounding,
      worldWidth,
      worldHeight
    )
    
    // ほぼ均等に囲まれているので合成反発力は小さい
    const magnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y)
    expect(magnitude).toBeLessThan(50) // 個別の反発力より大幅に小さい
  })

  test("カスタムパラメータの適用", () => {
    const params: SeparationForceParameters = {
      maxForce: 500,
      forceScale: 5,
      minForce: 20,
    }
    
    const obj = createTestObject(0, 100, 100, 10)
    const other = createTestObject(1, 119.99, 100, 10) // 0.01単位重なる（非常に小さい重なり）
    
    const totalForce = calculateTotalSeparationForce(
      obj,
      [other],
      worldWidth,
      worldHeight,
      params
    )
    
    const magnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y)
    
    // 最小反発力が適用される
    expect(magnitude).toBeCloseTo(20, 1)
  })
})