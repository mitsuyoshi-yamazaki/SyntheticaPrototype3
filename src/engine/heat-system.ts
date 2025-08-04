/**
 * 熱拡散システム - セルオートマトンによる熱の拡散・平衡化
 */

import type { Vec2 } from "@/types/game"

/** 熱システムのパラメータ */
export type HeatSystemParameters = {
  /** 基準熱量の分母（各セルの1/Nを基準とする） */
  readonly heatDiffusionBase: number
  /** 熱流量の分母（差分の1/Nを移動） */
  readonly heatFlowRate: number
  /** 最大流量の制限比（差分の1/N未満に制限） */
  readonly heatFlowLimitRatio: number
  /** 環境温度の比率 */
  readonly radiationEnvRatio: number
  /** 放熱率の分母 */
  readonly radiationRate: number
  /** ダメージ開始温度 */
  readonly heatDamageThreshold: number
  /** 損傷時のダメージ倍率 */
  readonly damageMultiplierDamaged: number
  /** 生産中のダメージ倍率 */
  readonly damageMultiplierProducing: number
}

/** デフォルトパラメータ */
export const DEFAULT_HEAT_PARAMETERS: HeatSystemParameters = {
  heatDiffusionBase: 4,
  heatFlowRate: 3,
  heatFlowLimitRatio: 2,
  radiationEnvRatio: 0.9,
  radiationRate: 3,
  heatDamageThreshold: 100,
  damageMultiplierDamaged: 2,
  damageMultiplierProducing: 3,
}

/** 熱グリッドの統計情報 */
export type HeatGridStats = {
  /** 総熱量 */
  readonly totalHeat: number
  /** 最高温度 */
  readonly maxHeat: number
  /** 最低温度 */
  readonly minHeat: number
  /** 平均温度 */
  readonly averageHeat: number
  /** ダメージ閾値を超えているセル数 */
  readonly hotCellCount: number
}

export class HeatSystem {
  private readonly _width: number
  private readonly _height: number
  private readonly _parameters: HeatSystemParameters
  private _currentHeat: number[][]
  private _nextHeat: number[][]

  public constructor(
    width: number,
    height: number,
    parameters: HeatSystemParameters = DEFAULT_HEAT_PARAMETERS
  ) {
    this._width = width
    this._height = height
    this._parameters = parameters

    // 熱グリッドの初期化
    this._currentHeat = new Array<number[]>(height)
    this._nextHeat = new Array<number[]>(height)
    for (let i = 0; i < height; i++) {
      this._currentHeat[i] = new Array<number>(width).fill(0)
      this._nextHeat[i] = new Array<number>(width).fill(0)
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get heatGrid(): readonly (readonly number[])[] {
    return this._currentHeat
  }

  /**
   * 特定セルの熱量を取得
   * @param x X座標
   * @param y Y座標
   * @returns 熱量
   */
  public getHeat(x: number, y: number): number {
    // トーラス境界でラップ
    const wrappedX = ((x % this._width) + this._width) % this._width
    const wrappedY = ((y % this._height) + this._height) % this._height
    return this._currentHeat[wrappedY]?.[wrappedX] ?? 0
  }

  /**
   * 特定セルに熱を追加
   * @param x X座標
   * @param y Y座標
   * @param amount 追加する熱量
   */
  public addHeat(x: number, y: number, amount: number): void {
    if (amount <= 0) {
      return
    }

    const wrappedX = ((x % this._width) + this._width) % this._width
    const wrappedY = ((y % this._height) + this._height) % this._height
    const row = this._currentHeat[wrappedY]
    if (row !== undefined) {
      row[wrappedX] = (row[wrappedX] ?? 0) + Math.floor(amount)
    }
  }

  /**
   * 座標から熱を追加（Vec2版）
   * @param position 位置
   * @param amount 追加する熱量
   */
  public addHeatAt(position: Vec2, amount: number): void {
    // 連続座標からグリッド座標に変換（仮定：1グリッド = 10ユニット）
    const gridX = Math.floor(position.x / 10)
    const gridY = Math.floor(position.y / 10)
    this.addHeat(gridX, gridY, amount)
  }

  /**
   * 熱拡散を1ステップ実行
   */
  public updateDiffusion(): void {
    // まず全セルを現在の値で初期化
    for (let y = 0; y < this._height; y++) {
      const row = this._currentHeat[y]
      if (row !== undefined) {
        this._nextHeat[y] = [...row]
      }
    }

    // 各セルペア間の熱流を計算（重複を避けるため、各ペアを1回だけ処理）
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        // 東と南の隣接セルとのみ熱交換を計算（西と北は既に計算済み）
        this.calculateHeatExchange(x, y, (x + 1) % this._width, y) // 東
        this.calculateHeatExchange(x, y, x, (y + 1) % this._height) // 南
      }
    }

    // バッファをスワップ
    const temp = this._currentHeat
    this._currentHeat = this._nextHeat
    this._nextHeat = temp
  }

