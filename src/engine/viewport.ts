/**
 * カスタムViewport実装
 * ゲーム世界の表示領域とカメラ操作を管理
 */

import type { Container } from "pixi.js"
import type { Vec2 } from "@/types/game"

/** Viewportの設定 */
export type ViewportConfig = {
  /** キャンバスの幅 */
  readonly screenWidth: number
  /** キャンバスの高さ */
  readonly screenHeight: number
  /** ワールドの幅 */
  readonly worldWidth: number
  /** ワールドの高さ */
  readonly worldHeight: number
  /** 最小ズームレベル */
  readonly minZoom?: number
  /** 最大ズームレベル */
  readonly maxZoom?: number
  /** 初期ズームレベル */
  readonly initialZoom?: number
  /** 初期カメラ位置 */
  readonly initialPosition?: Vec2
}

/** Viewportの状態 */
export type ViewportState = {
  /** カメラの中心位置（ワールド座標） */
  position: Vec2
  /** ズームレベル（1.0が基準） */
  zoom: number
  /** ドラッグ中フラグ */
  isDragging: boolean
  /** ドラッグ開始位置（スクリーン座標） */
  dragStartScreen?: Vec2
  /** ドラッグ開始時のカメラ位置 */
  dragStartPosition?: Vec2
}

/** Viewport管理クラス */
export class Viewport {
  private readonly _config: Required<ViewportConfig>
  private _state: ViewportState
  private _container: Container | null = null

  /** ビューポート設定の取得 */
  public get config(): Readonly<Required<ViewportConfig>> {
    return this._config
  }

  /** 現在の状態を取得 */
  public get state(): Readonly<ViewportState> {
    return this._state
  }

  /** カメラ位置を取得 */
  public get position(): Readonly<Vec2> {
    return { x: this._state.position.x, y: this._state.position.y }
  }

  /** ズームレベルを取得 */
  public get zoom(): number {
    return this._state.zoom
  }

  public constructor(config: ViewportConfig) {
    this._config = {
      screenWidth: config.screenWidth,
      screenHeight: config.screenHeight,
      worldWidth: config.worldWidth,
      worldHeight: config.worldHeight,
      minZoom: config.minZoom ?? 0.1,
      maxZoom: config.maxZoom ?? 5.0,
      initialZoom: config.initialZoom ?? 1.0,
      initialPosition: config.initialPosition ?? {
        x: config.worldWidth / 2,
        y: config.worldHeight / 2,
      },
    }

    this._state = {
      position: { x: this._config.initialPosition.x, y: this._config.initialPosition.y },
      zoom: this._config.initialZoom,
      isDragging: false,
    }
  }

  /**
   * コンテナを設定
   * @param container PixiJSコンテナ
   */
  public setContainer(container: Container): void {
    this._container = container
    this.updateTransform()
  }

  /**
   * カメラ位置を設定
   * @param position 新しい位置（ワールド座標）
   */
  public setPosition(position: Vec2): void {
    const clamped = this.clampPosition(position)
    this._state.position = { x: clamped.x, y: clamped.y }
    this.updateTransform()
  }

  /**
   * カメラを移動
   * @param delta 移動量（ワールド座標）
   */
  public move(delta: Vec2): void {
    this.setPosition({
      x: this._state.position.x + delta.x,
      y: this._state.position.y + delta.y,
    })
  }

  /**
   * ズームレベルを設定
   * @param zoom 新しいズームレベル
   * @param center ズームの中心点（スクリーン座標、省略時は画面中央）
   */
  public setZoom(zoom: number, center?: Vec2): void {
    const oldZoom = this._state.zoom
    this._state.zoom = Math.max(this._config.minZoom, Math.min(this._config.maxZoom, zoom))

    // ズームの中心点を基準に位置を調整
    if (center != null && oldZoom !== this._state.zoom) {
      const screenCenter: Vec2 = center

      // スクリーン座標をワールド座標に変換
      const worldBefore = this.screenToWorld(screenCenter, oldZoom)
      const worldAfter = this.screenToWorld(screenCenter, this._state.zoom)

      // 差分だけカメラを移動
      this.move({
        x: worldBefore.x - worldAfter.x,
        y: worldBefore.y - worldAfter.y,
      })
    } else {
      this.updateTransform()
    }
  }

  /**
   * ズームイン
   * @param factor ズーム倍率（デフォルト: 1.25）
   * @param center ズームの中心点（スクリーン座標）
   */
  public zoomIn(factor = 1.25, center?: Vec2): void {
    this.setZoom(this._state.zoom * factor, center)
  }

  /**
   * ズームアウト
   * @param factor ズーム倍率（デフォルト: 1.25）
   * @param center ズームの中心点（スクリーン座標）
   */
  public zoomOut(factor = 1.25, center?: Vec2): void {
    this.setZoom(this._state.zoom / factor, center)
  }

