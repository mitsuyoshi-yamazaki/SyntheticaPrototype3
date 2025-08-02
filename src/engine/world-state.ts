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
  targetFPS: 60,
}

/** 空間ハッシュグリッドのセルサイズ */
export const SPATIAL_CELL_SIZE = 100

export class WorldStateManager {
  private readonly _state: WorldState
  
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
  }
  
  /** 現在の状態を取得 */
  public get state(): Readonly<WorldState> {
    return this._state
  }
  
  /** 次のオブジェクトIDを生成 */
  public generateObjectId(): ObjectId {
    return this._state.nextObjectId++ as ObjectId
  }
  
  /** オブジェクトを追加 */
  public addObject(obj: GameObject): void {
    this._state.objects.set(obj.id, obj)
    this.updateSpatialIndex(obj)
  }
  
  /** オブジェクトを削除 */
  public removeObject(id: ObjectId): void {
    const obj = this._state.objects.get(id)
    if (obj != null) {
      this.removeSpatialIndex(obj)
      this._state.objects.delete(id)
    }
  }
  
  /** オブジェクトを取得 */
  public getObject(id: ObjectId): GameObject | undefined {
    return this._state.objects.get(id)
  }
  
  /** エネルギーソースを追加 */
  public addEnergySource(source: EnergySource): void {
    this._state.energySources.set(source.id, source)
  }
  
  /** エネルギーソースを削除 */
  public removeEnergySource(id: ObjectId): void {
    this._state.energySources.delete(id)
  }
  
  /** 力場を追加 */
  public addForceField(field: DirectionalForceField): void {
    this._state.forceFields.set(field.id, field)
  }
  
  /** 力場を削除 */
  public removeForceField(id: ObjectId): void {
    this._state.forceFields.delete(id)
  }
  
  /** tickを進める */
  public incrementTick(): void {
    this._state.tick++
  }
  
  /** パラメータを更新 */
  public updateParameters(params: Partial<WorldParameters>): void {
    Object.assign(this._state.parameters, params)
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
}