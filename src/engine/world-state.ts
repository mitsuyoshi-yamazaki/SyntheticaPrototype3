/**
 * ゲーム世界の状態管理
 */

import type {
  GameObject,
  ObjectId,
  WorldState,
  WorldParameters,
  EnergySource,
  DirectionalForceField,
} from "@/types/game"
import { PhysicsEngine, DEFAULT_PHYSICS_PARAMETERS } from "./physics-engine"
import type { PhysicsParameters, PhysicsParametersUpdate } from "./physics-engine"

/** デフォルトのワールドパラメータ */
export const DEFAULT_PARAMETERS: WorldParameters = {
  // 物理
  maxForce: 10,
  forceScale: 5,
  friction: 0.98,

  // エネルギー
  energySourceCount: 10,
  energySourceMinRate: 10,
  energySourceMaxRate: 100,

  // 熱
  heatDiffusionRate: 0.1,
  heatRadiationRate: 0.9,

  // シミュレーション
  ticksPerFrame: 1,
  maxFPS: 60,
}

/** 空間ハッシュグリッドのセルサイズ */
export const SPATIAL_CELL_SIZE = 100

export class WorldStateManager {
  private readonly _state: WorldState
  private readonly _physicsEngine: PhysicsEngine

  /** 現在の状態を取得 */
  public get state(): Readonly<WorldState> {
    return this._state
  }

  public constructor(width: number, height: number, parameters?: Partial<WorldParameters>) {
    this._state = {
      width,
      height,
      tick: 0,
      objects: new Map(),
      energySources: new Map(),
      forceFields: new Map(),
      spatialIndex: new Map(),
      parameters: { ...DEFAULT_PARAMETERS, ...parameters },
      nextObjectId: 1,
    }

    // 物理演算エンジンの初期化
    const physicsParams: PhysicsParameters = {
      ...DEFAULT_PHYSICS_PARAMETERS,
      frictionCoefficient: parameters?.friction ?? DEFAULT_PARAMETERS.friction,
      separationForce: {
        maxForce: parameters?.maxForce ?? DEFAULT_PARAMETERS.maxForce,
        forceScale: parameters?.forceScale ?? DEFAULT_PARAMETERS.forceScale,
        minForce: 1,
      },
    }
    this._physicsEngine = new PhysicsEngine(SPATIAL_CELL_SIZE, width, height, physicsParams)
  }

  /** 次のオブジェクトIDを生成 */
  public generateObjectId(): ObjectId {
    return this._state.nextObjectId++ as ObjectId
  }

  public addObject(obj: GameObject): void {
    this._state.objects.set(obj.id, obj)
    this.updateSpatialIndex(obj)
  }

  public removeObject(id: ObjectId): void {
    const obj = this._state.objects.get(id)
    if (obj != null) {
      this.removeSpatialIndex(obj)
      this._state.objects.delete(id)
    }
  }

  /** オブジェクトを更新 */
  public updateObject(obj: GameObject): void {
    const oldObj = this._state.objects.get(obj.id)
    if (oldObj != null) {
      // 空間インデックスを更新
      this.removeSpatialIndex(oldObj)
      this._state.objects.set(obj.id, obj)
      this.updateSpatialIndex(obj)
    }
  }

  /** オブジェクトを取得 */
  public getObject(id: ObjectId): GameObject | undefined {
    return this._state.objects.get(id)
  }

  /** 全オブジェクトを取得 */
  public getAllObjects(): GameObject[] {
    return Array.from(this._state.objects.values())
  }

  public addEnergySource(source: EnergySource): void {
    this._state.energySources.set(source.id, source)
  }

  public removeEnergySource(id: ObjectId): void {
    this._state.energySources.delete(id)
  }

  public addForceField(field: DirectionalForceField): void {
    this._state.forceFields.set(field.id, field)
  }

  public removeForceField(id: ObjectId): void {
    this._state.forceFields.delete(id)
  }

  public incrementTick(): void {
    this._state.tick++
  }