  /**
   * 全体を表示
   */
  public fitToWorld(): void {
    const scaleX = this._config.screenWidth / this._config.worldWidth
    const scaleY = this._config.screenHeight / this._config.worldHeight
    const zoom = Math.min(scaleX, scaleY) * 0.95 // 少し余白を持たせる

    this.setZoom(zoom)
    this.setPosition({
      x: this._config.worldWidth / 2,
      y: this._config.worldHeight / 2,
    })
  }

  /**
   * ドラッグ開始
   * @param screenPos マウス/タッチ位置（スクリーン座標）
   */
  public startDrag(screenPos: Vec2): void {
    this._state.isDragging = true
    this._state.dragStartScreen = { x: screenPos.x, y: screenPos.y }
    this._state.dragStartPosition = { x: this._state.position.x, y: this._state.position.y }
  }

  /**
   * ドラッグ中
   * @param screenPos マウス/タッチ位置（スクリーン座標）
   */
  public drag(screenPos: Vec2): void {
    if (
      !this._state.isDragging ||
      this._state.dragStartScreen == null ||
      this._state.dragStartPosition == null
    ) {
      return
    }

    // スクリーン座標での移動量
    const screenDelta = {
      x: screenPos.x - this._state.dragStartScreen.x,
      y: screenPos.y - this._state.dragStartScreen.y,
    }

    // ワールド座標での移動量に変換（ズームを考慮）
    const worldDelta = {
      x: -screenDelta.x / this._state.zoom,
      y: -screenDelta.y / this._state.zoom,
    }

    // 新しい位置を設定
    this.setPosition({
      x: this._state.dragStartPosition.x + worldDelta.x,
      y: this._state.dragStartPosition.y + worldDelta.y,
    })
  }

  /**
   * ドラッグ終了
   */
  public endDrag(): void {
    this._state.isDragging = false
    delete this._state.dragStartScreen
    delete this._state.dragStartPosition
  }

  /**
   * スクリーン座標をワールド座標に変換
   * @param screenPos スクリーン座標
   * @param zoom ズームレベル（省略時は現在の値）
   * @returns ワールド座標
   */
  public screenToWorld(screenPos: Vec2, zoom?: number): Vec2 {
    const currentZoom = zoom ?? this._state.zoom
    return {
      x: this._state.position.x + (screenPos.x - this._config.screenWidth / 2) / currentZoom,
      y: this._state.position.y + (screenPos.y - this._config.screenHeight / 2) / currentZoom,
    }
  }

  /**
   * ワールド座標をスクリーン座標に変換
   * @param worldPos ワールド座標
   * @returns スクリーン座標
   */
  public worldToScreen(worldPos: Vec2): Vec2 {
    return {
      x: (worldPos.x - this._state.position.x) * this._state.zoom + this._config.screenWidth / 2,
      y: (worldPos.y - this._state.position.y) * this._state.zoom + this._config.screenHeight / 2,
    }
  }

  /**
   * 可視領域を取得（ワールド座標）
   * @returns 可視領域の矩形
   */
  public getVisibleBounds(): { left: number; top: number; right: number; bottom: number } {
    const halfWidth = this._config.screenWidth / 2 / this._state.zoom
    const halfHeight = this._config.screenHeight / 2 / this._state.zoom

    const pos = this._state.position
    return {
      left: pos.x - halfWidth,
      top: pos.y - halfHeight,
      right: pos.x + halfWidth,
      bottom: pos.y + halfHeight,
    }
  }

  /**
   * オブジェクトが可視範囲内かチェック
   * @param position オブジェクトの位置（ワールド座標）
   * @param radius オブジェクトの半径
   * @returns 可視範囲内ならtrue
   */
  public isVisible(position: Vec2, radius = 0): boolean {
    const bounds = this.getVisibleBounds()
    return (
      position.x + radius >= bounds.left &&
      position.x - radius <= bounds.right &&
      position.y + radius >= bounds.top &&
      position.y - radius <= bounds.bottom
    )
  }

  /**
   * カメラ位置を制限
   * @param position 位置
   * @returns 制限された位置
   */
  private clampPosition(position: Vec2): Vec2 {
    const halfWidth = this._config.screenWidth / 2 / this._state.zoom
    const halfHeight = this._config.screenHeight / 2 / this._state.zoom

    return {
      x: Math.max(halfWidth, Math.min(this._config.worldWidth - halfWidth, position.x)),
      y: Math.max(halfHeight, Math.min(this._config.worldHeight - halfHeight, position.y)),
    }
  }

  /**
   * コンテナの変換を更新
   */
  private updateTransform(): void {
    if (this._container == null) {
      return
    }

    // スケールを設定
    this._container.scale.set(this._state.zoom)

    // 位置を設定（画面中央がカメラ位置になるように）
    this._container.position.set(
      this._config.screenWidth / 2 - this._state.position.x * this._state.zoom,
      this._config.screenHeight / 2 - this._state.position.y * this._state.zoom
    )
  }
}
