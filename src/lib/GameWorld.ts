import * as PIXI from "pixi.js"
import { World } from "@/engine"
import type { ObjectId, Hull, Assembler, Computer } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { SELF_REPLICATOR_PRESET } from "@/engine/presets/self-replicator-preset"
import { drawPillShape, drawSector, calculatePillShapeSize } from './render-utils'

/**
 * ゲーム世界の基本クラス
 * 新しいエンジンへのブリッジとして機能
 */
export class GameWorld {
  private readonly _world: World

  public get tickCount(): number {
    return this._world.state.tick
  }

  public get width(): number {
    return this._world.state.width
  }

  public get height(): number {
    return this._world.state.height
  }

  public constructor(width: number, height: number) {
    // デモ用設定：自己複製エージェント、エネルギーソース、力場を配置
    this._world = new World({
      width,
      height,
      parameters: {
        energySourceCount: 5, // エネルギーソースを5つ配置
        energySourceMinRate: 50,
        energySourceMaxRate: 150,
        ticksPerFrame: 1,
      },
      defaultAgentPresets: [
        {
          preset: SELF_REPLICATOR_PRESET,
          position: Vec2Utils.create(width * 0.3, height * 0.5),
        },
      ],
    })

    // 中央に渦巻き力場を追加
    this._world.addForceField({
      id: 1000001 as ObjectId, // 固定ID使用
      type: "SPIRAL",
      position: Vec2Utils.create(width / 2, height / 2),
      radius: Math.min(width, height) * 0.4,
      strength: 20,
    })

    // 左上に放射状力場を追加（引力）
    this._world.addForceField({
      id: 1000002 as ObjectId,
      type: "RADIAL",
      position: Vec2Utils.create(width * 0.2, height * 0.2),
      radius: 150,
      strength: -15, // 負の値で引力
    })

    // 右下に放射状力場を追加（斥力）
    this._world.addForceField({
      id: 1000003 as ObjectId,
      type: "RADIAL",
      position: Vec2Utils.create(width * 0.8, height * 0.8),
      radius: 150,
      strength: 25, // 正の値で斥力
    })
  }

  /** ゲームオブジェクトの総数を取得 */
  public getObjectCount(): number {
    return this._world.state.objects.size
  }

