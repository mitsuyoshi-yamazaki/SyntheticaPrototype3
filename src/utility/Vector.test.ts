import { Vector } from "./Vector"

describe("Vector", () => {
  // 基本演算のテスト
  describe("基本演算", () => {
    test("add: ベクトルの加算", () => {
      const v1 = new Vector(1, 2)
      const v2 = new Vector(3, 4)
      const result = v1.add(v2)
      expect(result.x).toBe(4)
      expect(result.y).toBe(6)
    })

    test("subtract: ベクトルの減算", () => {
      const v1 = new Vector(5, 7)
      const v2 = new Vector(2, 3)
      const result = v1.subtract(v2)
      expect(result.x).toBe(3)
      expect(result.y).toBe(4)
    })

    test("multiply: スカラー倍", () => {
      const v = new Vector(2, 3)
      const result = v.multiply(3)
      expect(result.x).toBe(6)
      expect(result.y).toBe(9)
    })

    test("divide: スカラー除算", () => {
      const v = new Vector(6, 9)
      const result = v.divide(3)
      expect(result.x).toBe(2)
      expect(result.y).toBe(3)
    })

    test("divide: ゼロ除算で例外", () => {
      const v = new Vector(1, 2)
      expect(() => v.divide(0)).toThrow("Cannot divide by zero")
    })

    test("negate: ベクトルの反転", () => {
      const v = new Vector(3, -4)
      const result = v.negate()
      expect(result.x).toBe(-3)
      expect(result.y).toBe(4)
    })
  })

  // 長さ関連のテスト
  describe("長さ関連", () => {
    test("length: ベクトルの長さ", () => {
      const v = new Vector(3, 4)
      expect(v.length()).toBe(5)
    })

    test("lengthSquared: ベクトルの長さの二乗", () => {
      const v = new Vector(3, 4)
      expect(v.lengthSquared()).toBe(25)
    })

    test("normalize: 正規化されたベクトル", () => {
      const v = new Vector(3, 4)
      const result = v.normalize()
      expect(result.x).toBeCloseTo(0.6)
      expect(result.y).toBeCloseTo(0.8)
      expect(result.length()).toBeCloseTo(1)
    })

    test("normalize: ゼロベクトルの正規化で例外", () => {
      const v = Vector.zero()
      expect(() => v.normalize()).toThrow("Cannot normalize zero vector")
    })
  })

  // 内積・外積のテスト
  describe("内積・外積", () => {
    test("dot: 内積の計算", () => {
      const v1 = new Vector(2, 3)
      const v2 = new Vector(4, 5)
      expect(v1.dot(v2)).toBe(23)
    })

    test("dot: 垂直ベクトルの内積はゼロ", () => {
      const v1 = new Vector(1, 0)
      const v2 = new Vector(0, 1)
      expect(v1.dot(v2)).toBe(0)
    })

    test("cross: 外積の計算", () => {
      const v1 = new Vector(2, 3)
      const v2 = new Vector(4, 5)
      expect(v1.cross(v2)).toBe(-2)
    })

    test("cross: 平行ベクトルの外積はゼロ", () => {
      const v1 = new Vector(2, 3)
      const v2 = new Vector(4, 6)
      expect(v1.cross(v2)).toBe(0)
    })
  })

  // 距離のテスト
  describe("距離", () => {
    test("distanceTo: 2点間の距離", () => {
      const v1 = new Vector(0, 0)
      const v2 = new Vector(3, 4)
      expect(v1.distanceTo(v2)).toBe(5)
    })

    test("distanceSquaredTo: 距離の二乗", () => {
      const v1 = new Vector(0, 0)
      const v2 = new Vector(3, 4)
      expect(v1.distanceSquaredTo(v2)).toBe(25)
    })
  })

  // 角度のテスト
  describe("角度", () => {
    test("angle: X軸からの角度（0度）", () => {
      const v = new Vector(1, 0)
      expect(v.angle()).toBe(0)
    })

    test("angle: X軸からの角度（90度）", () => {
      const v = new Vector(0, 1)
      expect(v.angle()).toBeCloseTo(Math.PI / 2)
    })

    test("angle: X軸からの角度（180度）", () => {
      const v = new Vector(-1, 0)
      expect(v.angle()).toBeCloseTo(Math.PI)
    })

    test("angle: X軸からの角度（-90度）", () => {
      const v = new Vector(0, -1)
      expect(v.angle()).toBeCloseTo(-Math.PI / 2)
    })

    test("angleTo: 2つのベクトル間の角度（90度）", () => {
      const v1 = new Vector(1, 0)
      const v2 = new Vector(0, 1)
      expect(v1.angleTo(v2)).toBeCloseTo(Math.PI / 2)
    })

    test("angleTo: 2つのベクトル間の角度（0度）", () => {
      const v1 = new Vector(1, 1)
      const v2 = new Vector(2, 2)
      expect(v1.angleTo(v2)).toBeCloseTo(0)
    })

    test("angleTo: 2つのベクトル間の角度（180度）", () => {
      const v1 = new Vector(1, 0)
      const v2 = new Vector(-1, 0)
      expect(v1.angleTo(v2)).toBeCloseTo(Math.PI)
    })

    test("angleTo: ゼロベクトルとの角度は0", () => {
      const v1 = new Vector(1, 1)
      const v2 = Vector.zero()
      expect(v1.angleTo(v2)).toBe(0)
    })
  })

  // ユーティリティのテスト
  describe("ユーティリティ", () => {
    test("equals: 等しいベクトル", () => {
      const v1 = new Vector(1, 2)
      const v2 = new Vector(1, 2)
      expect(v1.equals(v2)).toBe(true)
    })

    test("equals: 異なるベクトル", () => {
      const v1 = new Vector(1, 2)
      const v2 = new Vector(1, 3)
      expect(v1.equals(v2)).toBe(false)
    })

    test("equals: 誤差を考慮した等値比較", () => {
      const v1 = new Vector(1.0000001, 2)
      const v2 = new Vector(1, 2)
      expect(v1.equals(v2, 0.001)).toBe(true)
    })

    test("isZero: ゼロベクトル", () => {
      const v = new Vector(0, 0)
      expect(v.isZero()).toBe(true)
    })

    test("isZero: 非ゼロベクトル", () => {
      const v = new Vector(1, 0)
      expect(v.isZero()).toBe(false)
    })

    test("clone: ベクトルの複製", () => {
      const v1 = new Vector(1, 2)
      const v2 = v1.clone()
      expect(v2.x).toBe(v1.x)
      expect(v2.y).toBe(v1.y)
      expect(v2).not.toBe(v1)
    })
  })

  // 静的メソッドのテスト
  describe("静的メソッド", () => {
    test("zero: ゼロベクトルの生成", () => {
      const v = Vector.zero()
      expect(v.x).toBe(0)
      expect(v.y).toBe(0)
    })

    test("fromAngle: 角度からベクトルを生成（0度、長さ1）", () => {
      const v = Vector.fromAngle(0)
      expect(v.x).toBeCloseTo(1)
      expect(v.y).toBeCloseTo(0)
    })

    test("fromAngle: 角度からベクトルを生成（90度、長さ1）", () => {
      const v = Vector.fromAngle(Math.PI / 2)
      expect(v.x).toBeCloseTo(0)
      expect(v.y).toBeCloseTo(1)
    })

    test("fromAngle: 角度からベクトルを生成（45度、長さ2）", () => {
      const v = Vector.fromAngle(Math.PI / 4, 2)
      expect(v.x).toBeCloseTo(Math.sqrt(2))
      expect(v.y).toBeCloseTo(Math.sqrt(2))
      expect(v.length()).toBeCloseTo(2)
    })
  })

  // immutabilityのテスト
  describe("immutability", () => {
    test("add: 元のベクトルを変更しない", () => {
      const v1 = new Vector(1, 2)
      const v2 = new Vector(3, 4)
      v1.add(v2)
      expect(v1.x).toBe(1)
      expect(v1.y).toBe(2)
    })

    test("multiply: 元のベクトルを変更しない", () => {
      const v = new Vector(2, 3)
      v.multiply(5)
      expect(v.x).toBe(2)
      expect(v.y).toBe(3)
    })

    test("normalize: 元のベクトルを変更しない", () => {
      const v = new Vector(3, 4)
      v.normalize()
      expect(v.x).toBe(3)
      expect(v.y).toBe(4)
    })
  })
})
