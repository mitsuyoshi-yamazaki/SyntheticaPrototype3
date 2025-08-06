import * as PIXI from "pixi.js"
import { World } from "@/engine"
import type { ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

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
    // デモ用設定：エージェントなし、エネルギーソースと力場のみ
    this._world = new World({
      width,
      height,
      parameters: {
        energySourceCount: 5, // エネルギーソースを5つ配置
        energySourceMinRate: 50,
        energySourceMaxRate: 150,
        ticksPerFrame: 1,
      },
      initialAgents: [], // エージェントなし
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
    border.stroke({ width: 2, color: 0xcccccc })
    container.addChild(border)

    // 力場を描画（半透明）
    for (const field of this._world.state.forceFields.values()) {
      const fieldGraphics = new PIXI.Graphics()

      // 力場の種類に応じた色
      let color = 0x808080
      const alpha = 0.2
      switch (field.type) {
        case "LINEAR":
          color = 0x00ffff
          break
        case "RADIAL":
          color = field.strength > 0 ? 0xff8080 : 0x8080ff // 斥力は赤、引力は青
          break
        case "SPIRAL":
          color = 0xff00ff
          break
      }

      // 力場の範囲を円で表示
      fieldGraphics.circle(field.position.x, field.position.y, field.radius)
      fieldGraphics.fill({ color, alpha })

      // 中心点
      fieldGraphics.circle(field.position.x, field.position.y, 5)
      fieldGraphics.fill(color)

      container.addChild(fieldGraphics)
    }

    // エネルギーソースを描画
    for (const source of this._world.state.energySources.values()) {
      const sourceGraphics = new PIXI.Graphics()
      sourceGraphics.circle(0, 0, 10)
      sourceGraphics.fill(0xffff00)
      sourceGraphics.stroke({ width: 2, color: 0xff8800 })
      sourceGraphics.x = source.position.x
      sourceGraphics.y = source.position.y
      container.addChild(sourceGraphics)
    }

    // ゲームオブジェクトを描画
    for (const obj of this._world.state.objects.values()) {
      const objGraphics = new PIXI.Graphics()

      // タイプに応じた色
      let color = 0x808080
      switch (obj.type) {
        case "ENERGY":
          color = 0x00ff00
          break
        case "HULL":
          color = 0x0080ff
          break
        case "ASSEMBLER":
          color = 0xff8000
          break
        case "COMPUTER":
          color = 0xff00ff
          break
      }

      objGraphics.circle(0, 0, obj.radius)
      objGraphics.fill(color)
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
