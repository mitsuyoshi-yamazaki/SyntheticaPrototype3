import * as PIXI from "pixi.js"
import { World, WorldConfig } from "@/engine"
import type { DirectionalForceField, GameObject } from "@/types/game"
import { drawEnergySource, drawForceField, drawObject } from "./render-utils"
import { HeatMapRenderer } from "./heat-map-renderer"
import { ObjectSelectionManager } from "./object-selection-manager"
import { HullInfoRenderer } from "./hull-info-renderer"
import { isHull } from "@/utils/type-guards"

/**
 * ゲーム世界の基本クラス
 * 新しいエンジンへのブリッジとして機能
 */
export class GameWorld {
  private readonly _world: World
  private readonly _heatMapRenderer: HeatMapRenderer
  private readonly _selectionManager: ObjectSelectionManager
  private readonly _hullInfoRenderer: HullInfoRenderer

  public get tickCount(): number {
    return this._world.state.tick
  }

  public get width(): number {
    return this._world.state.width
  }

  public get height(): number {
    return this._world.state.height
  }

  /** 熱マップの表示状態を取得 */
  public get isHeatMapVisible(): boolean {
    return this._heatMapRenderer.visible
  }

  public constructor(config: WorldConfig) {
    // 熱マップレンダラーの初期化
    this._heatMapRenderer = new HeatMapRenderer(10) // 1グリッド = 10ピクセル

    // ワールドの初期化（デモ用設定を含む）
    this._world = new World(config)

    // 選択マネージャーの初期化
    this._selectionManager = new ObjectSelectionManager(this._world.state.objects)

    // HULL情報レンダラーの初期化
    this._hullInfoRenderer = new HullInfoRenderer()
  }

  /** ゲームオブジェクトの総数を取得 */
  public getObjectCount(): number {
    return this._world.state.objects.size
  }

  public renderPixi(container: PIXI.Container): void {
    // コンテナをクリア
    container.removeChildren()

    // 熱マップレイヤーを追加（一番下に描画）
    const heatSystem = this._world.heatSystem
    this._heatMapRenderer.update(heatSystem)
    container.addChild(this._heatMapRenderer.graphics)

    // 世界の境界線を描画
    const border = new PIXI.Graphics()
    border.rect(0, 0, this.width, this.height)
    border.stroke({ width: 1, color: 0x666666 })
    container.addChild(border)

    // 力場を描画（デザイン仕様: rgba(173,216,230,0.2)）
    for (const field of this._world.state.forceFields.values()) {
      const fieldGraphics = new PIXI.Graphics()

      drawForceField(fieldGraphics, field)

      container.addChild(fieldGraphics)
    }

    // エネルギーソースを描画（デザイン仕様: #FFB700、太陽型）
    for (const source of this._world.state.energySources.values()) {
      const sourceGraphics = new PIXI.Graphics()
      drawEnergySource(sourceGraphics, source)

      container.addChild(sourceGraphics)
    }

    // ゲームオブジェクトを描画（デザイン仕様準拠）
    for (const obj of this._world.state.objects.values()) {
      const objGraphics = new PIXI.Graphics()

      // drawObjectを使用して描画
      drawObject(objGraphics, obj, id => this._world.state.objects.get(id))

      objGraphics.x = obj.position.x
      objGraphics.y = obj.position.y
      container.addChild(objGraphics)
    }

    // HULL情報ウィンドウを描画（最前面）
    container.addChild(this._hullInfoRenderer.container)
  }

  /** 1tick進める */
  public tick(): void {
    this._world.tick()

    // 選択マネージャーのオブジェクトを更新
    this._selectionManager.updateObjects(this._world.state.objects)

    // 選択中のHULL情報を更新
    this.updateHullInfo()
  }

  /** 熱マップの表示状態を切り替え */
  public toggleHeatMap(): void {
    this._heatMapRenderer.visible = !this._heatMapRenderer.visible
  }

  /** 熱マップの表示状態を設定 */
  public setHeatMapVisible(visible: boolean): void {
    this._heatMapRenderer.visible = visible
  }

  /** 熱マップの透明度を設定 */
  public setHeatMapAlpha(alpha: number): void {
    this._heatMapRenderer.alpha = alpha
  }

  /** 力場を追加 */
  public addForceField(field: DirectionalForceField): void {
    this._world.addForceField(field)
  }

  /**
   * 指定位置のオブジェクトを選択
   * @param worldX ワールドX座標
   * @param worldY ワールドY座標
   */
  public selectObjectAt(worldX: number, worldY: number): void {
    const worldPosition = { x: worldX, y: worldY }
    const screenPosition = { x: worldX, y: worldY } // ワールド座標と同じ

    const selected = this._selectionManager.selectObjectAt(worldPosition, screenPosition)

    // デバッガーに選択状態を通知
    const computerDebugger = this._world.debugger
    if (computerDebugger != null) {
      if (selected != null && isHull(selected)) {
        computerDebugger.setSelectedHull(selected.id)
      } else {
        computerDebugger.setSelectedHull(null)
      }
    }

    if (selected != null && isHull(selected)) {
      // HULLが選択された場合、情報を表示
      this.updateHullInfo()
    } else {
      // 選択解除
      this._hullInfoRenderer.hide()
    }
  }

  /**
   * 選択中のHULL情報を更新
   */
  private updateHullInfo(): void {
    const selectedInfo = this._selectionManager.getSelectedObject()

    if (selectedInfo == null || !isHull(selectedInfo.object)) {
      this._hullInfoRenderer.hide()
      return
    }

    const hull = selectedInfo.object

    // 接続されているユニットを取得
    const units: GameObject[] = []
    for (const unitId of hull.attachedUnitIds) {
      const unit = this._world.state.objects.get(unitId)
      if (unit != null) {
        units.push(unit)
      }
    }

    // HULL情報を更新して表示
    this._hullInfoRenderer.update(hull, units, hull.position)
  }
}
