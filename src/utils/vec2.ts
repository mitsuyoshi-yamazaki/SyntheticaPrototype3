/**
 * 2次元ベクトル演算ユーティリティ
 */

import type { Vec2 as Vec2Type } from "@/types/game"

/** ゼロベクトル */
const _ZERO: Vec2Type = { x: 0, y: 0 }

/** ベクトル作成 */
const _create = (x: number, y: number): Vec2Type => ({ x, y })

/** ベクトル加算 */
const _add = (a: Vec2Type, b: Vec2Type): Vec2Type => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

/** ベクトル減算 */
const _sub = (a: Vec2Type, b: Vec2Type): Vec2Type => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

/** スカラー倍 */
const _scale = (v: Vec2Type, s: number): Vec2Type => ({
  x: v.x * s,
  y: v.y * s,
})

/** 内積 */
const _dot = (a: Vec2Type, b: Vec2Type): number => a.x * b.x + a.y * b.y

/** ベクトルの大きさの2乗 */
const _magnitudeSquared = (v: Vec2Type): number => v.x * v.x + v.y * v.y

/** ベクトルの大きさ */
const _magnitude = (v: Vec2Type): number => Math.sqrt(_magnitudeSquared(v))

/** 距離の2乗 */
const _distanceSquared = (a: Vec2Type, b: Vec2Type): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return dx * dx + dy * dy
}

/** 距離 */
const _distance = (a: Vec2Type, b: Vec2Type): number => Math.sqrt(_distanceSquared(a, b))

/** 正規化（単位ベクトル化） */
const _normalize = (v: Vec2Type): Vec2Type => {
  const mag = _magnitude(v)
  if (mag === 0) return { x: 0, y: 0 }
  return _scale(v, 1 / mag)
}

/** 角度からベクトル（ラジアン） */
const _fromAngle = (angle: number): Vec2Type => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
})

/** ベクトルから角度（ラジアン） */
const _toAngle = (v: Vec2Type): number => Math.atan2(v.y, v.x)

/** 線形補間 */
const _lerp = (a: Vec2Type, b: Vec2Type, t: number): Vec2Type => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/** クランプ（最大長さ制限） */
const _clamp = (v: Vec2Type, maxLength: number): Vec2Type => {
  const mag = _magnitude(v)
  if (mag <= maxLength) return v
  return _scale(_normalize(v), maxLength)
}

/** 回転（ラジアン） */
const _rotate = (v: Vec2Type, angle: number): Vec2Type => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  }
}

/** コピー */
const _copy = (v: Vec2Type): Vec2Type => ({ x: v.x, y: v.y })

/** 等価判定 */
const _equals = (a: Vec2Type, b: Vec2Type, epsilon = 0.0001): boolean => {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
}

/**
 * Vec2名前空間
 * 2次元ベクトル演算の関数群
 */
export const Vec2 = {
  /** ゼロベクトル */
  zero: _ZERO,
  /** ベクトル作成 */
  create: _create,
  /** ベクトル加算 */
  add: _add,
  /** ベクトル減算 */
  sub: _sub,
  /** スカラー倍 */
  scale: _scale,
  /** 内積 */
  dot: _dot,
  /** ベクトルの大きさの2乗 */
  magnitudeSquared: _magnitudeSquared,
  /** ベクトルの大きさ */
  magnitude: _magnitude,
  /** 距離の2乗 */
  distanceSquared: _distanceSquared,
  /** 距離 */
  distance: _distance,
  /** 正規化（単位ベクトル化） */
  normalize: _normalize,
  /** 角度からベクトル（ラジアン） */
  fromAngle: _fromAngle,
  /** ベクトルから角度（ラジアン） */
  toAngle: _toAngle,
  /** 線形補間 */
  lerp: _lerp,
  /** クランプ（最大長さ制限） */
  clamp: _clamp,
  /** 回転（ラジアン） */
  rotate: _rotate,
  /** コピー */
  copy: _copy,
  /** 等価判定 */
  equals: _equals,
} as const
