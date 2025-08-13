/**
 * 熱マップレンダリング
 * HeatSystemの熱グリッドをPixiJSで可視化
 */

import * as PIXI from "pixi.js"
import type { HeatSystem } from "@/engine/heat-system"

/**
 * 熱マップレンダラー
 * 熱グリッドを赤系の色の濃淡で表示
 */
export class HeatMapRenderer {
  private readonly _graphics: PIXI.Graphics
  private readonly _cellSize: number
  private _visible = false
  private _alpha = 0.7

  /** グラフィックスオブジェクトを取得 */
  public get graphics(): PIXI.Graphics {
    return this._graphics
  }

  /** 表示状態を取得 */
  public get visible(): boolean {
    return this._visible
  }

  /** 表示状態を設定 */
  public set visible(value: boolean) {
    this._visible = value
    this._graphics.visible = value
  }

  /** 透明度を設定（0.0～1.0） */
  public set alpha(value: number) {
    this._alpha = Math.max(0, Math.min(1, value))
    this._graphics.alpha = this._alpha
  }

  /**
   * @param cellSize 1セルのピクセルサイズ（デフォルト: 10）
   */
  public constructor(cellSize = 10) {
    this._graphics = new PIXI.Graphics()
    this._cellSize = cellSize
    this._graphics.visible = false
  }

  /**
   * 熱マップを更新
   * @param heatSystem 熱システム
   * @param maxHeat 最大熱量（色の正規化用）
   */
  public update(heatSystem: HeatSystem, maxHeat = 500): void {
    this._graphics.clear()

    if (!this._visible) {
      return
    }

    const heatGrid = heatSystem.heatGrid

    for (let y = 0; y < heatGrid.length; y++) {
      const row = heatGrid[y]
      if (row === undefined) {
        continue
      }

      for (let x = 0; x < row.length; x++) {
        const heat = row[x] ?? 0
        if (heat <= 0) {
          continue
        }

        // 熱量を色に変換
        const color = this.heatToColor(heat, maxHeat)

        // セルを描画
        this._graphics.fill(color)
        this._graphics.rect(x * this._cellSize, y * this._cellSize, this._cellSize, this._cellSize)
      }
    }
  }

  /**
   * 熱量を色に変換
   * @param heat 熱量
   * @param maxHeat 最大熱量
   * @returns RGB色コード
   */
  private heatToColor(heat: number, maxHeat: number): number {
    // 熱量を0-1に正規化
    const normalized = Math.min(1, heat / maxHeat)

    // 色の計算（黒→暗赤→赤→橙→黄）
    let r: number, g: number, b: number

    if (normalized < 0.25) {
      // 黒→暗赤（0-0.25）
      const t = normalized * 4
      r = Math.floor(128 * t)
      g = 0
      b = 0
    } else if (normalized < 0.5) {
      // 暗赤→赤（0.25-0.5）
      const t = (normalized - 0.25) * 4
      r = Math.floor(128 + 127 * t)
      g = 0
      b = 0
    } else if (normalized < 0.75) {
      // 赤→橙（0.5-0.75）
      const t = (normalized - 0.5) * 4
      r = 255
      g = Math.floor(165 * t)
      b = 0
    } else {
      // 橙→黄（0.75-1.0）
      const t = (normalized - 0.75) * 4
      r = 255
      g = Math.floor(165 + 90 * t)
      b = Math.floor(100 * t)
    }

    // RGB値を16進数に変換
    return (r << 16) | (g << 8) | b
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    this._graphics.destroy()
  }
}

/**
 * 熱マップの凡例を作成
 * @param width 凡例の幅
 * @param height 凡例の高さ
 * @param maxHeat 最大熱量
 */
export const createHeatMapLegend = (width = 200, height = 20, maxHeat = 500): PIXI.Container => {
  const container = new PIXI.Container()

  // グラデーションバー
  const graphics = new PIXI.Graphics()
  const steps = width

  for (let i = 0; i < steps; i++) {
    const heat = (i / steps) * maxHeat
    const normalized = heat / maxHeat

    let r: number, g: number, b: number

    if (normalized < 0.25) {
      const t = normalized * 4
      r = Math.floor(128 * t)
      g = 0
      b = 0
    } else if (normalized < 0.5) {
      const t = (normalized - 0.25) * 4
      r = Math.floor(128 + 127 * t)
      g = 0
      b = 0
    } else if (normalized < 0.75) {
      const t = (normalized - 0.5) * 4
      r = 255
      g = Math.floor(165 * t)
      b = 0
    } else {
      const t = (normalized - 0.75) * 4
      r = 255
      g = Math.floor(165 + 90 * t)
      b = Math.floor(100 * t)
    }

    const color = (r << 16) | (g << 8) | b
    graphics.fill(color)
    graphics.rect(i, 0, 1, height)
  }

  container.addChild(graphics)

  // ラベル
  const minLabel = new PIXI.Text("0", {
    fontSize: 12,
    fill: 0xffffff,
    fontFamily: "Arial",
  })
  minLabel.x = 0
  minLabel.y = height + 2
  container.addChild(minLabel)

  const maxLabel = new PIXI.Text(maxHeat.toString(), {
    fontSize: 12,
    fill: 0xffffff,
    fontFamily: "Arial",
  })
  maxLabel.x = width - maxLabel.width
  maxLabel.y = height + 2
  container.addChild(maxLabel)

  const midLabel = new PIXI.Text((maxHeat / 2).toString(), {
    fontSize: 12,
    fill: 0xffffff,
    fontFamily: "Arial",
  })
  midLabel.x = width / 2 - midLabel.width / 2
  midLabel.y = height + 2
  container.addChild(midLabel)

  return container
}
