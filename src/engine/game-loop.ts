/**
 * ゲームループ制御
 */

import { WorldStateManager } from "./world-state"
import type { WorldParameters } from "@/types/game"

export type GameLoopCallback = (deltaTime: number) => void

export class GameLoop {
  private _running = false
  private _paused = false
  private _lastTime = 0
  private _accumulator = 0
  private _tickDuration: number
  private _onTick: GameLoopCallback
  private _onRender: GameLoopCallback
  private _animationFrameId?: number
  
  constructor(
    targetFPS: number,
    onTick: GameLoopCallback,
    onRender: GameLoopCallback
  ) {
    this._tickDuration = 1000 / targetFPS
    this._onTick = onTick
    this._onRender = onRender
  }
  
  /** ゲームループを開始 */
  start(): void {
    if (this._running) return
    
    this._running = true
    this._lastTime = performance.now()
    this._accumulator = 0
    this.loop(this._lastTime)
  }
  
  /** ゲームループを停止 */
  stop(): void {
    this._running = false
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId)
      this._animationFrameId = undefined
    }
  }
  
  /** 一時停止 */
  pause(): void {
    this._paused = true
  }
  
  /** 再開 */
  resume(): void {
    if (this._paused) {
      this._paused = false
      this._lastTime = performance.now()
      this._accumulator = 0
    }
  }
  
  /** 一時停止状態 */
  get isPaused(): boolean {
    return this._paused
  }
  
  /** 実行中状態 */
  get isRunning(): boolean {
    return this._running
  }
  
  /** FPS設定を更新 */
  setTargetFPS(fps: number): void {
    this._tickDuration = 1000 / fps
  }
  
  /** メインループ */
  private loop = (currentTime: number): void => {
    if (!this._running) return
    
    this._animationFrameId = requestAnimationFrame(this.loop)
    
    if (this._paused) {
      this._lastTime = currentTime
      return
    }
    
    const deltaTime = Math.min(currentTime - this._lastTime, 100) // 最大100ms
    this._lastTime = currentTime
    
    this._accumulator += deltaTime
    
    // 固定タイムステップで物理更新
    while (this._accumulator >= this._tickDuration) {
      this._onTick(this._tickDuration / 1000)
      this._accumulator -= this._tickDuration
    }
    
    // 描画更新（補間あり）
    const interpolation = this._accumulator / this._tickDuration
    this._onRender(interpolation)
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
  
  constructor(worldState: WorldStateManager) {
    this._worldState = worldState
    this._ticksPerFrame = worldState.state.parameters.ticksPerFrame
    
    this._gameLoop = new GameLoop(
      worldState.state.parameters.targetFPS,
      this.onTick,
      this.onRender
    )
  }
  
  /** ゲーム開始 */
  start(): void {
    this._gameLoop.start()
  }
  
  /** ゲーム停止 */
  stop(): void {
    this._gameLoop.stop()
  }
  
  /** 一時停止 */
  pause(): void {
    this._gameLoop.pause()
  }
  
  /** 再開 */
  resume(): void {
    this._gameLoop.resume()
  }
  
  /** 一時停止状態 */
  get isPaused(): boolean {
    return this._gameLoop.isPaused
  }
  
  /** 実行中状態 */
  get isRunning(): boolean {
    return this._gameLoop.isRunning
  }
  
  /** 現在のFPS */
  get currentFPS(): number {
    return this._currentFPS
  }
  
  /** パラメータ更新 */
  updateParameters(params: Partial<WorldParameters>): void {
    this._worldState.updateParameters(params)
    
    if (params.targetFPS !== undefined) {
      this._gameLoop.setTargetFPS(params.targetFPS)
    }
    
    if (params.ticksPerFrame !== undefined) {
      this._ticksPerFrame = params.ticksPerFrame
    }
  }
  
  /** tick処理 */
  private onTick = (deltaTime: number): void => {
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
  private onRender = (interpolation: number): void => {
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