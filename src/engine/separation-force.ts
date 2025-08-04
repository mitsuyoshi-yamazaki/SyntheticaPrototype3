/**
 * 反発力計算システム - 衝突時の反発力を計算
 */

import type { GameObject, Vec2 } from "@/types/game"
import { shortestVector } from "@/utils/torus-math"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

/** 反発力計算のパラメータ */
export type SeparationForceParameters = {
  /** 反発力の上限値 */
  readonly maxForce: number
  /** 反発力のスケーリング係数 */
  readonly forceScale: number
  /** 最小反発力（数値誤差対策） */
  readonly minForce: number
}

/** デフォルトのパラメータ */
export const DEFAULT_SEPARATION_PARAMETERS: SeparationForceParameters = {
  maxForce: 1000,
  forceScale: 10,
  minForce: 1,
}

/**
 * 2つのオブジェクト間の反発力を計算
 * @param obj1 オブジェクト1
 * @param obj2 オブジェクト2
 * @param worldWidth 世界の幅
 * @param worldHeight 世界の高さ
 * @param parameters 反発力パラメータ
 * @returns obj1に作用する反発力ベクトル
 */
export const calculateSeparationForce = (
  obj1: GameObject,
  obj2: GameObject,
  worldWidth: number,
  worldHeight: number,
  parameters: SeparationForceParameters = DEFAULT_SEPARATION_PARAMETERS
): Vec2 => {
  // トーラス世界での最短ベクトル（obj1からobj2へ）
  const delta = shortestVector(obj1.position, obj2.position, worldWidth, worldHeight)

  // 距離の計算
  const distanceSq = delta.x * delta.x + delta.y * delta.y
  const distance = Math.sqrt(distanceSq)

  // 重なり深度の計算
  const radiusSum = obj1.radius + obj2.radius
  const overlap = radiusSum - distance

  // 衝突していない場合
  if (overlap <= 0) {
    return Vec2Utils.create(0, 0)
  }

  // 半径0のオブジェクトは反発力を受けない
  if (obj1.radius === 0 || obj2.radius === 0) {
    return Vec2Utils.create(0, 0)
  }

  // tanh関数により滑らかに上限に漸近する反発力の大きさ
  const forceMagnitude = parameters.maxForce * Math.tanh(overlap / parameters.forceScale)

  // 最小反発力の適用（数値誤差対策）
  const actualForceMagnitude = Math.max(forceMagnitude, parameters.minForce)

  // 反発方向の計算（obj1から見た場合）
  let directionX: number
  let directionY: number

  if (distance > 0.001) {
    // 通常の場合：obj2からobj1への方向（反発）
    directionX = -delta.x / distance
    directionY = -delta.y / distance
  } else {
    // 完全に重なっている場合：ランダムな方向
    const angle = Math.random() * 2 * Math.PI
    directionX = Math.cos(angle)
    directionY = Math.sin(angle)
  }

  // 反発力ベクトル
  return Vec2Utils.create(actualForceMagnitude * directionX, actualForceMagnitude * directionY)
}

/**
 * 複数の衝突による合成反発力を計算
 * @param object 対象オブジェクト
 * @param collidingObjects 衝突している他のオブジェクト群
 * @param worldWidth 世界の幅
 * @param worldHeight 世界の高さ
 * @param parameters 反発力パラメータ
 * @returns 合成された反発力ベクトル
 */
export const calculateTotalSeparationForce = (
  object: GameObject,
  collidingObjects: GameObject[],
  worldWidth: number,
  worldHeight: number,
  parameters: SeparationForceParameters = DEFAULT_SEPARATION_PARAMETERS
): Vec2 => {
  let totalForceX = 0
  let totalForceY = 0

  for (const other of collidingObjects) {
    const force = calculateSeparationForce(object, other, worldWidth, worldHeight, parameters)

    totalForceX += force.x
    totalForceY += force.y
  }

  return Vec2Utils.create(totalForceX, totalForceY)
}
