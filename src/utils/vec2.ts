/**
 * 2次元ベクトル演算ユーティリティ
 */

import type { Vec2 } from "@/types/game"

/** ゼロベクトル */
export const ZERO: Vec2 = { x: 0, y: 0 }

/** ベクトル作成 */
export const vec2 = (x: number, y: number): Vec2 => ({ x, y })

/** ベクトル加算 */
export const add = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

/** ベクトル減算 */
export const sub = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

/** スカラー倍 */
export const scale = (v: Vec2, s: number): Vec2 => ({
  x: v.x * s,
  y: v.y * s,
})

/** 内積 */
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y

/** ベクトルの大きさの2乗 */
export const magnitudeSquared = (v: Vec2): number => v.x * v.x + v.y * v.y

/** ベクトルの大きさ */
export const magnitude = (v: Vec2): number => Math.sqrt(magnitudeSquared(v))

/** 距離の2乗 */
export const distanceSquared = (a: Vec2, b: Vec2): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return dx * dx + dy * dy
}

/** 距離 */
export const distance = (a: Vec2, b: Vec2): number => Math.sqrt(distanceSquared(a, b))

/** 正規化（単位ベクトル化） */
export const normalize = (v: Vec2): Vec2 => {
  const mag = magnitude(v)
  if (mag === 0) return { x: 0, y: 0 }
  return scale(v, 1 / mag)
}

/** 角度からベクトル（ラジアン） */
export const fromAngle = (angle: number): Vec2 => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
})

/** ベクトルから角度（ラジアン） */
export const toAngle = (v: Vec2): number => Math.atan2(v.y, v.x)

/** 線形補間 */
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/** クランプ（最大長さ制限） */
export const clamp = (v: Vec2, maxLength: number): Vec2 => {
  const mag = magnitude(v)
  if (mag <= maxLength) return v
  return scale(normalize(v), maxLength)
}

/** 回転（ラジアン） */
export const rotate = (v: Vec2, angle: number): Vec2 => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  }
}

/** コピー */
export const copy = (v: Vec2): Vec2 => ({ x: v.x, y: v.y })

/** 等価判定 */
export const equals = (a: Vec2, b: Vec2, epsilon = 0.0001): boolean => {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
}