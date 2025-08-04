/**
 * ゲーム世界の統合管理
 */

import { WorldStateManager } from "./world-state"
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
  private readonly _objectFactory: ObjectFactory

  /** ワールド状態を取得 */
  public get state() {
    return this._stateManager.state
  }

  public constructor(config: WorldConfig) {
    // 状態管理の初期化
    this._stateManager = new WorldStateManager(config.width, config.height, config.parameters)

    // オブジェクトファクトリの初期化
    this._objectFactory = new ObjectFactory(config.width, config.height)

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
      const position = Vec2Utils.create(Math.random() * width, Math.random() * height)

      const energyPerTick =
        params.energySourceMinRate +
        Math.random() * (params.energySourceMaxRate - params.energySourceMinRate)

      const source: EnergySource = {
        id: this._stateManager.generateObjectId(),
        position,
        energyPerTick: Math.floor(energyPerTick),
      }

      this._stateManager.addEnergySource(source)
    }
  }

  public updateParameters(params: Partial<WorldParameters>): void {
    this._stateManager.updateParameters(params)
  }

  public addObject(obj: GameObject): void {
    this._stateManager.addObject(obj)
  }

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

  public addForceField(field: DirectionalForceField): void {
    this._stateManager.addForceField(field)
  }

  public removeForceField(id: DirectionalForceField["id"]): void {
    this._stateManager.removeForceField(id)
  }

  /** 1tick進める（手動実行用） */
  public tick(): void {
    // ticksPerFrame回数分のtickを実行
    const ticksPerFrame = this._stateManager.state.parameters.ticksPerFrame
    for (let i = 0; i < ticksPerFrame; i++) {
      this._stateManager.incrementTick()

      // 物理演算の実行（1tick = 1時間単位）
      this._stateManager.updatePhysics(1.0)

      // TODO: エネルギーシステムの更新
      // TODO: ユニットの動作処理
      // TODO: Synthetica Script VMの実行
    }
  }

  /** デバッグ用：ランダムな位置にエネルギーオブジェクトを生成 */
  public spawnRandomEnergy(amount: number): void {
    const id = this._stateManager.generateObjectId()
    const position = Vec2Utils.create(
      Math.random() * this.state.width,
      Math.random() * this.state.height
    )

    const energyObj = this._objectFactory.createEnergyObject(id, position, amount)

    this._stateManager.addObject(energyObj)
  }
}
