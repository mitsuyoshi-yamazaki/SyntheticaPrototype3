/**
 * HULL情報表示レンダラー
 * PixiJSでHULLの詳細情報を描画
 */

import * as PIXI from "pixi.js"
import type { Hull, GameObject } from "@/types/game"
import {
  calculateHullUsage,
  formatEnergy,
  countUnitTypes,
  formatUnitCounts,
} from "./object-selection-manager"

/**
 * HULL情報表示レンダラー
 * 選択されたHULLの詳細情報をPixiJSで描画
 */
export class HullInfoRenderer {
  private readonly _container: PIXI.Container
  private readonly _background: PIXI.Graphics
  private readonly _titleText: PIXI.Text
  private readonly _usageLabel: PIXI.Text
  private readonly _usageValue: PIXI.Text
  private readonly _energyLabel: PIXI.Text
  private readonly _energyValue: PIXI.Text
  private readonly _unitsLabel: PIXI.Text
  private readonly _unitsValue: PIXI.Text

  private readonly _padding = 8
  private readonly _lineHeight = 16
  private readonly _width = 180
  
  /**
   * コンテナを取得
   */
  public get container(): PIXI.Container {
    return this._container
  }
  
  /**
   * 表示状態を取得
   */
  public get visible(): boolean {
    return this._container.visible
  }
  
  public constructor() {
    this._container = new PIXI.Container()
    this._container.visible = false

    // 背景
    this._background = new PIXI.Graphics()
    this._container.addChild(this._background)

    // タイトル（HULL #ID）
    this._titleText = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 12,
        fill: 0x00ff00, // 緑色
        fontWeight: "bold",
      },
    })
    this._titleText.x = this._padding
    this._titleText.y = this._padding
    this._container.addChild(this._titleText)

    // 使用容量ラベル
    this._usageLabel = new PIXI.Text({
      text: "使用容量:",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0x999999,
      },
    })
    this._usageLabel.x = this._padding
    this._usageLabel.y = this._padding + this._lineHeight * 1.5
    this._container.addChild(this._usageLabel)

    // 使用容量値
    this._usageValue = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0xffffff,
      },
    })
    this._usageValue.anchor.x = 1 // 右寄せ
    this._usageValue.x = this._width - this._padding
    this._usageValue.y = this._padding + this._lineHeight * 1.5
    this._container.addChild(this._usageValue)

    // エネルギーラベル
    this._energyLabel = new PIXI.Text({
      text: "エネルギー:",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0x999999,
      },
    })
    this._energyLabel.x = this._padding
    this._energyLabel.y = this._padding + this._lineHeight * 2.5
    this._container.addChild(this._energyLabel)

    // エネルギー値
    this._energyValue = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0xffffff,
      },
    })
    this._energyValue.anchor.x = 1
    this._energyValue.x = this._width - this._padding
    this._energyValue.y = this._padding + this._lineHeight * 2.5
    this._container.addChild(this._energyValue)

    // ユニットラベル
    this._unitsLabel = new PIXI.Text({
      text: "ユニット:",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0x999999,
      },
    })
    this._unitsLabel.x = this._padding
    this._unitsLabel.y = this._padding + this._lineHeight * 3.5
    this._container.addChild(this._unitsLabel)

    // ユニット値
    this._unitsValue = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: 11,
        fill: 0xffffff,
      },
    })
    this._unitsValue.anchor.x = 1
    this._unitsValue.x = this._width - this._padding
    this._unitsValue.y = this._padding + this._lineHeight * 3.5
    this._container.addChild(this._unitsValue)
  }

  /**
   * HULL情報を更新して表示
   * @param hull HULLオブジェクト
   * @param units 接続されているユニット
   * @param position 表示位置（ワールド座標）
   */
  public update(hull: Hull, units: GameObject[], position: { x: number; y: number }): void {
    // 位置を設定（オブジェクト位置を左上とする）
    this._container.x = position.x
    this._container.y = position.y

    // タイトル更新
    this._titleText.text = `HULL #${hull.id}`

    // 使用容量を計算して更新
    const usagePercent = calculateHullUsage(hull, units)
    this._usageValue.text = `${usagePercent.toFixed(1)}%`
    
    // 使用容量の色を変更（80%以上:赤、50%以上:黄、それ以下:白）
    if (usagePercent > 80) {
      this._usageValue.style.fill = 0xff4444
    } else if (usagePercent > 50) {
      this._usageValue.style.fill = 0xffff44
    } else {
      this._usageValue.style.fill = 0xffffff
    }

    // エネルギー表示を更新
    this._energyValue.text = formatEnergy(hull.storedEnergy)

    // 接続ユニット表示を更新
    const unitCounts = countUnitTypes(units)
    this._unitsValue.text = formatUnitCounts(unitCounts)

    // 背景を描画
    const height = this._padding * 2 + this._lineHeight * 4.5
    this._background.clear()
    
    // 半透明の黒背景
    this._background.rect(0, 0, this._width, height)
    this._background.fill({ color: 0x000000, alpha: 0.8 })
    
    // 枠線
    this._background.rect(0, 0, this._width, height)
    this._background.stroke({ width: 1, color: 0x666666 })

    // 表示
    this._container.visible = true
  }

  /**
   * 非表示にする
   */
  public hide(): void {
    this._container.visible = false
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    this._container.destroy({ children: true })
  }
}