  public updateParameters(params: Partial<WorldParameters>): void {
    Object.assign(this._state.parameters, params)

    // 物理演算パラメータも更新
    if (params.friction != null || params.maxForce != null || params.forceScale != null) {
      const physicsParams: PhysicsParametersUpdate = {}
      if (params.friction != null) {
        physicsParams.frictionCoefficient = params.friction
      }
      if (params.maxForce != null || params.forceScale != null) {
        physicsParams.separationForce = {
          maxForce: params.maxForce ?? this._state.parameters.maxForce,
          forceScale: params.forceScale ?? this._state.parameters.forceScale,
          minForce: 1,
        }
      }
      this._physicsEngine.updateParameters(physicsParams)
    }
  }

  /** 空間インデックスを更新 */
  public updateSpatialIndex(obj: GameObject): void {
    // 古いセルから削除
    this.removeSpatialIndex(obj)

    // 新しいセルに追加
    const cellKey = this.getCellKey(obj.position.x, obj.position.y)
    let cell = this._state.spatialIndex.get(cellKey)
    if (cell == null) {
      cell = { objects: new Set() }
      this._state.spatialIndex.set(cellKey, cell)
    }
    cell.objects.add(obj.id)
  }

  /** 空間インデックスから削除 */
  private removeSpatialIndex(obj: GameObject): void {
    const cellKey = this.getCellKey(obj.position.x, obj.position.y)
    const cell = this._state.spatialIndex.get(cellKey)
    if (cell != null) {
      cell.objects.delete(obj.id)
      if (cell.objects.size === 0) {
        this._state.spatialIndex.delete(cellKey)
      }
    }
  }

  /** セルキーを生成 */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / SPATIAL_CELL_SIZE)
    const cellY = Math.floor(y / SPATIAL_CELL_SIZE)
    return `${cellX},${cellY}`
  }

  /** 指定範囲内のオブジェクトを取得 */
  public getObjectsInRange(x: number, y: number, range: number): GameObject[] {
    const objects: GameObject[] = []
    const cellRange = Math.ceil(range / SPATIAL_CELL_SIZE)

    const centerCellX = Math.floor(x / SPATIAL_CELL_SIZE)
    const centerCellY = Math.floor(y / SPATIAL_CELL_SIZE)

    // 範囲内のセルをチェック
    for (let dx = -cellRange; dx <= cellRange; dx++) {
      for (let dy = -cellRange; dy <= cellRange; dy++) {
        const cellX = centerCellX + dx
        const cellY = centerCellY + dy
        const cellKey = `${cellX},${cellY}`

        const cell = this._state.spatialIndex.get(cellKey)
        if (cell != null) {
          for (const objId of cell.objects) {
            const obj = this._state.objects.get(objId)
            if (obj != null) {
              objects.push(obj)
            }
          }
        }
      }
    }

    return objects
  }

  /** 全オブジェクトの空間インデックスを再構築 */
  public rebuildSpatialIndex(): void {
    this._state.spatialIndex.clear()
    for (const obj of this._state.objects.values()) {
      this.updateSpatialIndex(obj)
    }
  }

  /**
   * 物理演算を実行
   * @param deltaTime 時間ステップ
   * @returns 物理演算の結果
   */
  public updatePhysics(deltaTime: number): ReturnType<PhysicsEngine["update"]> {
    return this._physicsEngine.update(this._state.objects, this._state.forceFields, deltaTime)
  }

  /**
   * 特定位置での衝突を検出
   * @param position 検査位置
   * @param radius 検査半径
   * @param excludeId 除外するオブジェクトID（オプション）
   * @returns 衝突しているオブジェクトのリスト
   */
  public detectCollisionsAtPosition(
    position: { x: number; y: number },
    radius: number,
    excludeId?: ObjectId
  ): GameObject[] {
    return this._physicsEngine.detectCollisionsAtPosition(
      position,
      radius,
      this._state.objects,
      excludeId
    )
  }

  /**
   * 指定位置のセルに熱を追加（熱システム統合時に実装予定）
   * @param position 座標
   * @param heat 追加する熱量
   */
  public addHeatToCell(position: { x: number; y: number }, heat: number): void {
    // TODO: 熱システムの実装時に完全実装
    // 現在は熱システムが未実装のため、ログ出力のみ
    if (heat > 0) {
      console.debug(`Heat generated at (${position.x}, ${position.y}): ${heat}`)
    }
  }
}
