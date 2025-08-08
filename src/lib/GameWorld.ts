import * as PIXI from "pixi.js"
import { World } from "@/engine"
import type { DirectionalForceField } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { SELF_REPLICATOR_PRESET } from "@/engine/presets/self-replicator-preset"
import { drawEnergySource, drawForceField, drawObject } from "./render-utils"
import { HeatMapRenderer } from "./heat-map-renderer"

/**
 * ゲーム世界の基本クラス
 * 新しいエンジンへのブリッジとして機能
 */
export class GameWorld {
  private readonly _world: World
  private readonly _heatMapRenderer: HeatMapRenderer

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

  public constructor(width: number, height: number) {
    // 熱マップレンダラーの初期化
    this._heatMapRenderer = new HeatMapRenderer(10) // 1グリッド = 10ピクセル
    
    // ワールドの初期化（デモ用設定を含む）
    this._world = new World({
      width,
      height,
      parameters: {
        energySourceCount: 5, // エネルギーソースを5つ配置
        energySourceMinRate: 50,
        energySourceMaxRate: 150,
        ticksPerFrame: 1,
      },
      defaultAgentPresets: [
        {
          preset: SELF_REPLICATOR_PRESET,
          position: Vec2Utils.create(width * 0.3, height * 0.5),
        },
      ],
    })
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
  }

  /** 1tick進める */
  public tick(): void {
    this._world.tick()
  }

  /** デバッグ用：ランダムエネルギー生成 */
  public spawnRandomEnergy(amount: number): void {
    this._world.spawnRandomEnergy(amount)
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
}
