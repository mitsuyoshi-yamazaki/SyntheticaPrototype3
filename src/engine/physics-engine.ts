/**
 * 物理演算エンジン - 衝突検出と物理シミュレーションの統合
 */

import type { GameObject, ObjectId, Vec2 } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { wrapPosition } from "@/utils/torus-math"
import { CollisionDetector } from "./collision-detector"
import { calculateSeparationForce, DEFAULT_SEPARATION_PARAMETERS } from "./separation-force"
import type { SeparationForceParameters } from "./separation-force"

/** 物理演算のパラメータ */
export type PhysicsParameters = {
  /** 摩擦係数（0-1、1で摩擦なし） */
  readonly frictionCoefficient: number
  /** 反発力パラメータ */
  readonly separationForce: SeparationForceParameters
  /** 数値的安定性のための緊急速度制限 */
  readonly emergencyVelocityLimit: number
  /** ゼロ除算防止用の最小質量 */
  readonly minMass: number
}

/** 物理演算のパラメータ更新用型 */
export type PhysicsParametersUpdate = {
  /** 摩擦係数（0-1、1で摩擦なし） */
  frictionCoefficient?: number
  /** 反発力パラメータ */
  separationForce?: SeparationForceParameters
  /** 数値的安定性のための緊急速度制限 */
  emergencyVelocityLimit?: number
  /** ゼロ除算防止用の最小質量 */
  minMass?: number
}

/** デフォルトのパラメータ */
export const DEFAULT_PHYSICS_PARAMETERS: PhysicsParameters = {
  frictionCoefficient: 0.98, // 暫定値
  separationForce: DEFAULT_SEPARATION_PARAMETERS,
  emergencyVelocityLimit: 10000,
  minMass: 0.001,
}

/** 物理演算の結果 */
export type PhysicsUpdateResult = {
  /** 衝突ペア数 */
  readonly collisionCount: number
  /** 処理したオブジェクト数 */
  readonly objectCount: number
  /** 物理演算にかかった時間（ミリ秒） */
  readonly elapsedTime: number
}

/** オブジェクトの加速度マップ */
type AccelerationMap = Map<ObjectId, Vec2>

export class PhysicsEngine {
  private readonly _worldWidth: number
  private readonly _worldHeight: number
  private readonly _collisionDetector: CollisionDetector
  private readonly _parameters: PhysicsParameters
  
  public constructor(
    cellSize: number,
    worldWidth: number,
    worldHeight: number,
    parameters: PhysicsParameters = DEFAULT_PHYSICS_PARAMETERS
  ) {
    this._worldWidth = worldWidth
    this._worldHeight = worldHeight
    this._parameters = parameters
    this._collisionDetector = new CollisionDetector(cellSize, worldWidth, worldHeight)
  }
  
  /**
   * 物理演算の更新
   * @param objects ゲームオブジェクトのマップ
   * @param deltaTime 時間ステップ
   * @returns 物理演算の結果
   */
  public update(objects: Map<ObjectId, GameObject>, deltaTime: number): PhysicsUpdateResult {
    const startTime = performance.now()
    
    // 1. 加速度の初期化
    const accelerations = this.initializeAccelerations(objects)
    
    // 2. 外部力の適用（将来的に実装）
    // this.applyExternalForces(objects, accelerations)
    
    // 3. 衝突検出
    const collisionResult = this._collisionDetector.detectCollisions(objects)
    
    // 4. 反発力の計算と適用
    this.applySeparationForces(objects, collisionResult.pairs, accelerations)
    
    // 5. 運動の更新
    this.updateMotion(objects, accelerations, deltaTime)
    
    const elapsedTime = performance.now() - startTime
    
    return {
      collisionCount: collisionResult.actualCollisions,
      objectCount: objects.size,
      elapsedTime,
    }
  }
  
  /**
   * 加速度マップの初期化
   */
  private initializeAccelerations(objects: Map<ObjectId, GameObject>): AccelerationMap {
    const accelerations = new Map<ObjectId, Vec2>()
    
    for (const object of objects.values()) {
      accelerations.set(object.id, Vec2Utils.create(0, 0))
    }
    
    return accelerations
  }
  
