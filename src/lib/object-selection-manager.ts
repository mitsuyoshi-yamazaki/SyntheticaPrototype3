/**
 * オブジェクト選択状態の管理
 */

import type { GameObject, ObjectId, Hull } from "@/types/game"
import type { Vec2 } from "@/types/game"
import { isHull } from "@/utils/type-guards"

/**
 * 選択されたオブジェクトの情報
 */
export type SelectedObjectInfo = {
  object: GameObject
  screenPosition: Vec2
}

/**
 * オブジェクト選択マネージャー
 * クリックによるオブジェクト選択を管理
 */
export class ObjectSelectionManager {
  private _selectedObjectId: ObjectId | null = null
  private _objects: Map<ObjectId, GameObject>
  private _screenPosition: Vec2 | null = null

  public constructor(objects: Map<ObjectId, GameObject>) {
    this._objects = objects
  }

  /**
   * オブジェクトマップを更新
   */
  public updateObjects(objects: Map<ObjectId, GameObject>): void {
    this._objects = objects
    
    // 選択中のオブジェクトが削除されていたらクリア
    if (this._selectedObjectId != null && !objects.has(this._selectedObjectId)) {
      this.clearSelection()
    }
  }

  /**
   * 指定座標のオブジェクトを選択
   * @param worldPosition ワールド座標
   * @param screenPosition スクリーン座標（情報ウィンドウ表示用）
   * @returns 選択されたオブジェクト（なければnull）
   */
  public selectObjectAt(worldPosition: Vec2, screenPosition: Vec2): GameObject | null {
    // クリック位置にあるオブジェクトを探す
    let selectedObject: GameObject | null = null
    let minDistance = Infinity

    for (const obj of this._objects.values()) {
      // 現状はHULLのみ選択可能
      if (!isHull(obj)) {
        continue
      }

      // オブジェクトとの距離を計算
      const dx = obj.position.x - worldPosition.x
      const dy = obj.position.y - worldPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // オブジェクトの半径内にあるか確認
      if (distance <= obj.radius && distance < minDistance) {
        selectedObject = obj
        minDistance = distance
      }
    }

    // 選択状態を更新
    if (selectedObject != null) {
      // 同じオブジェクトをクリックした場合はトグル
      if (this._selectedObjectId === selectedObject.id) {
        this.clearSelection()
        return null
      } else {
        this._selectedObjectId = selectedObject.id
        this._screenPosition = { ...screenPosition }
        return selectedObject
      }
    } else {
      // 何もない場所をクリックしたらクリア
      this.clearSelection()
      return null
    }
  }

  /**
   * 選択をクリア
   */
  public clearSelection(): void {
    this._selectedObjectId = null
    this._screenPosition = null
  }

  /**
   * 現在選択されているオブジェクトを取得
   */
  public getSelectedObject(): SelectedObjectInfo | null {
    if (this._selectedObjectId == null || this._screenPosition == null) {
      return null
    }

    const object = this._objects.get(this._selectedObjectId)
    if (object == null) {
      this.clearSelection()
      return null
    }

    return {
      object,
      screenPosition: this._screenPosition,
    }
  }

  /**
   * オブジェクトが選択されているか
   */
  public isSelected(objectId: ObjectId): boolean {
    return this._selectedObjectId === objectId
  }
}

/**
 * HULLの使用容量を計算（%）
 * @param hull HULLオブジェクト
 * @param units 接続されているユニット
 * @returns 使用容量のパーセンテージ
 */
export const calculateHullUsage = (hull: Hull, units: GameObject[]): number => {
  // 格納エネルギー
  let usedCapacity = hull.storedEnergy

  // ユニットの容積を計算（簡易的に質量を容積として扱う）
  for (const unit of units) {
    usedCapacity += unit.mass
  }

  // パーセンテージ計算
  return (usedCapacity / hull.capacity) * 100
}

/**
 * エネルギー量を表示用にフォーマット
 * @param energy エネルギー量
 * @returns フォーマットされた文字列
 */
export const formatEnergy = (energy: number): string => {
  if (energy >= 1024) {
    return `${(energy / 1024).toFixed(1)}kE`
  }
  return `${energy}E`
}

/**
 * 接続ユニットの種別をカウント
 * @param units ユニット配列
 * @returns 種別ごとのカウント
 */
export const countUnitTypes = (units: GameObject[]): Map<string, number> => {
  const counts = new Map<string, number>()
  
  for (const unit of units) {
    const current = counts.get(unit.type) ?? 0
    counts.set(unit.type, current + 1)
  }
  
  return counts
}

/**
 * 接続ユニット情報を文字列化
 * @param counts ユニット種別カウント
 * @returns フォーマットされた文字列
 */
export const formatUnitCounts = (counts: Map<string, number>): string => {
  if (counts.size === 0) {
    return "なし"
  }

  const parts: string[] = []
  for (const [type, count] of counts.entries()) {
    parts.push(`${type}×${count}`)
  }
  
  return parts.join(", ")
}