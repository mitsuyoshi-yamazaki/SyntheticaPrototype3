/**
 * エネルギーシステム - エネルギーオブジェクトの生成・結合・管理
 */

import type { ObjectId, Vec2, EnergyObject } from "@/types/game"
import { ObjectFactory } from "./object-factory"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

/** エネルギー結合の結果 */
export type EnergyCombineResult = {
  /** 結合されたエネルギーオブジェクト */
  readonly combined: EnergyObject
  /** 削除されるオブジェクトのID */
  readonly removedIds: ObjectId[]
}

/** エネルギーシステムのパラメータ */
export type EnergySystemParameters = {
  /** エネルギー結合の最大距離 */
  readonly combineDistance: number
  /** 1tickで結合可能な最大オブジェクト数 */
  readonly maxCombinePerTick: number
  /** エネルギーオブジェクトの最小サイズ */
  readonly minEnergyAmount: number
  /** エネルギーオブジェクトの最大サイズ */
  readonly maxEnergyAmount: number
}

/** デフォルトパラメータ */
export const DEFAULT_ENERGY_PARAMETERS: EnergySystemParameters = {
  combineDistance: 5, // エネルギーオブジェクトが接触する距離
  maxCombinePerTick: 10,
  minEnergyAmount: 1,
  maxEnergyAmount: 67108863, // 1024進法での最大値
}

export class EnergySystem {
  private readonly _objectFactory: ObjectFactory
  private readonly _parameters: EnergySystemParameters
  
  public constructor(
    worldWidth: number,
    worldHeight: number,
    parameters: EnergySystemParameters = DEFAULT_ENERGY_PARAMETERS
  ) {
    this._objectFactory = new ObjectFactory(worldWidth, worldHeight)
    this._parameters = parameters
  }
  
  /**
   * エネルギーオブジェクトを生成
   * @param id オブジェクトID
   * @param position 生成位置
   * @param amount エネルギー量
   * @returns 生成されたエネルギーオブジェクト
   */
  public createEnergyObject(id: ObjectId, position: Vec2, amount: number): EnergyObject {
    // エネルギー量を制限内に収める
    const clampedAmount = Math.max(
      this._parameters.minEnergyAmount,
      Math.min(this._parameters.maxEnergyAmount, Math.floor(amount))
    )
    
    return this._objectFactory.createEnergyObject(id, position, clampedAmount)
  }
  
  /**
   * 複数のエネルギーオブジェクトを結合
   * @param objects 結合対象のエネルギーオブジェクト（2つ以上）
   * @param newId 新しいオブジェクトのID
   * @returns 結合結果
   */
  public combineEnergyObjects(
    objects: EnergyObject[],
    newId: ObjectId
  ): EnergyCombineResult {
    if (objects.length < 2) {
      throw new Error("結合には2つ以上のオブジェクトが必要です")
    }
    
    // 全エネルギーの合計を計算
    let totalEnergy = 0
    let totalMass = 0
    let centerX = 0
    let centerY = 0
    
    for (const obj of objects) {
      totalEnergy += obj.energy
      totalMass += obj.mass
      centerX += obj.position.x * obj.mass
      centerY += obj.position.y * obj.mass
    }
    
    // 質量中心を計算
    const centerOfMass = Vec2Utils.create(
      centerX / totalMass,
      centerY / totalMass
    )
    
    // エネルギー量を制限
    const clampedEnergy = Math.min(totalEnergy, this._parameters.maxEnergyAmount)
    
    // 新しいエネルギーオブジェクトを生成
    const combined = this.createEnergyObject(newId, centerOfMass, clampedEnergy)
    
    // 削除されるオブジェクトのIDリスト
    const removedIds = objects.map(obj => obj.id)
    
    return {
      combined,
      removedIds,
    }
  }
  
