/**
 * ゲーム世界の統合管理
 */

import { WorldStateManager } from "./world-state"
import { ObjectFactory } from "./object-factory"
import { HullEnergyManager } from "./hull-energy-manager"
import { EnergySourceManager } from "./energy-source-manager"
import { EnergyCollector } from "./energy-collector"
import { EnergyDecaySystem } from "./energy-decay-system"
import { ComputerVMSystem } from "./computer-vm-system"
import { ComputerVMSystemDebug } from "./computer-vm-system-debug"
import { ComputerDebugger } from "./computer-debugger"
import { AgentFactory } from "./agent-factory"
import type {
  GameObject,
  EnergySource,
  DirectionalForceField,
  WorldParameters,
  Hull,
  EnergyObject,
  Computer,
  Unit,
  Assembler,
  Vec2,
} from "@/types/game"
import type { HeatSystem } from "./heat-system"
import { isHull, isEnergyObject } from "@/utils/type-guards"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

import type { AgentPresetPlacement } from "./presets/types"

export type WorldConfig = {
  width: number
  height: number
  parameters?: Partial<WorldParameters>
  defaultAgentPresets?: readonly AgentPresetPlacement[]
  debugMode?: boolean
}

export class World {
  private readonly _stateManager: WorldStateManager
  private readonly _objectFactory: ObjectFactory
  private readonly _hullEnergyManager: HullEnergyManager
  private readonly _energySourceManager: EnergySourceManager
  private readonly _energyCollector: EnergyCollector
  private readonly _energyDecaySystem: EnergyDecaySystem
  private readonly _computerVMSystem: ComputerVMSystemDebug | null
  private readonly _debugger: ComputerDebugger | null

  /** ワールド状態を取得 */
  public get state() {
    return this._stateManager.state
  }
  
  /** 熱システムを取得 */
  public get heatSystem(): HeatSystem {
    return this._stateManager.heatSystem
  }
  
  /** デバッガーを取得（デバッグモード時のみ） */
  public get debugger(): ComputerDebugger | null {
    return this._debugger
  }

  public constructor(config: WorldConfig) {
    // 状態管理の初期化
    this._stateManager = new WorldStateManager(config.width, config.height, config.parameters)

    // オブジェクトファクトリの初期化
    this._objectFactory = new ObjectFactory(config.width, config.height)

    // HULLエネルギー管理の初期化
    this._hullEnergyManager = new HullEnergyManager()

    // エネルギーソース管理の初期化
    this._energySourceManager = new EnergySourceManager(config.width, config.height)

    // エネルギー収集システムの初期化
    this._energyCollector = new EnergyCollector(config.width, config.height)

    // エネルギー崩壊システムの初期化
    this._energyDecaySystem = new EnergyDecaySystem()

    // ComputerVMシステムの初期化（デバッグモードに応じて切り替え）
    if (config.debugMode === true) {
      const computerDebugger = new ComputerDebugger()
      this._computerVMSystem = new ComputerVMSystemDebug(computerDebugger)
      this._debugger = computerDebugger
      console.log("[World] デバッグモードで起動")
    } else {
      this._computerVMSystem = null
      this._debugger = null
    }

    this.initialize(config)
  }

  /** 世界の初期化 */
  private initialize(config: WorldConfig): void {
    // エネルギーソースの配置
    this.placeEnergySources()

    // デフォルトエージェントの配置
    if (config.defaultAgentPresets != null && config.defaultAgentPresets.length > 0) {
      this.placeDefaultAgents(config.defaultAgentPresets)
    }

    console.log(`World initialized: ${config.width}x${config.height}`)
    console.log(`Energy sources: ${this._stateManager.state.energySources.size}`)
    console.log(`Initial objects: ${this._stateManager.state.objects.size}`)
  }