  /**
   * 放熱処理を実行
   */
  public updateRadiation(): void {
    const { radiationEnvRatio, heatDiffusionBase, heatFlowRate, heatFlowLimitRatio } =
      this._parameters

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const row = this._currentHeat[y]
        if (row === undefined) {
          continue
        }
        const currentHeat = row[x] ?? 0
        if (currentHeat === 0) {
          continue
        }

        // 仮想的な環境温度
        const environmentHeat = Math.floor(currentHeat * radiationEnvRatio)

        // 環境との熱量差による放熱
        const baseHeat = Math.floor(currentHeat / heatDiffusionBase)
        const envBaseHeat = Math.floor(environmentHeat / heatDiffusionBase)
        const heatDifference = baseHeat - envBaseHeat

        if (heatDifference <= 0) {
          continue
        }

        // 放熱量
        let radiationAmount = Math.floor(heatDifference / heatFlowRate)

        // 放熱量の制限
        const maxRadiation = Math.floor(heatDifference / heatFlowLimitRatio) - 1
        if (maxRadiation > 0 && radiationAmount > maxRadiation) {
          radiationAmount = maxRadiation
        }

        // 負の熱量にならないように制限
        if (radiationAmount > currentHeat) {
          radiationAmount = currentHeat
        }

        const currentRow = this._currentHeat[y]
        if (currentRow?.[x] !== undefined) {
          currentRow[x] = currentHeat - radiationAmount
        }
      }
    }
  }

  /**
   * 熱ダメージを計算
   * @param x X座標
   * @param y Y座標
   * @param isDamaged ユニットが損傷しているか
   * @param isProducing ユニットが生産中か
   * @returns ダメージ量
   */
  public calculateHeatDamage(x: number, y: number, isDamaged = false, isProducing = false): number {
    const heat = this.getHeat(x, y)

    if (heat <= this._parameters.heatDamageThreshold) {
      return 0
    }

    let damage = Math.ceil(heat - this._parameters.heatDamageThreshold)

    if (isDamaged) {
      damage *= this._parameters.damageMultiplierDamaged
    } else if (isProducing) {
      damage *= this._parameters.damageMultiplierProducing
    }

    return damage
  }

  /**
   * 熱グリッドの統計情報を取得
   */
  public getStats(): HeatGridStats {
    let totalHeat = 0
    let maxHeat = 0
    let minHeat = Number.MAX_SAFE_INTEGER
    let hotCellCount = 0

    for (let y = 0; y < this._height; y++) {
      const row = this._currentHeat[y]
      if (row === undefined) {
        continue
      }

      for (let x = 0; x < this._width; x++) {
        const heat = row[x] ?? 0
        totalHeat += heat
        maxHeat = Math.max(maxHeat, heat)
        minHeat = Math.min(minHeat, heat)

        if (heat > this._parameters.heatDamageThreshold) {
          hotCellCount++
        }
      }
    }

    const cellCount = this._width * this._height
    const averageHeat = cellCount > 0 ? totalHeat / cellCount : 0

    return {
      totalHeat,
      maxHeat,
      minHeat,
      averageHeat,
      hotCellCount,
    }
  }

  /**
   * 熱グリッドをリセット
   */
  public reset(): void {
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const currentRow = this._currentHeat[y]
        const nextRow = this._nextHeat[y]
        if (currentRow !== undefined) {
          currentRow[x] = 0
        }
        if (nextRow !== undefined) {
          nextRow[x] = 0
        }
      }
    }
  }

  /**
   * 2つのセル間の熱交換を計算
   */
  private calculateHeatExchange(x1: number, y1: number, x2: number, y2: number): void {
    const heat1 = this._currentHeat[y1]?.[x1] ?? 0
    const heat2 = this._currentHeat[y2]?.[x2] ?? 0

    // 基準熱量
    const baseHeat1 = Math.floor(heat1 / this._parameters.heatDiffusionBase)
    const baseHeat2 = Math.floor(heat2 / this._parameters.heatDiffusionBase)

    // 熱量差（セル2からセル1への方向を正とする）
    const diff = baseHeat2 - baseHeat1

    // 熱流量
    let flow = Math.floor(diff / this._parameters.heatFlowRate)

    // 流量制限
    const maxFlow = Math.floor(Math.abs(diff) / this._parameters.heatFlowLimitRatio) - 1
    if (maxFlow > 0 && Math.abs(flow) > maxFlow) {
      flow = Math.sign(flow) * maxFlow
    }

    // 流出元のセルが十分な熱を持っているか確認
    if (flow > 0 && flow > heat2) {
      flow = heat2 // セル2から流出できる最大量に制限
    } else if (flow < 0 && Math.abs(flow) > heat1) {
      flow = -heat1 // セル1から流出できる最大量に制限
    }

    // 熱を移動（対称的に適用）
    const row1 = this._nextHeat[y1]
    const row2 = this._nextHeat[y2]
    if (row1?.[x1] !== undefined) {
      row1[x1] += flow
    }
    if (row2?.[x2] !== undefined) {
      row2[x2] -= flow
    }
  }

  /**
   * デバッグ用：熱マップを文字列で表現
   */
  public toDebugString(): string {
    const chars = [" ", ".", ":", "-", "=", "+", "*", "#", "@", "█"]
    const maxChar = chars.length - 1

    let result = ""
    for (let y = 0; y < this._height; y++) {
      const row = this._currentHeat[y]
      if (row === undefined) {
        continue
      }

      for (let x = 0; x < this._width; x++) {
        const heat = row[x] ?? 0
        const index = Math.min(Math.floor(heat / 50), maxChar)
        result += chars[index] ?? " "
      }
      result += "\n"
    }

    return result
  }
}
