/**
 * トーラス世界用数学ユーティリティのテスト
 */

import * as TorusMath from "./torus-math"
import type { Vec2 } from "@/types/game"

describe("torus-math", () => {
  const worldWidth = 100
  const worldHeight = 80

  describe("wrapPosition", () => {
    test("世界内の座標はそのまま返す", () => {
      const pos: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.wrapPosition(pos, worldWidth, worldHeight)).toEqual(pos)
    })

    test("正の方向にはみ出した座標をラップする", () => {
      const pos: Vec2 = { x: 120, y: 95 }
      const wrapped = TorusMath.wrapPosition(pos, worldWidth, worldHeight)
      expect(wrapped).toEqual({ x: 20, y: 15 })
    })

    test("負の方向にはみ出した座標をラップする", () => {
      const pos: Vec2 = { x: -10, y: -5 }
      const wrapped = TorusMath.wrapPosition(pos, worldWidth, worldHeight)
      expect(wrapped).toEqual({ x: 90, y: 75 })
    })

    test("大きくはみ出した座標も正しくラップする", () => {
      const pos: Vec2 = { x: 350, y: -165 }
      const wrapped = TorusMath.wrapPosition(pos, worldWidth, worldHeight)
      expect(wrapped).toEqual({ x: 50, y: 75 })
    })

    test("境界値（0）は0になる", () => {
      const pos: Vec2 = { x: 0, y: 0 }
      const wrapped = TorusMath.wrapPosition(pos, worldWidth, worldHeight)
      expect(wrapped).toEqual({ x: 0, y: 0 })
    })

    test("境界値（世界サイズ）は0になる", () => {
      const pos: Vec2 = { x: worldWidth, y: worldHeight }
      const wrapped = TorusMath.wrapPosition(pos, worldWidth, worldHeight)
      expect(wrapped).toEqual({ x: 0, y: 0 })
    })
  })

  describe("shortestVector", () => {
    test("近い点への最短ベクトルは直接の差分", () => {
      const a: Vec2 = { x: 20, y: 20 }
      const b: Vec2 = { x: 30, y: 25 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: 10, y: 5 })
    })

    test("X軸方向で世界端を超える場合の最短経路", () => {
      const a: Vec2 = { x: 90, y: 40 }
      const b: Vec2 = { x: 10, y: 40 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: 20, y: 0 }) // 右回りが最短
    })

    test("Y軸方向で世界端を超える場合の最短経路", () => {
      const a: Vec2 = { x: 50, y: 70 }
      const b: Vec2 = { x: 50, y: 10 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: 0, y: 20 }) // 上回りが最短
    })

    test("両軸で世界端を超える場合の最短経路", () => {
      const a: Vec2 = { x: 90, y: 70 }
      const b: Vec2 = { x: 10, y: 10 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: 20, y: 20 }) // 右上回りが最短
    })

    test("逆方向への最短ベクトル", () => {
      const a: Vec2 = { x: 10, y: 10 }
      const b: Vec2 = { x: 90, y: 70 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: -20, y: -20 }) // 左下回りが最短
    })

    test("ちょうど半分の距離の場合", () => {
      const a: Vec2 = { x: 25, y: 20 }
      const b: Vec2 = { x: 75, y: 60 }
      const v = TorusMath.shortestVector(a, b, worldWidth, worldHeight)
      expect(v).toEqual({ x: 50, y: 40 }) // 直接の経路（同じ距離）
    })
  })

  describe("distanceSquared", () => {
    test("同じ点の距離の2乗は0", () => {
      const a: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.distanceSquared(a, a, worldWidth, worldHeight)).toBe(0)
    })

    test("近い点への距離の2乗", () => {
      const a: Vec2 = { x: 10, y: 10 }
      const b: Vec2 = { x: 13, y: 14 }
      expect(TorusMath.distanceSquared(a, b, worldWidth, worldHeight)).toBe(25) // 3^2 + 4^2
    })

    test("世界端を超える最短距離の2乗", () => {
      const a: Vec2 = { x: 95, y: 40 }
      const b: Vec2 = { x: 5, y: 40 }
      expect(TorusMath.distanceSquared(a, b, worldWidth, worldHeight)).toBe(100) // 10^2
    })

    test("対角線上の最短距離の2乗", () => {
      const a: Vec2 = { x: 90, y: 70 }
      const b: Vec2 = { x: 10, y: 10 }
      expect(TorusMath.distanceSquared(a, b, worldWidth, worldHeight)).toBe(800) // 20^2 + 20^2
    })
  })

  describe("distance", () => {
    test("同じ点の距離は0", () => {
      const a: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.distance(a, a, worldWidth, worldHeight)).toBe(0)
    })

    test("近い点への距離", () => {
      const a: Vec2 = { x: 10, y: 10 }
      const b: Vec2 = { x: 13, y: 14 }
      expect(TorusMath.distance(a, b, worldWidth, worldHeight)).toBe(5)
    })

    test("世界端を超える最短距離", () => {
      const a: Vec2 = { x: 95, y: 40 }
      const b: Vec2 = { x: 5, y: 40 }
      expect(TorusMath.distance(a, b, worldWidth, worldHeight)).toBe(10)
    })
  })

  describe("isInCircle", () => {
    test("円の中心点は含まれる", () => {
      const center: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.isInCircle(center, center, 10, worldWidth, worldHeight)).toBe(true)
    })

    test("円内の点は含まれる", () => {
      const point: Vec2 = { x: 53, y: 44 }
      const center: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.isInCircle(point, center, 10, worldWidth, worldHeight)).toBe(true)
    })

    test("円外の点は含まれない", () => {
      const point: Vec2 = { x: 65, y: 40 }
      const center: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.isInCircle(point, center, 10, worldWidth, worldHeight)).toBe(false)
    })

    test("世界端を超えて円内にある点は含まれる", () => {
      const point: Vec2 = { x: 5, y: 40 }
      const center: Vec2 = { x: 95, y: 40 }
      expect(TorusMath.isInCircle(point, center, 15, worldWidth, worldHeight)).toBe(true)
    })

    test("円周上の点（境界値）", () => {
      const point: Vec2 = { x: 60, y: 40 }
      const center: Vec2 = { x: 50, y: 40 }
      expect(TorusMath.isInCircle(point, center, 10, worldWidth, worldHeight)).toBe(true) // <= なので含まれる
    })
  })

  describe("getCellsInRect", () => {
    const cellSize = 10

    test("単一セルの矩形", () => {
      const center: Vec2 = { x: 25, y: 25 }
      const cells = TorusMath.getCellsInRect(center, 4, 4, cellSize, worldWidth, worldHeight)
      expect(cells).toHaveLength(1)
      expect(cells).toContainEqual({ x: 2, y: 2 })
    })

    test("複数セルにまたがる矩形", () => {
      const center: Vec2 = { x: 25, y: 25 }
      const cells = TorusMath.getCellsInRect(center, 10, 10, cellSize, worldWidth, worldHeight)
      expect(cells).toHaveLength(9) // 3x3セル
      expect(cells).toContainEqual({ x: 1, y: 1 })
      expect(cells).toContainEqual({ x: 2, y: 1 })
      expect(cells).toContainEqual({ x: 3, y: 1 })
      expect(cells).toContainEqual({ x: 1, y: 2 })
      expect(cells).toContainEqual({ x: 2, y: 2 })
      expect(cells).toContainEqual({ x: 3, y: 2 })
      expect(cells).toContainEqual({ x: 1, y: 3 })
      expect(cells).toContainEqual({ x: 2, y: 3 })
      expect(cells).toContainEqual({ x: 3, y: 3 })
    })

    test("世界端をまたぐ矩形（X軸）", () => {
      const center: Vec2 = { x: 95, y: 25 }
      const cells = TorusMath.getCellsInRect(center, 10, 5, cellSize, worldWidth, worldHeight)
      expect(cells).toHaveLength(6) // 3x2セル
      expect(cells).toContainEqual({ x: 8, y: 2 })
      expect(cells).toContainEqual({ x: 9, y: 2 })
      expect(cells).toContainEqual({ x: 0, y: 2 }) // ラップ
    })

    test("世界端をまたぐ矩形（Y軸）", () => {
      const center: Vec2 = { x: 25, y: 75 }
      const cells = TorusMath.getCellsInRect(center, 5, 10, cellSize, worldWidth, worldHeight)
      expect(cells).toHaveLength(6) // 2x3セル
      expect(cells).toContainEqual({ x: 2, y: 6 })
      expect(cells).toContainEqual({ x: 2, y: 7 })
      expect(cells).toContainEqual({ x: 2, y: 0 }) // ラップ
    })

    test("世界端をまたぐ矩形（両軸）", () => {
      const center: Vec2 = { x: 95, y: 75 }
      const cells = TorusMath.getCellsInRect(center, 10, 10, cellSize, worldWidth, worldHeight)
      expect(cells).toHaveLength(9) // 3x3セル
      expect(cells).toContainEqual({ x: 9, y: 7 })
      expect(cells).toContainEqual({ x: 0, y: 7 }) // X軸ラップ
      expect(cells).toContainEqual({ x: 9, y: 0 }) // Y軸ラップ
      expect(cells).toContainEqual({ x: 0, y: 0 }) // 両軸ラップ
    })

    test("負の座標でも正しく動作する", () => {
      const center: Vec2 = { x: -5, y: -5 }
      const cells = TorusMath.getCellsInRect(center, 5, 5, cellSize, worldWidth, worldHeight)
      // 負の座標は内部で正規化されるはず
      expect(cells.length).toBeGreaterThan(0)
      cells.forEach(cell => {
        expect(cell.x).toBeGreaterThanOrEqual(0)
        expect(cell.y).toBeGreaterThanOrEqual(0)
        expect(cell.x).toBeLessThan(10) // worldWidth / cellSize
        expect(cell.y).toBeLessThan(8)  // worldHeight / cellSize
      })
    })
  })

  describe("lineCircleIntersection", () => {
    test("線分が円を通過する場合", () => {
      const lineStart: Vec2 = { x: 40, y: 40 }
      const lineEnd: Vec2 = { x: 60, y: 40 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("線分が円に接する場合", () => {
      const lineStart: Vec2 = { x: 40, y: 35 }
      const lineEnd: Vec2 = { x: 60, y: 35 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("線分が円に交差しない場合", () => {
      const lineStart: Vec2 = { x: 40, y: 30 }
      const lineEnd: Vec2 = { x: 60, y: 30 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(false)
    })

    test("線分の端点が円内にある場合", () => {
      const lineStart: Vec2 = { x: 48, y: 40 }
      const lineEnd: Vec2 = { x: 60, y: 40 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("世界端をまたぐ線分が円に交差する場合", () => {
      const lineStart: Vec2 = { x: 95, y: 40 }
      const lineEnd: Vec2 = { x: 5, y: 40 }
      const circleCenter: Vec2 = { x: 0, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("線分が円を完全に含む場合", () => {
      const lineStart: Vec2 = { x: 40, y: 40 }
      const lineEnd: Vec2 = { x: 60, y: 40 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 3
      expect(TorusMath.lineCircleIntersection(
        lineStart, lineEnd, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("長さ0の線分（点）が円内にある場合", () => {
      const point: Vec2 = { x: 50, y: 40 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        point, point, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(true)
    })

    test("長さ0の線分（点）が円外にある場合", () => {
      const point: Vec2 = { x: 60, y: 40 }
      const circleCenter: Vec2 = { x: 50, y: 40 }
      const circleRadius = 5
      expect(TorusMath.lineCircleIntersection(
        point, point, circleCenter, circleRadius, worldWidth, worldHeight
      )).toBe(false)
    })
  })
})