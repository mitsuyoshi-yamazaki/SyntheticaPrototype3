import * as PIXI from "pixi.js"
import { World } from "@/engine"
import type { ObjectId, Hull, Assembler, Computer } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { SELF_REPLICATOR_PRESET } from "@/engine/presets/self-replicator-preset"

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

    // 背景色設定（デザイン仕様: #101010）
    const background = new PIXI.Graphics()
    background.rect(0, 0, this.width, this.height)
    background.fill(0x101010)
    container.addChild(background)

    // 世界の境界線を描画
    const border = new PIXI.Graphics()
    border.rect(0, 0, this.width, this.height)
    border.stroke({ width: 2, color: 0x333333 })
    container.addChild(border)

    // 力場を描画（デザイン仕様外だが視覚的に必要）
    for (const field of this._world.state.forceFields.values()) {
      const fieldGraphics = new PIXI.Graphics()

      // 力場の種類に応じた色（補助視覚要素として控えめに）
      let color = 0x808080
      const alpha = 0.1
      switch (field.type) {
        case "LINEAR":
          color = 0x00ffff
          break
        case "RADIAL":
          color = field.strength > 0 ? 0xff6060 : 0x6060ff // 斥力は赤系、引力は青系
          break
        case "SPIRAL":
          color = 0xff00ff
          break
      }

      // 力場の範囲を点線風に表示（控えめに）
      const segments = 32
      const angleStep = (Math.PI * 2) / segments
      for (let i = 0; i < segments; i += 2) {
        const angle1 = angleStep * i
        const angle2 = angleStep * (i + 1)
        const x1 = field.position.x + Math.cos(angle1) * field.radius
        const y1 = field.position.y + Math.sin(angle1) * field.radius
        const x2 = field.position.x + Math.cos(angle2) * field.radius
        const y2 = field.position.y + Math.sin(angle2) * field.radius
        
        fieldGraphics.moveTo(x1, y1)
        fieldGraphics.lineTo(x2, y2)
      }
      fieldGraphics.stroke({ width: 1, color, alpha: alpha * 2 })

      // 範囲を薄く塗りつぶし
      fieldGraphics.circle(field.position.x, field.position.y, field.radius)
      fieldGraphics.fill({ color, alpha })

      // 中心点（小さく）
      fieldGraphics.circle(field.position.x, field.position.y, 3)
      fieldGraphics.fill({ color, alpha: 0.5 })

      container.addChild(fieldGraphics)
    }

    // エネルギーソースを描画（デザイン仕様: エネルギー色 #FFD700）
    for (const source of this._world.state.energySources.values()) {
      const sourceGraphics = new PIXI.Graphics()
      
      // 外周グロー効果
      sourceGraphics.circle(0, 0, 15)
      sourceGraphics.fill({ color: 0xffd700, alpha: 0.3 })
      
      // メイン円
      sourceGraphics.circle(0, 0, 10)
      sourceGraphics.fill(0xffd700)
      
      // 内部の輝き
      sourceGraphics.circle(-3, -3, 3)
      sourceGraphics.fill({ color: 0xffffff, alpha: 0.6 })
      
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
          // エネルギーオブジェクト（デザイン仕様: #FFD700）
          // グロー効果
          objGraphics.circle(0, 0, obj.radius + 3)
          objGraphics.fill({ color: 0xffd700, alpha: 0.4 })
          
          // メイン
          objGraphics.circle(0, 0, obj.radius)
          objGraphics.fill(0xffd700)
          break
        }
        
        case "HULL": {
          // HULL（デザイン仕様: #2C3E50、六角形/丸角長方形）
          const hull = obj as Hull
          const healthRatio = hull.currentEnergy / hull.buildEnergy
          
          // 六角形を描画
          const hexRadius = obj.radius
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i
            const x = Math.cos(angle) * hexRadius
            const y = Math.sin(angle) * hexRadius
            if (i === 0) {
              objGraphics.moveTo(x, y)
            } else {
              objGraphics.lineTo(x, y)
            }
          }
          objGraphics.closePath()
          objGraphics.fill(0x2c3e50)
          
          // HP減少時は縁に赤み
          if (healthRatio < 0.5) {
            objGraphics.stroke({ width: 2, color: 0xff0000, alpha: 1 - healthRatio })
          }
          
          // ボーダー
          objGraphics.stroke({ width: 2, color: 0x1a252f })
          break
        }
        
        case "ASSEMBLER": {
          // ASSEMBLER（デザイン仕様: #D35400、四角＋下向きピン）
          const size = obj.radius * 1.5
          
          // メイン四角
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.fill(0xd35400)
          
          // 下向きピン
          objGraphics.moveTo(-size/4, size/2)
          objGraphics.lineTo(0, size/2 + size/3)
          objGraphics.lineTo(size/4, size/2)
          objGraphics.fill(0xa04000)
          
          // ボーダー
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.stroke({ width: 2, color: 0x8a2e00 })
          
          // 活動中は下部が光る
          const assembler = obj as Assembler
          if (assembler.isAssembling) {
            objGraphics.rect(-size/2, size/2 - 4, size, 4)
            objGraphics.fill({ color: 0xffa500, alpha: 0.8 })
          }
          break
        }
        
        case "COMPUTER": {
          // COMPUTER（デザイン仕様: #F39C12、正方形）
          const size = obj.radius * 2
          
          // メイン正方形
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.fill(0xf39c12)
          
          // ボーダー
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.stroke({ width: 2, color: 0xc87f0a })
          
          // 活動中は中央が点滅（簡易版: 常に表示）
          const computer = obj as Computer
          if (computer.isRunning) {
            objGraphics.circle(0, 0, 3)
            objGraphics.fill({ color: 0xffffff, alpha: 0.8 })
          }
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
