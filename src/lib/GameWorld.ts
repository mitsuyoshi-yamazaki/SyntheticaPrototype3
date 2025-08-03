import * as PIXI from "pixi.js"
import { World } from "@/engine"
import type { AgentDefinition } from "@/types/game"

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
    // サンプルエージェントの定義
    const sampleAgent: AgentDefinition = {
      name: "SampleAgent",
      hull: {
        buildEnergy: 1000,
        capacity: 500,
      },
      units: [
        {
          type: "ASSEMBLER",
          buildEnergy: 800,
          assemblePower: 1,
        },
        {
          type: "COMPUTER",
          buildEnergy: 600,
          processingPower: 10,
          memorySize: 1024,
        },
      ],
    }

    this._world = new World({
      width,
      height,
      initialAgents: [sampleAgent],
    })
  }

  public renderPixi(container: PIXI.Container): void {
    // コンテナをクリア
    container.removeChildren()

    // 世界の境界線を描画
    const border = new PIXI.Graphics()
    border.rect(0, 0, this.width, this.height)
    border.stroke({ width: 2, color: 0xcccccc })
    container.addChild(border)

    // エネルギーソースを描画
    for (const source of this._world.state.energySources.values()) {
      const sourceGraphics = new PIXI.Graphics()
      sourceGraphics.circle(0, 0, 10)
      sourceGraphics.fill(0xffff00)
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
