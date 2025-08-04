/**
 * 空間ハッシュグリッド - 効率的な衝突検出のための空間分割データ構造
 */

import type { GameObject, ObjectId, Vec2 } from "@/types/game"
import { wrapPosition } from "@/utils/torus-math"

/** グリッドセル */
type GridCell = Set<ObjectId>

export class SpatialHashGrid {
  private readonly _cellSize: number
  private readonly _worldWidth: number
  private readonly _worldHeight: number
  private readonly _cols: number
  private readonly _rows: number
  private readonly _grid: Map<string, GridCell>

  public constructor(cellSize: number, worldWidth: number, worldHeight: number) {
    this._cellSize = cellSize
    this._worldWidth = worldWidth
    this._worldHeight = worldHeight
    this._cols = Math.ceil(worldWidth / cellSize)
    this._rows = Math.ceil(worldHeight / cellSize)
    this._grid = new Map()
  }

  /** グリッドをクリア */
  public clear(): void {
    this._grid.clear()
  }

  /** セルキーを生成 */
  private getCellKey(col: number, row: number): string {
    return `${col},${row}`
  }

  /** オブジェクトが占有する全セルを取得 */
  private getOccupiedCells(object: GameObject): { col: number; row: number }[] {
    const cells: { col: number; row: number }[] = []

    // オブジェクトのバウンディングボックスを計算
    const minX = object.position.x - object.radius
    const maxX = object.position.x + object.radius
    const minY = object.position.y - object.radius
    const maxY = object.position.y + object.radius

    // 占有する全セルを列挙
    const minCol = Math.floor(minX / this._cellSize)
    const maxCol = Math.floor(maxX / this._cellSize)
    const minRow = Math.floor(minY / this._cellSize)
    const maxRow = Math.floor(maxY / this._cellSize)

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        // トーラス境界を考慮してラップ
        const wrappedCol = ((col % this._cols) + this._cols) % this._cols
        const wrappedRow = ((row % this._rows) + this._rows) % this._rows
        cells.push({ col: wrappedCol, row: wrappedRow })
      }
    }

    return cells
  }

  /** オブジェクトをグリッドに登録 */
  public register(object: GameObject): void {
    const cells = this.getOccupiedCells(object)

    for (const { col, row } of cells) {
      const key = this.getCellKey(col, row)
      let cell = this._grid.get(key)

      if (cell === undefined) {
        cell = new Set()
        this._grid.set(key, cell)
      }

      cell.add(object.id)
    }
  }

  /** オブジェクトをグリッドから削除 */
  public unregister(object: GameObject): void {
    const cells = this.getOccupiedCells(object)

    for (const { col, row } of cells) {
      const key = this.getCellKey(col, row)
      const cell = this._grid.get(key)

      if (cell !== undefined) {
        cell.delete(object.id)

        // 空のセルは削除
        if (cell.size === 0) {
          this._grid.delete(key)
        }
      }
    }
  }

  /** 指定オブジェクトの近傍にあるオブジェクトIDを取得 */
  public getNearbyObjects(object: GameObject): Set<ObjectId> {
    const nearbyIds = new Set<ObjectId>()
    const cells = this.getOccupiedCells(object)

    for (const { col, row } of cells) {
      const key = this.getCellKey(col, row)
      const cell = this._grid.get(key)

      if (cell !== undefined) {
        for (const id of cell) {
          if (id !== object.id) {
            nearbyIds.add(id)
          }
        }
      }
    }

    return nearbyIds
  }

  /** 指定位置の近傍にあるオブジェクトIDを取得 */
  public getNearbyObjectsAtPosition(position: Vec2, radius: number): Set<ObjectId> {
    const nearbyIds = new Set<ObjectId>()

    // 仮想的なオブジェクトとして扱う
    const virtualObject: Partial<GameObject> = {
      position: wrapPosition(position, this._worldWidth, this._worldHeight),
      radius,
    }

    const cells = this.getOccupiedCells(virtualObject as GameObject)

    for (const { col, row } of cells) {
      const key = this.getCellKey(col, row)
      const cell = this._grid.get(key)

      if (cell !== undefined) {
        for (const id of cell) {
          nearbyIds.add(id)
        }
      }
    }

    return nearbyIds
  }

  /** デバッグ用：グリッドの状態を取得 */
  public getDebugInfo(): {
    totalCells: number
    totalObjects: number
    cellOccupancy: Map<string, number>
  } {
    let totalObjects = 0
    const cellOccupancy = new Map<string, number>()

    for (const [key, cell] of this._grid) {
      const count = cell.size
      cellOccupancy.set(key, count)
      totalObjects += count
    }

    return {
      totalCells: this._grid.size,
      totalObjects,
      cellOccupancy,
    }
  }
}
