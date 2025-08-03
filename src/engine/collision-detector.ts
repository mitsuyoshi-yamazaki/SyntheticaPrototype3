/**
 * 衝突検出システム - 円形オブジェクト専用の効率的な衝突判定
 */

import type { GameObject, ObjectId, Vec2 } from "@/types/game"
import { SpatialHashGrid } from "./spatial-hash-grid"
import { shortestVector } from "@/utils/torus-math"

/** 衝突ペア */
export type CollisionPair = {
  readonly object1: GameObject
  readonly object2: GameObject
  readonly distance: number
  readonly overlap: number
}

/** 衝突検出結果 */
export type CollisionResult = {
  readonly pairs: CollisionPair[]
  readonly totalChecks: number
  readonly actualCollisions: number
}

export class CollisionDetector {
  private readonly _worldWidth: number
  private readonly _worldHeight: number
  private readonly _spatialGrid: SpatialHashGrid

  public constructor(cellSize: number, worldWidth: number, worldHeight: number) {
    this._worldWidth = worldWidth
    this._worldHeight = worldHeight
    this._spatialGrid = new SpatialHashGrid(cellSize, worldWidth, worldHeight)
  }

  /**
   * 全オブジェクト間の衝突を検出
   * @param objects ゲームオブジェクトのマップ
   * @returns 衝突検出結果
   */
  public detectCollisions(objects: Map<ObjectId, GameObject>): CollisionResult {
    // グリッドをクリアして再登録
    this._spatialGrid.clear()
    
    // 全オブジェクトをグリッドに登録
    for (const object of objects.values()) {
      this._spatialGrid.register(object)
    }

    // 衝突ペアを検出
    const pairs: CollisionPair[] = []
    const processedPairs = new Set<string>()
    let totalChecks = 0
    let actualCollisions = 0

    // 各オブジェクトについて近傍オブジェクトとの衝突をチェック
    for (const object1 of objects.values()) {
      const nearbyIds = this._spatialGrid.getNearbyObjects(object1)
      
      for (const id2 of nearbyIds) {
        const object2 = objects.get(id2)
        if (object2 === undefined) continue

        // ペアの重複チェック（IDの小さい方を先にして正規化）
        const pairKey = this.getPairKey(object1.id, object2.id)
        if (processedPairs.has(pairKey)) continue
        
        processedPairs.add(pairKey)
        totalChecks++

        // 詳細な衝突判定
        const collision = this.checkCollision(object1, object2)
        if (collision != null) {
          pairs.push(collision)
          actualCollisions++
        }
      }
    }

    return {
      pairs,
      totalChecks,
      actualCollisions,
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
    // 空間グリッドを更新
    this._spatialGrid.clear()
    for (const object of objects.values()) {
      this._spatialGrid.register(object)
    }
    
    const collisions: GameObject[] = []
    const nearbyIds = this._spatialGrid.getNearbyObjectsAtPosition(position, radius)

    for (const id of nearbyIds) {
      if (id === excludeId) continue
      
      const object = objects.get(id)
      if (object === undefined) continue

      // 仮想オブジェクトとの衝突判定
      const virtualObject: Partial<GameObject> = {
        position,
        radius,
      }

      if (this.checkCollisionBetween(virtualObject as GameObject, object)) {
        collisions.push(object)
      }
    }

    return collisions
  }

  /**
   * 2つのオブジェクト間の衝突をチェック
   * @param object1 オブジェクト1
   * @param object2 オブジェクト2
   * @returns 衝突している場合は衝突情報、そうでなければnull
   */
  private checkCollision(object1: GameObject, object2: GameObject): CollisionPair | null {
    // トーラス世界での最短ベクトルを計算
    const delta = shortestVector(
      object1.position,
      object2.position,
      this._worldWidth,
      this._worldHeight
    )

    // 距離の二乗を計算（平方根を避けて高速化）
    const distanceSq = delta.x * delta.x + delta.y * delta.y
    const radiusSum = object1.radius + object2.radius
    const radiusSumSq = radiusSum * radiusSum

    // 衝突していない場合
    if (distanceSq >= radiusSumSq) {
      return null
    }
    
    // 半径0のオブジェクトは衝突しない
    if (object1.radius === 0 || object2.radius === 0) {
      return null
    }

    // 実際の距離を計算（衝突している場合のみ）
    const distance = Math.sqrt(distanceSq)
    const overlap = radiusSum - distance

    return {
      object1,
      object2,
      distance,
      overlap,
    }
  }

  /**
   * 2つのオブジェクト間の衝突判定（単純なboolean返却）
   */
  private checkCollisionBetween(object1: GameObject, object2: GameObject): boolean {
    const delta = shortestVector(
      object1.position,
      object2.position,
      this._worldWidth,
      this._worldHeight
    )

    // 半径0のオブジェクトは衝突しない
    if (object1.radius === 0 || object2.radius === 0) {
      return false
    }
    
    const distanceSq = delta.x * delta.x + delta.y * delta.y
    const radiusSum = object1.radius + object2.radius
    const radiusSumSq = radiusSum * radiusSum

    return distanceSq < radiusSumSq
  }

  /**
   * ペアのキーを生成（重複チェック用）
   */
  private getPairKey(id1: ObjectId, id2: ObjectId): string {
    // IDを数値として比較（ObjectIdの内部表現に依存）
    const numId1 = id1 as unknown as number
    const numId2 = id2 as unknown as number
    
    if (numId1 < numId2) {
      return `${id1},${id2}`
    } else {
      return `${id2},${id1}`
    }
  }

  /**
   * 空間グリッドを更新（オブジェクトの移動時に使用）
   * @param oldObject 移動前のオブジェクト
   * @param newObject 移動後のオブジェクト
   */
  public updateObject(oldObject: GameObject, newObject: GameObject): void {
    this._spatialGrid.unregister(oldObject)
    this._spatialGrid.register(newObject)
  }

  /**
   * デバッグ情報を取得
   */
  public getDebugInfo(): {
    gridInfo: ReturnType<SpatialHashGrid["getDebugInfo"]>
  } {
    return {
      gridInfo: this._spatialGrid.getDebugInfo(),
    }
  }
}