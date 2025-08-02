/**
 * ゲーム世界の統合管理
 */

import { WorldStateManager } from "./world-state"
import { GameLoopController } from "./game-loop"
import { ObjectFactory } from "./object-factory"
import type {
  GameObject,
  EnergySource,
  DirectionalForceField,
  WorldParameters,
  AgentDefinition,
  Vec2,
} from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

export type WorldConfig = {
  width: number
  height: number
  parameters?: Partial<WorldParameters>
  initialAgents?: AgentDefinition[]
}

export class World {
  private readonly _stateManager: WorldStateManager
  private readonly _loopController: GameLoopController
  private readonly _objectFactory: ObjectFactory
  
  /** 一時停止状態 */
  public get isPaused(): boolean {
    return this._loopController.isPaused
  }
  
  /** 実行中状態 */
  public get isRunning(): boolean {
    return this._loopController.isRunning
  }
  
  /** 現在のFPS */
  public get currentFPS(): number {
    return this._loopController.currentFPS
  }
  
  /** ワールド状態を取得 */
  public get state() {
    return this._stateManager.state
  }
  
  public constructor(config: WorldConfig) {
    // 状態管理の初期化
    this._stateManager = new WorldStateManager(
      config.width,
      config.height,
      config.parameters
    )
    
    // ゲームループの初期化
    this._loopController = new GameLoopController(this._stateManager)
    
    // オブジェクトファクトリの初期化
    this._objectFactory = new ObjectFactory(config.width, config.height)
    
    // 初期化処理
    this.initialize(config)
  }
  
  /** 世界の初期化 */
  private initialize(config: WorldConfig): void {
    // エネルギーソースの配置
    this.placeEnergySources()
    
    // 初期エージェントの配置
    if (config.initialAgents != null) {
      for (const agentDef of config.initialAgents) {
        this.addAgent(agentDef)
      }
    }
    
    console.log(`World initialized: ${config.width}x${config.height}`)
    console.log(`Energy sources: ${this._stateManager.state.energySources.size}`)
    console.log(`Initial objects: ${this._stateManager.state.objects.size}`)
  }
  
  /** エネルギーソースを配置 */
  private placeEnergySources(): void {
    const params = this._stateManager.state.parameters
    const width = this._stateManager.state.width
    const height = this._stateManager.state.height
    
    for (let i = 0; i < params.energySourceCount; i++) {
      const position = Vec2Utils.create(
        Math.random() * width,
        Math.random() * height
      )
      
      const energyPerTick = params.energySourceMinRate + 
        Math.random() * (params.energySourceMaxRate - params.energySourceMinRate)
      
      const source: EnergySource = {
        id: this._stateManager.generateObjectId(),
        position,
        energyPerTick: Math.floor(energyPerTick),
      }
      
      this._stateManager.addEnergySource(source)
    }
  }
  
  /** ゲーム開始 */
  public start(): void {
    this._loopController.start()
  }
  
  /** ゲーム停止 */
  public stop(): void {
    this._loopController.stop()
  }
  
  /** 一時停止 */
  public pause(): void {
    this._loopController.pause()
  }
  
  /** 再開 */
  public resume(): void {
    this._loopController.resume()
  }
  
  /** パラメータを更新 */
  public updateParameters(params: Partial<WorldParameters>): void {
    this._loopController.updateParameters(params)
  }
  
  /** オブジェクトを追加 */
  public addObject(obj: GameObject): void {
    this._stateManager.addObject(obj)
  }
  
  /** オブジェクトを削除 */
  public removeObject(id: GameObject["id"]): void {
    this._stateManager.removeObject(id)
  }
  
  /** エージェントを追加 */
  public addAgent(definition: AgentDefinition, position?: Vec2): void {
    const objects = this._objectFactory.createAgent(
      () => this._stateManager.generateObjectId(),
      definition,
      position
    )
    
    for (const obj of objects) {
      this._stateManager.addObject(obj)
    }
  }
  
  /** 力場を追加 */
  public addForceField(field: DirectionalForceField): void {
    this._stateManager.addForceField(field)
  }
  
  /** 力場を削除 */
  public removeForceField(id: DirectionalForceField["id"]): void {
    this._stateManager.removeForceField(id)
  }
  
  /** デバッグ用：ランダムな位置にエネルギーオブジェクトを生成 */
  public spawnRandomEnergy(amount: number): void {
    const id = this._stateManager.generateObjectId()
    const position = Vec2Utils.create(
      Math.random() * this.state.width,
      Math.random() * this.state.height
    )
    
    const energyObj = this._objectFactory.createEnergyObject(
      id,
      position,
      amount
    )
    
    this._stateManager.addObject(energyObj)
  }
}