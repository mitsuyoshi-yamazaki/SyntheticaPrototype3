/**
 * トーラス世界用の数学ユーティリティ
 * 世界の端でループする座標系での計算
 */

import type { Vec2 } from "@/types/game"
import * as Vec2Utils from "./vec2"

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
export const distanceSquared = (a: Vec2, b: Vec2, worldWidth: number, worldHeight: number): number => {
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
  const direction = shortestVector(lineStart, lineEnd, worldWidth, worldHeight)
  const toCircle = shortestVector(lineStart, circleCenter, worldWidth, worldHeight)
  
  // 線分をパラメトリック形式で表現: P(t) = lineStart + t * direction, 0 <= t <= 1
  const a = Vec2Utils.magnitudeSquared(direction)
  const b = 2 * Vec2Utils.dot(direction, toCircle)
  const c = Vec2Utils.magnitudeSquared(toCircle) - circleRadius * circleRadius
  
  const discriminant = b * b - 4 * a * c
  
  if (discriminant < 0) return false
  
  const sqrt = Math.sqrt(discriminant)
  const t1 = (-b - sqrt) / (2 * a)
  const t2 = (-b + sqrt) / (2 * a)
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1)
}