  /** デフォルトエージェントを配置 */
  private placeDefaultAgents(presets: readonly AgentPresetPlacement[]): void {
    for (const placement of presets) {
      const objects = AgentFactory.createFromPreset(
        placement.preset,
        placement.position,
        this._stateManager.state.width,
        this._stateManager.state.height,
        () => this._stateManager.generateObjectId()
      )

      // エージェントを追加
      this.addAgent(objects, placement.position)
    }
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
  
  /** 指定位置にエネルギーオブジェクトを作成 */
  public createEnergyObject(position: Vec2, amount: number): void {
    const id = this._stateManager.generateObjectId()
    const energyObj = this._objectFactory.createEnergyObject(id, position, amount)
    this._stateManager.addObject(energyObj)
  }

  /**
   * エージェント（Hull及び関連ユニット）を追加
   * @param objects エージェントを構成するオブジェクト群
   * @param position 配置位置（既にオブジェクトに設定済みの場合は無視）
   */
  public addAgent(objects: GameObject[], position?: Vec2): void {
    // 全てのオブジェクトを追加
    for (const obj of objects) {
      // positionが指定されていて、オブジェクトの位置が原点の場合は位置を更新
      if (position != null && obj.position.x === 0 && obj.position.y === 0) {
        obj.position = Vec2Utils.create(position.x, position.y)
      }
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

      // エネルギーシステムの更新
      this.updateEnergySystem()

      // ユニットシステムの更新
      this.updateUnitSystem()
      
      // 熱システムの更新
      this.updateHeatSystem()

      // VMサイクルカウンタのリセット（次のtick準備）
      this.resetVMCycleCounters()
    }
  }

  /** エネルギーシステムの更新 */
  private updateEnergySystem(): void {
    // エネルギーソースからの生成
    this.generateEnergyFromSources()

    // エネルギーの自然崩壊
    this.processEnergyDecay()

    // HULLによるエネルギー収集
    this.collectEnergyForHulls()
  }

  /** エネルギーソースからエネルギーを生成 */
  private generateEnergyFromSources(): void {
    for (const source of this._stateManager.state.energySources.values()) {
      const result = this._energySourceManager.generateEnergy(source, () =>
        this._stateManager.generateObjectId()
      )

      // 生成されたエネルギーオブジェクトを追加
      for (const energyObj of result.generatedObjects) {
        this._stateManager.addObject(energyObj)
      }
    }
  }

  /** HULLのエネルギー収集処理 */
  private collectEnergyForHulls(): void {
    const hulls: Hull[] = []
    const energyObjectsMap = new Map<EnergyObject["id"], EnergyObject>()

    // HULLとエネルギーオブジェクトを分類
    for (const obj of this._stateManager.state.objects.values()) {
      if (isHull(obj)) {
        hulls.push(obj)
      } else if (isEnergyObject(obj)) {
        energyObjectsMap.set(obj.id, obj)
      }
    }

    // 各HULLのエネルギー収集
    for (const hull of hulls) {
      const result = this._energyCollector.collectEnergy(hull, energyObjectsMap)

      if (result.collectedIds.length > 0) {
        // HULLにエネルギーを追加
        const energyResult = this._hullEnergyManager.addEnergy(hull, result.totalEnergy)

        // HULLを更新
        this._stateManager.updateObject(energyResult.updatedHull)

        // 収集されたエネルギーオブジェクトを削除
        for (const id of result.collectedIds) {
          this._stateManager.removeObject(id)
          // Mapからも削除
          energyObjectsMap.delete(id)
        }
      }
    }
  }

  /** エネルギーの自然崩壊処理 */
  private processEnergyDecay(): void {
    const energyObjectsMap = new Map<EnergyObject["id"], EnergyObject>()

    // エネルギーオブジェクトを抽出
    for (const obj of this._stateManager.state.objects.values()) {
      if (obj.type === "ENERGY") {
        const energyObj = obj as EnergyObject
        energyObjectsMap.set(energyObj.id, energyObj)
      }
    }

    // 崩壊処理
    const decayResult = this._energyDecaySystem.processDecay(energyObjectsMap)

    // 完全に崩壊したオブジェクトを削除（熱を発生）
    for (const id of decayResult.removedIds) {
      const obj = this._stateManager.getObject(id)
      if (obj != null) {
        const energyObj = obj as EnergyObject
        // 削除前に熱を発生させる（オブジェクトが持っていた全エネルギー）
        this._stateManager.addHeatToCell(obj.position, energyObj.energy)
        this._stateManager.removeObject(id)
      }
    }

    // 部分的に崩壊したオブジェクトを更新（熱を発生）
    for (const [id, updatedObj] of decayResult.updatedObjects.entries()) {
      const originalObj = this._stateManager.getObject(id)
      if (originalObj != null) {
        // 崩壊した分の熱を発生
        const decayAmount = (originalObj as EnergyObject).energy - updatedObj.energy
        this._stateManager.addHeatToCell(originalObj.position, decayAmount)
        // オブジェクトを更新
        this._stateManager.updateObject(updatedObj)
      }
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

  /** ユニットシステムの更新 */
  private updateUnitSystem(): void {
    // TODO: ASSEMBLERユニットの構築処理

    // COMPUTERユニットのVM実行
    this.executeComputerVMs()
  }

  /** COMPUTERユニットのVM実行 */
  private executeComputerVMs(): void {
    const objects = this._stateManager.getAllObjects()
    const tick = this._stateManager.state.tick

    // デバッグモードの場合、HULLマップを更新
    if (this._computerVMSystem != null) {
      const hulls: Hull[] = []
      for (const obj of objects) {
        if (isHull(obj)) {
          hulls.push(obj)
        }
      }
      this._computerVMSystem.updateHullMap(hulls)
    }

    for (const obj of objects) {
      if (obj.type === "COMPUTER") {
        if (this._computerVMSystem != null) {
          // デバッグモード: インスタンスメソッドを使用
          this._computerVMSystem.executeVMWithDebug(obj as Computer, tick)
        } else {
          // 通常モード: staticメソッドを使用
          ComputerVMSystem.executeVM(obj as Computer)
        }
      }
    }
  }

  /** VMサイクルカウンタのリセット */
  private resetVMCycleCounters(): void {
    const objects = this._stateManager.getAllObjects()

    for (const obj of objects) {
      if (obj.type === "COMPUTER") {
        ComputerVMSystem.resetCycleCounter(obj as Computer)
      }
    }
  }
  
  /** 熱システムの更新 */
  private updateHeatSystem(): void {
    // 熱拡散の計算（セルオートマトン）
    this._stateManager.heatSystem.updateDiffusion()
    
    // 放熱処理
    this._stateManager.heatSystem.updateRadiation()
    
    // 熱によるダメージ処理
    this.applyHeatDamage()
  }
  
  /** 熱によるダメージをユニットに適用 */
  private applyHeatDamage(): void {
    const objects = this._stateManager.getAllObjects()
    
    for (const obj of objects) {
      // ユニットのみ熱ダメージを受ける
      if (obj.type === "HULL" || obj.type === "ASSEMBLER" || obj.type === "COMPUTER") {
        const unit = obj as Unit
        
        // ユニットの位置から熱グリッド座標を計算
        const gridX = Math.floor(unit.position.x / 10)
        const gridY = Math.floor(unit.position.y / 10)
        
        // ダメージフラグを判定
        const isDamaged = unit.currentEnergy < unit.buildEnergy
        const isProducing = obj.type === "ASSEMBLER" && (obj as Assembler).isAssembling
        
        // 熱ダメージを計算
        const damage = this._stateManager.heatSystem.calculateHeatDamage(
          gridX,
          gridY,
          isDamaged,
          isProducing
        )
        
        if (damage > 0) {
          // ダメージを適用（currentEnergyを減少）
          unit.currentEnergy = Math.max(0, unit.currentEnergy - damage)
          
          // energyも同期（質量保存の法則）
          unit.energy = Math.min(unit.energy, unit.currentEnergy)
          
          // オブジェクトを更新
          this._stateManager.updateObject(unit)
          
          // ユニットが破壊された場合
          if (unit.currentEnergy === 0) {
            this._stateManager.removeObject(unit.id)
            
            // 破壊による熱の追加（エネルギーの10%が熱に変換）
            const heatGenerated = Math.floor(unit.buildEnergy * 0.1)
            this._stateManager.addHeatToCell(unit.position, heatGenerated)
          }
        }
      }
    }
  }
}
