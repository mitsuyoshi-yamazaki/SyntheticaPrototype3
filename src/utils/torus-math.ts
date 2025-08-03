/**
 * トーラス世界用の数学ユーティリティ
 * 世界の端でループする座標系での計算
 */

import type { Vec2 } from "@/types/game"
import { Vec2 as Vec2Utils } from "./vec2"

/** トーラス世界での位置の正規化 */
export const wrapPosition = (position: Vec2, worldWidth: number, worldHeight: number): Vec2 => {
  let x = position.x % worldWidth
  let y = position.y % worldHeight

  if (x < 0) x += worldWidth
  if (y < 0) y += worldHeight

  return { x, y }
}

/** トーラス世界での最短距離ベクトル（aからbへ） */
export const shortestVector = (a: Vec2, b: Vec2, worldWidth: number, worldHeight: number): Vec2 => {
  let dx = b.x - a.x
  let dy = b.y - a.y

  // X軸方向の最短経路
  if (Math.abs(dx) > worldWidth / 2) {
    if (dx > 0) {
      dx -= worldWidth
    } else {
      dx += worldWidth
    }
  }

  // Y軸方向の最短経路
  if (Math.abs(dy) > worldHeight / 2) {
    if (dy > 0) {
      dy -= worldHeight
    } else {
      dy += worldHeight
    }
  }

  return { x: dx, y: dy }
}

/** トーラス世界での距離の2乗 */
export const distanceSquared = (
  a: Vec2,
  b: Vec2,
  worldWidth: number,
  worldHeight: number
): number => {
  const v = shortestVector(a, b, worldWidth, worldHeight)
  return Vec2Utils.magnitudeSquared(v)
}

/** トーラス世界での距離 */
export const distance = (a: Vec2, b: Vec2, worldWidth: number, worldHeight: number): number => {
  return Math.sqrt(distanceSquared(a, b, worldWidth, worldHeight))
}

/** トーラス世界での円形領域内判定 */
export const isInCircle = (
  point: Vec2,
  center: Vec2,
  radius: number,
  worldWidth: number,
  worldHeight: number
): boolean => {
  return distanceSquared(point, center, worldWidth, worldHeight) <= radius * radius
}

/** トーラス世界での矩形領域に含まれるセルの列挙 */
export const getCellsInRect = (
  center: Vec2,
  halfWidth: number,
  halfHeight: number,
  cellSize: number,
  worldWidth: number,
  worldHeight: number
): { x: number; y: number }[] => {
  const cells: { x: number; y: number }[] = []

  const minX = Math.floor((center.x - halfWidth) / cellSize)
  const maxX = Math.floor((center.x + halfWidth) / cellSize)
  const minY = Math.floor((center.y - halfHeight) / cellSize)
  const maxY = Math.floor((center.y + halfHeight) / cellSize)

  const cellsX = Math.floor(worldWidth / cellSize)
  const cellsY = Math.floor(worldHeight / cellSize)

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // トーラス世界でのセル座標を正規化
      let cellX = x % cellsX
      let cellY = y % cellsY

      if (cellX < 0) cellX += cellsX
      if (cellY < 0) cellY += cellsY

      cells.push({ x: cellX, y: cellY })
    }
  }

  return cells
}

/** トーラス世界での線分と円の交差判定 */
export const lineCircleIntersection = (
  lineStart: Vec2,
  lineEnd: Vec2,
  circleCenter: Vec2,
  circleRadius: number,
  worldWidth: number,
  worldHeight: number
): boolean => {
  // 最短経路での線分を計算
  const lineVec = shortestVector(lineStart, lineEnd, worldWidth, worldHeight)
  const startToCenter = shortestVector(lineStart, circleCenter, worldWidth, worldHeight)

  // 線分の長さの2乗
  const lineLength2 = Vec2Utils.magnitudeSquared(lineVec)

  // 線分の長さが0の場合（点の場合）
  if (lineLength2 === 0) {
    return Vec2Utils.magnitudeSquared(startToCenter) <= circleRadius * circleRadius
  }

  // 線分上の最近点を求めるためのパラメータtを計算
  // t = dot(startToCenter, lineVec) / lineLength2
  const t = Math.max(0, Math.min(1, Vec2Utils.dot(startToCenter, lineVec) / lineLength2))

  // 線分上の最近点
  const closestPoint = {
    x: lineStart.x + t * lineVec.x,
    y: lineStart.y + t * lineVec.y,
  }

  // 最近点から円の中心までの距離をトーラス世界で計算
  const closestToCenter = shortestVector(closestPoint, circleCenter, worldWidth, worldHeight)
  const distance2 = Vec2Utils.magnitudeSquared(closestToCenter)

  return distance2 <= circleRadius * circleRadius
}
