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
          // HULL（デザイン仕様: #A9A9A9、四角形）
          const hull = obj as Hull
          const size = obj.radius * 2
          
          // 四角形を描画
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.fill(0xa9a9a9)
          
          // HP減少時は縁に赤み
          const healthRatio = hull.currentEnergy / hull.buildEnergy
          if (healthRatio < 0.7) {
            objGraphics.rect(-size/2, -size/2, size, size)
            objGraphics.stroke({ width: 2, color: 0xff0000, alpha: 1 - healthRatio })
          }
          break
        }
        
        case "ASSEMBLER": {
          // ASSEMBLER（デザイン仕様: #FF8C00、正方形）
          const size = obj.radius * 2
          
          // 正方形を描画
          objGraphics.rect(-size/2, -size/2, size, size)
          objGraphics.fill(0xff8c00)
          
          // 活動中は明るく
          const assembler = obj as Assembler
          if (assembler.isAssembling) {
            objGraphics.rect(-size/2 + 2, -size/2 + 2, size - 4, size - 4)
            objGraphics.fill({ color: 0xffd700, alpha: 0.3 })
          }
          break
        }
        
        case "COMPUTER": {
          // COMPUTER（デザイン仕様: #00BFFF、円形）
          // 円形を描画
          objGraphics.circle(0, 0, obj.radius)
          objGraphics.fill(0x00bfff)
          
          // 活動中は中央に白い点
          const computer = obj as Computer
          if (computer.isRunning) {
            objGraphics.circle(0, 0, 2)
            objGraphics.fill({ color: 0xffffff, alpha: 0.9 })
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
