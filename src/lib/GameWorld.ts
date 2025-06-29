import type p5 from "p5"

/**
 * ゲーム世界の基本クラス
 * ゲームロジックとレンダリングを分離する
 */
export class GameWorld {
  private _tickCount = 0
  private _width: number
  private _height: number

  public constructor(width: number, height: number) {
    this._width = width
    this._height = height
  }

  /**
   * 現在のtick数を取得
   */
  public get tickCount(): number {
    return this._tickCount
  }

  /**
   * 世界の幅を取得
   */
  public get width(): number {
    return this._width
  }

  /**
   * 世界の高さを取得
   */
  public get height(): number {
    return this._height
  }

  /**
   * ゲーム世界を1tick進める
   * 物理演算、ユニットの動作処理などを行う
   */
  public tick(): void {
    this._tickCount++

    // TODO: 物理演算の実行
    // TODO: ユニットの動作処理
    // TODO: 資源の生成・消費処理
    // TODO: エージェントのAI処理

    console.log(`World tick: ${this._tickCount}`)
  }

  /**
   * ゲーム世界をレンダリング
   * @param p p5インスタンス
   */
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
