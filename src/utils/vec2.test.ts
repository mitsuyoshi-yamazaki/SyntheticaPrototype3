/**
 * Vec2ユーティリティのテスト
 */

import { Vec2 } from "./vec2"
import type { Vec2 as Vec2Type } from "@/types/game"

describe("Vec2", () => {
  describe("zero", () => {
    test("ゼロベクトルを返す", () => {
      expect(Vec2.zero).toEqual({ x: 0, y: 0 })
    })
  })

  describe("create", () => {
    test("指定した座標のベクトルを作成する", () => {
      const v = Vec2.create(3, 4)
      expect(v).toEqual({ x: 3, y: 4 })
    })

    test("負の値も扱える", () => {
      const v = Vec2.create(-2, -5)
      expect(v).toEqual({ x: -2, y: -5 })
    })
  })

  describe("add", () => {
    test("2つのベクトルを加算する", () => {
      const a: Vec2Type = { x: 1, y: 2 }
      const b: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.add(a, b)).toEqual({ x: 4, y: 6 })
    })

    test("負の値を含むベクトルも加算できる", () => {
      const a: Vec2Type = { x: 1, y: -2 }
      const b: Vec2Type = { x: -3, y: 4 }
      expect(Vec2.add(a, b)).toEqual({ x: -2, y: 2 })
    })
  })

  describe("sub", () => {
    test("2つのベクトルを減算する", () => {
      const a: Vec2Type = { x: 5, y: 7 }
      const b: Vec2Type = { x: 2, y: 3 }
      expect(Vec2.sub(a, b)).toEqual({ x: 3, y: 4 })
    })

    test("結果が負になる場合も正しく計算する", () => {
      const a: Vec2Type = { x: 1, y: 2 }
      const b: Vec2Type = { x: 3, y: 5 }
      expect(Vec2.sub(a, b)).toEqual({ x: -2, y: -3 })
    })
  })

  describe("scale", () => {
    test("ベクトルをスカラー倍する", () => {
      const v: Vec2Type = { x: 2, y: 3 }
      expect(Vec2.scale(v, 3)).toEqual({ x: 6, y: 9 })
    })

    test("負のスカラーでも正しく計算する", () => {
      const v: Vec2Type = { x: 2, y: 3 }
      expect(Vec2.scale(v, -2)).toEqual({ x: -4, y: -6 })
    })

    test("0倍するとゼロベクトルになる", () => {
      const v: Vec2Type = { x: 5, y: 7 }
      expect(Vec2.scale(v, 0)).toEqual({ x: 0, y: 0 })
    })
  })

  describe("dot", () => {
    test("内積を計算する", () => {
      const a: Vec2Type = { x: 2, y: 3 }
      const b: Vec2Type = { x: 4, y: 5 }
      expect(Vec2.dot(a, b)).toBe(23) // 2*4 + 3*5 = 8 + 15 = 23
    })

    test("直交するベクトルの内積は0", () => {
      const a: Vec2Type = { x: 1, y: 0 }
      const b: Vec2Type = { x: 0, y: 1 }
      expect(Vec2.dot(a, b)).toBe(0)
    })
  })

  describe("magnitudeSquared", () => {
    test("ベクトルの大きさの2乗を計算する", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.magnitudeSquared(v)).toBe(25) // 3^2 + 4^2 = 9 + 16 = 25
    })

    test("ゼロベクトルの大きさの2乗は0", () => {
      expect(Vec2.magnitudeSquared(Vec2.zero)).toBe(0)
    })
  })

  describe("magnitude", () => {
    test("ベクトルの大きさを計算する", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.magnitude(v)).toBe(5)
    })

    test("単位ベクトルの大きさは1", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      expect(Vec2.magnitude(v)).toBe(1)
    })
  })

  describe("distanceSquared", () => {
    test("2点間の距離の2乗を計算する", () => {
      const a: Vec2Type = { x: 1, y: 2 }
      const b: Vec2Type = { x: 4, y: 6 }
      expect(Vec2.distanceSquared(a, b)).toBe(25) // (4-1)^2 + (6-2)^2 = 9 + 16 = 25
    })

    test("同じ点の距離の2乗は0", () => {
      const a: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.distanceSquared(a, a)).toBe(0)
    })
  })

  describe("distance", () => {
    test("2点間の距離を計算する", () => {
      const a: Vec2Type = { x: 1, y: 2 }
      const b: Vec2Type = { x: 4, y: 6 }
      expect(Vec2.distance(a, b)).toBe(5)
    })
  })

  describe("normalize", () => {
    test("ベクトルを正規化する", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      const normalized = Vec2.normalize(v)
      expect(normalized.x).toBeCloseTo(0.6)
      expect(normalized.y).toBeCloseTo(0.8)
      expect(Vec2.magnitude(normalized)).toBeCloseTo(1)
    })

    test("ゼロベクトルの正規化はゼロベクトルを返す", () => {
      expect(Vec2.normalize(Vec2.zero)).toEqual({ x: 0, y: 0 })
    })

    test("既に正規化されたベクトルは変わらない", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      expect(Vec2.normalize(v)).toEqual(v)
    })
  })

  describe("fromAngle", () => {
    test("角度からベクトルを作成する", () => {
      const v = Vec2.fromAngle(0)
      expect(v.x).toBeCloseTo(1)
      expect(v.y).toBeCloseTo(0)
    })

    test("90度の場合", () => {
      const v = Vec2.fromAngle(Math.PI / 2)
      expect(v.x).toBeCloseTo(0)
      expect(v.y).toBeCloseTo(1)
    })

    test("180度の場合", () => {
      const v = Vec2.fromAngle(Math.PI)
      expect(v.x).toBeCloseTo(-1)
      expect(v.y).toBeCloseTo(0)
    })

    test("270度の場合", () => {
      const v = Vec2.fromAngle((Math.PI * 3) / 2)
      expect(v.x).toBeCloseTo(0)
      expect(v.y).toBeCloseTo(-1)
    })
  })

  describe("toAngle", () => {
    test("ベクトルから角度を計算する", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      expect(Vec2.toAngle(v)).toBeCloseTo(0)
    })

    test("45度のベクトル", () => {
      const v: Vec2Type = { x: 1, y: 1 }
      expect(Vec2.toAngle(v)).toBeCloseTo(Math.PI / 4)
    })

    test("負の角度も正しく計算する", () => {
      const v: Vec2Type = { x: 1, y: -1 }
      expect(Vec2.toAngle(v)).toBeCloseTo(-Math.PI / 4)
    })
  })

  describe("lerp", () => {
    test("t=0のとき開始点を返す", () => {
      const a: Vec2Type = { x: 0, y: 0 }
      const b: Vec2Type = { x: 10, y: 10 }
      expect(Vec2.lerp(a, b, 0)).toEqual(a)
    })

    test("t=1のとき終了点を返す", () => {
      const a: Vec2Type = { x: 0, y: 0 }
      const b: Vec2Type = { x: 10, y: 10 }
      expect(Vec2.lerp(a, b, 1)).toEqual(b)
    })

    test("t=0.5のとき中点を返す", () => {
      const a: Vec2Type = { x: 0, y: 0 }
      const b: Vec2Type = { x: 10, y: 10 }
      expect(Vec2.lerp(a, b, 0.5)).toEqual({ x: 5, y: 5 })
    })

    test("異なる座標でも正しく補間する", () => {
      const a: Vec2Type = { x: 2, y: 3 }
      const b: Vec2Type = { x: 6, y: 7 }
      expect(Vec2.lerp(a, b, 0.25)).toEqual({ x: 3, y: 4 })
    })
  })

  describe("clamp", () => {
    test("最大長さより短いベクトルはそのまま返す", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.clamp(v, 10)).toEqual(v)
    })

    test("最大長さより長いベクトルは制限される", () => {
      const v: Vec2Type = { x: 6, y: 8 }
      const clamped = Vec2.clamp(v, 5)
      expect(Vec2.magnitude(clamped)).toBeCloseTo(5)
      // 方向は保持される
      expect(clamped.x).toBeCloseTo(3)
      expect(clamped.y).toBeCloseTo(4)
    })

    test("ゼロベクトルはそのまま返す", () => {
      expect(Vec2.clamp(Vec2.zero, 5)).toEqual(Vec2.zero)
    })
  })

  describe("rotate", () => {
    test("90度回転", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      const rotated = Vec2.rotate(v, Math.PI / 2)
      expect(rotated.x).toBeCloseTo(0)
      expect(rotated.y).toBeCloseTo(1)
    })

    test("180度回転", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      const rotated = Vec2.rotate(v, Math.PI)
      expect(rotated.x).toBeCloseTo(-1)
      expect(rotated.y).toBeCloseTo(0)
    })

    test("-90度回転", () => {
      const v: Vec2Type = { x: 1, y: 0 }
      const rotated = Vec2.rotate(v, -Math.PI / 2)
      expect(rotated.x).toBeCloseTo(0)
      expect(rotated.y).toBeCloseTo(-1)
    })

    test("任意のベクトルの回転", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      const angle = Math.PI / 4
      const rotated = Vec2.rotate(v, angle)
      // 大きさは保持される
      expect(Vec2.magnitude(rotated)).toBeCloseTo(Vec2.magnitude(v))
    })
  })

  describe("copy", () => {
    test("ベクトルのコピーを作成する", () => {
      const v: Vec2Type = { x: 3, y: 4 }
      const copied = Vec2.copy(v)
      expect(copied).toEqual(v)
      expect(copied).not.toBe(v) // 別のオブジェクトであることを確認
    })
  })

  describe("equals", () => {
    test("同じベクトルはtrueを返す", () => {
      const a: Vec2Type = { x: 3, y: 4 }
      const b: Vec2Type = { x: 3, y: 4 }
      expect(Vec2.equals(a, b)).toBe(true)
    })

    test("異なるベクトルはfalseを返す", () => {
      const a: Vec2Type = { x: 3, y: 4 }
      const b: Vec2Type = { x: 3, y: 5 }
      expect(Vec2.equals(a, b)).toBe(false)
    })

    test("epsilon内の差は同じとみなす", () => {
      const a: Vec2Type = { x: 1, y: 1 }
      const b: Vec2Type = { x: 1.00001, y: 0.99999 }
      expect(Vec2.equals(a, b, 0.001)).toBe(true)
    })

    test("epsilonを超える差は異なるとみなす", () => {
      const a: Vec2Type = { x: 1, y: 1 }
      const b: Vec2Type = { x: 1.01, y: 1 }
      expect(Vec2.equals(a, b, 0.001)).toBe(false)
    })
  })
})