  /**
   * 近接するエネルギーオブジェクトを検出して結合候補を返す
   * @param energyObjects すべてのエネルギーオブジェクト
   * @returns 結合候補のグループ（各グループは結合可能なオブジェクトの配列）
   */
  public findCombineCandidates(
    energyObjects: Map<ObjectId, EnergyObject>
  ): EnergyObject[][] {
    const candidates: EnergyObject[][] = []
    const processed = new Set<ObjectId>()
    const combineDistanceSq = this._parameters.combineDistance * this._parameters.combineDistance
    
    // 各エネルギーオブジェクトについて近接するものを探す
    for (const [id, obj] of energyObjects) {
      if (processed.has(id)) continue
      
      const group: EnergyObject[] = [obj]
      processed.add(id)
      
      // 他のオブジェクトとの距離をチェック
      for (const [otherId, other] of energyObjects) {
        if (processed.has(otherId)) continue
        
        // グループ内のいずれかのオブジェクトと近接しているかチェック
        let isNearby = false
        for (const groupObj of group) {
          const dx = other.position.x - groupObj.position.x
          const dy = other.position.y - groupObj.position.y
          const distanceSq = dx * dx + dy * dy
          
          if (distanceSq <= combineDistanceSq) {
            isNearby = true
            break
          }
        }
        
        if (isNearby) {
          group.push(other)
          processed.add(otherId)
          
          // 最大結合数に達したら終了
          if (group.length >= this._parameters.maxCombinePerTick) {
            break
          }
        }
      }
      
      // 2つ以上のオブジェクトがある場合のみ候補に追加
      if (group.length >= 2) {
        candidates.push(group)
      }
    }
    
    return candidates
  }
  
  /**
   * エネルギーオブジェクトを分割
   * @param energyObject 分割対象のエネルギーオブジェクト
   * @param amounts 分割後の各エネルギー量（合計が元のエネルギー以下である必要がある）
   * @param idGenerator 新しいIDを生成する関数
   * @returns 分割されたエネルギーオブジェクトの配列
   */
  public splitEnergyObject(
    energyObject: EnergyObject,
    amounts: number[],
    idGenerator: () => ObjectId
  ): EnergyObject[] {
    // 分割後の合計が元のエネルギーを超えないことを確認
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
    if (totalAmount > energyObject.energy) {
      throw new Error("分割後の合計エネルギーが元のエネルギーを超えています")
    }
    
    const result: EnergyObject[] = []
    const basePosition = energyObject.position
    
    // 各分割片を生成（円周上に配置）
    const angleStep = (2 * Math.PI) / amounts.length
    
    for (let i = 0; i < amounts.length; i++) {
      const amount = amounts[i]
      if (amount === undefined || amount <= 0) continue
      
      // 元の位置から少し離れた位置に配置
      const angle = i * angleStep
      const offset = 10 // 分割時の初期距離
      const position = Vec2Utils.create(
        basePosition.x + Math.cos(angle) * offset,
        basePosition.y + Math.sin(angle) * offset
      )
      
      const newObj = this.createEnergyObject(idGenerator(), position, amount)
      result.push(newObj)
    }
    
    return result
  }
  
  /**
   * エネルギー表示用のフォーマット（1024進法）
   * @param energy エネルギー量
   * @returns フォーマットされた文字列
   */
  public static formatEnergy(energy: number): string {
    if (energy < 1024) {
      return `${energy}E`
    }
    
    const kilo = Math.floor(energy / 1024)
    const remainder = energy % 1024
    
    if (remainder === 0) {
      return `[${kilo}]k[0]E`
    } else {
      return `[${kilo}]k[${remainder}]E`
    }
  }
  
  /**
   * エネルギー量から16進表記を生成
   * @param energy エネルギー量
   * @returns 16進表記文字列
   */
  public static toHexNotation(energy: number): string {
    const high = Math.floor(energy / 1024)
    const low = energy % 1024
    
    return `[0x${high.toString(16).toUpperCase().padStart(4, '0')}][0x${low.toString(16).toUpperCase().padStart(4, '0')}]`
  }
}