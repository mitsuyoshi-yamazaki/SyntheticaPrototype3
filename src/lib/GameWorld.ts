import type p5 from "p5"

/**
 * ゲーム世界の基本クラス
 * ゲームロジックとレンダリングを分離する
 */
export class GameWorld {
  /** 現在のtick数 */
  private _tickCount = 0
  /** 世界の幅 */
  private _width: number
  /** 世界の高さ */
  private _height: number

  public get tickCount(): number {
    return this._tickCount
  }

  public get width(): number {
    return this._width
  }

  public get height(): number {
    return this._height
  }

  public constructor(width: number, height: number) {
    this._width = width
    this._height = height
  }

  public tick(): void {
    this._tickCount++

    // TODO: 物理演算の実行
    // TODO: ユニットの動作処理
    // TODO: 資源の生成・消費処理
    // TODO: エージェントのAI処理

    console.log(`World tick: ${this._tickCount}`)
  }

  public render(p: p5): void {
    // TODO: ゲームオブジェクトの描画
    // TODO: ユニットの描画
    // TODO: 資源の描画
    // TODO: エフェクトの描画

    // 開発用：tick情報の表示
    p.fill(0)
    p.text(`World Tick: ${this._tickCount}`, 10, 60)

    // 開発用：世界の境界線を描画
    p.stroke(200)
    p.strokeWeight(2)
    p.noFill()
    p.rect(0, 0, this._width, this._height)
  }
}