  /**
   * 反発力の計算と適用
   */
  private applySeparationForces(
    _objects: Map<ObjectId, GameObject>,
    collisionPairs: { readonly object1: GameObject; readonly object2: GameObject }[],
    accelerations: AccelerationMap
  ): void {
    for (const pair of collisionPairs) {
      // 反発力を計算
      const force = calculateSeparationForce(
        pair.object1,
        pair.object2,
        this._worldWidth,
        this._worldHeight,
        this._parameters.separationForce
      )
      
      // 作用・反作用の法則
      this.applyForce(pair.object1, force, accelerations)
      this.applyForce(
        pair.object2,
        Vec2Utils.create(-force.x, -force.y),
        accelerations
      )
    }
  }
  
  /**
   * オブジェクトに力を適用
   */
  private applyForce(
    object: GameObject,
    force: Vec2,
    accelerations: AccelerationMap
  ): void {
    // F = ma より a = F/m
    const mass = Math.max(object.mass, this._parameters.minMass)
    const accelerationDelta = Vec2Utils.create(
      force.x / mass,
      force.y / mass
    )
    
    const currentAcceleration = accelerations.get(object.id)
    if (currentAcceleration === undefined) {
      return
    }
    
    // 加速度を蓄積
    accelerations.set(object.id, Vec2Utils.create(
      currentAcceleration.x + accelerationDelta.x,
      currentAcceleration.y + accelerationDelta.y
    ))
  }
  
  /**
   * 運動の更新
   */
  private updateMotion(
    objects: Map<ObjectId, GameObject>,
    accelerations: AccelerationMap,
    deltaTime: number
  ): void {
    for (const object of objects.values()) {
      const acceleration = accelerations.get(object.id)
      if (acceleration === undefined) {
        continue
      }
      
      // 速度の更新（v = v0 + at）
      const newVelocityX = object.velocity.x + acceleration.x * deltaTime
      const newVelocityY = object.velocity.y + acceleration.y * deltaTime
      
      // 摩擦の適用
      const friction = this._parameters.frictionCoefficient
      const velocityX = newVelocityX * friction
      const velocityY = newVelocityY * friction
      
      // 数値的安定性のための緊急速度制限
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
      let finalVelocity: Vec2
      
      if (speed > this._parameters.emergencyVelocityLimit) {
        const scale = this._parameters.emergencyVelocityLimit / speed
        finalVelocity = Vec2Utils.create(
          velocityX * scale,
          velocityY * scale
        )
      } else {
        finalVelocity = Vec2Utils.create(velocityX, velocityY)
      }
      
      // 位置の更新（x = x0 + vt）
      const newPositionX = object.position.x + finalVelocity.x * deltaTime
      const newPositionY = object.position.y + finalVelocity.y * deltaTime
      
      // トーラス境界でのラップアラウンド
      const wrappedPosition = wrapPosition(
        Vec2Utils.create(newPositionX, newPositionY),
        this._worldWidth,
        this._worldHeight
      )
      
      // オブジェクトの更新（イミュータブル）
      const updatedObject: GameObject = {
        ...object,
        position: wrappedPosition,
        velocity: finalVelocity,
      }
      
      objects.set(object.id, updatedObject)
    }
  }
  
  /**
   * 特定位置での衝突を検出
   * @param position 検査位置
   * @param radius 検査半径
   * @param objects ゲームオブジェクトのマップ
   * @param excludeId 除外するオブジェクトID（オプション）
   * @returns 衝突しているオブジェクトのリスト
   */
  public detectCollisionsAtPosition(
    position: Vec2,
    radius: number,
    objects: Map<ObjectId, GameObject>,
    excludeId?: ObjectId
  ): GameObject[] {
    return this._collisionDetector.detectCollisionsAtPosition(
      position,
      radius,
      objects,
      excludeId
    )
  }
  
  /**
   * パラメータの更新
   */
  public updateParameters(parameters: PhysicsParametersUpdate): void {
    Object.assign(this._parameters, parameters)
  }
  
  /**
   * デバッグ情報の取得
   */
  public getDebugInfo(): {
    parameters: PhysicsParameters
    collisionDetectorInfo: ReturnType<CollisionDetector["getDebugInfo"]>
  } {
    return {
      parameters: { ...this._parameters },
      collisionDetectorInfo: this._collisionDetector.getDebugInfo(),
    }
  }
}