  public renderPixi(container: PIXI.Container): void {
    // コンテナをクリア
    container.removeChildren()

    // 世界の境界線を描画
    const border = new PIXI.Graphics()
    border.rect(0, 0, this.width, this.height)
    border.stroke({ width: 1, color: 0x666666 })
    container.addChild(border)

    // 力場を描画（デザイン仕様: rgba(173,216,230,0.2)）
    for (const field of this._world.state.forceFields.values()) {
      const fieldGraphics = new PIXI.Graphics()

      // 力場の範囲を薄く塗りつぶし
      fieldGraphics.circle(field.position.x, field.position.y, field.radius)
      fieldGraphics.fill({ color: 0xadd8e6, alpha: 0.2 })

      container.addChild(fieldGraphics)
    }

    // エネルギーソースを描画（デザイン仕様: #FFB700、太陽型）
    for (const source of this._world.state.energySources.values()) {
      const sourceGraphics = new PIXI.Graphics()
      
      // 太陽型（放射状の星形）を描画
      sourceGraphics.star(0, 0, 8, 12, 8)  // 8点の星形、外径12、内径8
      sourceGraphics.fill(0xffb700)
      
      // 中心の円（より明るく）
      sourceGraphics.circle(0, 0, 5)
      sourceGraphics.fill({ color: 0xffd700, alpha: 0.8 })
      
      sourceGraphics.x = source.position.x
      sourceGraphics.y = source.position.y
      container.addChild(sourceGraphics)
    }

    // ゲームオブジェクトを描画（デザイン仕様準拠）
    for (const obj of this._world.state.objects.values()) {
      const objGraphics = new PIXI.Graphics()

      // タイプに応じた描画
      switch (obj.type) {
        case "ENERGY": {
          // エネルギーオブジェクト（デザイン仕様: #FFD700、小さな円形）
          objGraphics.circle(0, 0, obj.radius)
          objGraphics.fill(0xffd700)
          break
        }
        
        case "HULL": {
          // HULL（デザイン仕様v2: #A9A9A9、pill shape）
          const hull = obj as Hull
          const { width, height } = calculatePillShapeSize(hull.capacity)
          
          // Pill shapeを描画
          drawPillShape(objGraphics, 0, 0, width, height)
          objGraphics.fill(0xa9a9a9)
          
          // HP減少時は縁に赤み
          const healthRatio = hull.currentEnergy / hull.buildEnergy
          if (healthRatio < 0.7) {
            drawPillShape(objGraphics, 0, 0, width, height)
            objGraphics.stroke({ width: 2, color: 0xff0000, alpha: 1 - healthRatio })
          }
          
          // 固定されているユニットを描画
          const attachedInfo = hull.attachedUnits
          const hasAttached = attachedInfo.hulls.length > 0 || 
                              attachedInfo.assemblers.length > 0 || 
                              attachedInfo.computers.length > 0
          
          if (hasAttached) {
            // HULL内のASSEMBLERを描画
            const hasComputers = attachedInfo.computers.length > 0
            
            attachedInfo.assemblers.forEach(assemblerInfo => {
              const assembler = this._world.state.objects.get(assemblerInfo.id) as Assembler | undefined
              if (!assembler) return
              
              const angle = assemblerInfo.visualData.angle
              const innerRadius = hasComputers ? height * 0.3 : 0  // COMPUTERがある場合は先端を欠く
              const outerRadius = Math.min(width, height) * 0.45
              
              // 扇形を描画
              const sectorGraphics = new PIXI.Graphics()
              drawSector(sectorGraphics, 0, 0, outerRadius, angle - 30, angle + 30, innerRadius)
              sectorGraphics.fill(0xff8c00)
              
              // 活動中は明るく
              if (assembler.isAssembling) {
                sectorGraphics.circle(outerRadius * 0.7 * Math.cos(angle * Math.PI / 180),
                                    outerRadius * 0.7 * Math.sin(angle * Math.PI / 180), 3)
                sectorGraphics.fill({ color: 0xffd700, alpha: 0.5 })
              }
              
              objGraphics.addChild(sectorGraphics)
            })
            
            // HULL内のCOMPUTERを描画
            if (hasComputers) {
              const computerRadius = height * 0.25
              
              attachedInfo.computers.forEach(computerInfo => {
                const computer = this._world.state.objects.get(computerInfo.id) as Computer | undefined
                if (!computer) return
                
                const startAngle = computerInfo.visualData.startAngle
                const endAngle = computerInfo.visualData.endAngle
                
                // ピザカット形状を描画
                const computerGraphics = new PIXI.Graphics()
                drawSector(computerGraphics, 0, 0, computerRadius, startAngle, endAngle)
                computerGraphics.fill(0x00bfff)
                
                // 活動中は中央に白い点
                if (computer.isRunning) {
                  const midAngle = (startAngle + endAngle) / 2
                  computerGraphics.circle(
                    computerRadius * 0.5 * Math.cos(midAngle * Math.PI / 180),
                    computerRadius * 0.5 * Math.sin(midAngle * Math.PI / 180),
                    2
                  )
                  computerGraphics.fill({ color: 0xffffff, alpha: 0.9 })
                }
                
                objGraphics.addChild(computerGraphics)
              })
            }
          }
          break
        }
        
        case "ASSEMBLER": {
          // ASSEMBLER（デザイン仕様v2: #FF8C00、角丸長方形）
          const assembler = obj as Assembler
          const size = obj.radius * 2
          
          // HULLに固定されていない場合のみネイティブデザインを描画
          if (assembler.parentHull === undefined) {
            // 角丸長方形を描画
            objGraphics.roundRect(-size/2, -size/2, size, size, 5)
            objGraphics.fill(0xff8c00)
            
            // 活動中は明るく
            if (assembler.isAssembling) {
              objGraphics.roundRect(-size/2 + 2, -size/2 + 2, size - 4, size - 4, 3)
              objGraphics.fill({ color: 0xffd700, alpha: 0.3 })
            }
          }
          // HULLに固定されている場合はHULL側で描画される
          break
        }
        
        case "COMPUTER": {
          // COMPUTER（デザイン仕槕v2: #00BFFF、円形）
          const computer = obj as Computer
          
          // HULLに固定されていない場合のみネイティブデザインを描画
          if (computer.parentHull === undefined) {
            // 円形を描画
            objGraphics.circle(0, 0, obj.radius)
            objGraphics.fill(0x00bfff)
            
            // 活動中は中央に白い点
            if (computer.isRunning) {
              objGraphics.circle(0, 0, 2)
              objGraphics.fill({ color: 0xffffff, alpha: 0.9 })
            }
          }
          // HULLに固定されている場合はHULL側で描画される
          break
        }
        
        default:
          // 未定義のタイプは灰色の円
          objGraphics.circle(0, 0, obj.radius)
          objGraphics.fill(0x808080)
          objGraphics.stroke({ width: 1, color: 0x404040 })
      }

      objGraphics.x = obj.position.x
      objGraphics.y = obj.position.y
      container.addChild(objGraphics)
    }
  }

  /** 1tick進める */
  public tick(): void {
    this._world.tick()
  }

  /** デバッグ用：ランダムエネルギー生成 */
  public spawnRandomEnergy(amount: number): void {
    this._world.spawnRandomEnergy(amount)
  }
}
