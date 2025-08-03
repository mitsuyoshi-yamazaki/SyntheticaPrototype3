/**
 * ゲームループ制御
 */

import { WorldStateManager } from "./world-state"
import type { WorldParameters } from "@/types/game"

export type TickCallback = () => void
export type RenderCallback = (interpolation: number) => void

export class GameLoop {
  private _running = false
  private _paused = false
  private _lastTickTime = 0
  private _minFrameDuration: number // FPS上限による最小フレーム間隔
  private _onTick: TickCallback
  private _onRender: RenderCallback
  private _animationFrameId: number | undefined

  /** 一時停止状態 */
  public get isPaused(): boolean {
    return this._paused
  }

  /** 実行中状態 */
  public get isRunning(): boolean {
    return this._running
  }

  public constructor(maxFPS: number, onTick: TickCallback, onRender: RenderCallback) {
    this._minFrameDuration = 1000 / maxFPS
    this._onTick = onTick
    this._onRender = onRender
  }

  /** ゲームループを開始 */
  public start(): void {
    if (this._running) return

    this._running = true
    this._lastTickTime = performance.now()

    // 初回レンダリング
    this._onRender(0)

    this.loop()
  }
  /** ゲームループを停止 */
  public stop(): void {
    this._running = false
    if (this._animationFrameId !== undefined) {
      cancelAnimationFrame(this._animationFrameId)
      this._animationFrameId = undefined
    }
  }

  /** 一時停止 */
  public pause(): void {
    this._paused = true
  }

  /** 再開 */
  public resume(): void {
    if (this._paused) {
      this._paused = false
      this._lastTickTime = performance.now()
    }
  }

  /** FPS上限を更新 */
  public setMaxFPS(fps: number): void {
    this._minFrameDuration = 1000 / fps
  }

  /** メインループ */
  private loop = (): void => {
    if (!this._running) return

    const currentTime = performance.now()

    if (!this._paused) {
      const timeSinceLastTick = currentTime - this._lastTickTime

      // FPS上限による最小フレーム間隔をチェック
      if (timeSinceLastTick >= this._minFrameDuration) {
        // tick処理を実行
        this._onTick()
        this._lastTickTime = currentTime

        // 描画更新（補間なし、常に0）
        this._onRender(0)
      }
    }

    // 次のフレームをスケジュール
    this._animationFrameId = requestAnimationFrame(this.loop)
  }
}

/** ゲームループ統合管理 */
export class GameLoopController {
  private readonly _worldState: WorldStateManager
  private readonly _gameLoop: GameLoop
  private _ticksPerFrame = 1
  private _currentFPS = 0
  private _frameCount = 0
  private _lastFPSUpdate = 0

  /** 一時停止状態 */
  public get isPaused(): boolean {
    return this._gameLoop.isPaused
  }

  /** 実行中状態 */
  public get isRunning(): boolean {
    return this._gameLoop.isRunning
  }

  /** 現在のFPS */
  public get currentFPS(): number {
    return this._currentFPS
  }

  public constructor(worldState: WorldStateManager) {
    this._worldState = worldState
    this._ticksPerFrame = worldState.state.parameters.ticksPerFrame

    // FPS上限は60に固定（パラメータから読み取ることも可能）
    const maxFPS = worldState.state.parameters.maxFPS ?? 60
    this._gameLoop = new GameLoop(maxFPS, this.onTick, this.onRender)
  }

  /** ゲーム開始 */
  public start(): void {
    this._gameLoop.start()
  }

  /** ゲーム停止 */
  public stop(): void {
    this._gameLoop.stop()
  }

  /** 一時停止 */
  public pause(): void {
    this._gameLoop.pause()
  }

  /** 再開 */
  public resume(): void {
    this._gameLoop.resume()
  }

  /** パラメータ更新 */
  public updateParameters(params: Partial<WorldParameters>): void {
    this._worldState.updateParameters(params)

    if (params.maxFPS !== undefined) {
      this._gameLoop.setMaxFPS(params.maxFPS)
    }

    if (params.ticksPerFrame !== undefined) {
      this._ticksPerFrame = params.ticksPerFrame
    }
  }

  /** tick処理 */
  private onTick = (): void => {
    // 指定回数分tickを実行
    for (let i = 0; i < this._ticksPerFrame; i++) {
      this._worldState.incrementTick()

      // TODO: 物理演算の実行
      // TODO: エネルギーシステムの更新
      // TODO: ユニットの動作処理
      // TODO: Synthetica Script VMの実行
    }
  }

  /** 描画処理 */
  private onRender = (_interpolation: number): void => {
    // FPS計測
    this._frameCount++
    const now = performance.now()
    if (now - this._lastFPSUpdate >= 1000) {
      this._currentFPS = this._frameCount
      this._frameCount = 0
      this._lastFPSUpdate = now
    }

    // TODO: レンダリングシステムへの描画指示
  }
}
