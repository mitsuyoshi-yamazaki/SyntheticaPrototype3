import * as PIXI from "pixi.js"
import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent, isAgent } from "../agent/Agent"
import { AgentActionResolver } from "../agent/AgentActionResolver"
import { DrawableObject } from "../object/DrawableObject"
import { AnyEnvironmentalObject, AnyGameObject } from "../object/types"

export type RenderTheme = {
  readonly backgroundColor: number
  readonly agentColor: number
  readonly energyColor: number
}

export class GameWorld {
  private _t = 0
  private readonly _environmentalObjects: AnyEnvironmentalObject[] = []
  private readonly _objects: AnyGameObject[] = []

  public get tickCount(): number {
    return this._t
  }

  public constructor(
    public readonly size: Vector,
    public readonly physics: Physics,
    public readonly renderTheme: RenderTheme
  ) {}

  public addEnvironmentalObject(obj: AnyEnvironmentalObject): void {
    this._environmentalObjects.push(obj)
  }

  public addObjects(objects: AnyGameObject[]): void {
    this._objects.push(...objects)
  }

  public tick() {
    // setup
    this._objects.forEach(obj => (obj.acceleration = null))
    const agents = this._objects.filter(isAgent)

    // 1. エージェント動作
    this.runReservedAgentActions(agents)

    // 2. 物理計算
    this.updateObjects()

    // 3. 環境動作
    this.runEnvironmentalObjects()

    // 4. ソフトウェア実行
    this.runAgents(agents)
  }

  private runReservedAgentActions(agents: Agent[]): void {
    agents.forEach(agent => {
      agent.saying = null

      Array.from(Object.values(agent.actionReserves)).forEach(actionReserve => {
        switch (actionReserve.case) {
          case "Say":
            agent.saying = actionReserve.message
            return

          case "Move": {
            const resolved = AgentActionResolver.resolveMove(
              this.physics,
              agent,
              actionReserve.power
            )
            agent.energyAmount -= resolved.energyConsumption
            agent.applyForce(resolved.forceToApply)
            return
          }
          case "Assemble":
            // TODO:
            return
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = actionReserve
            return
          }
        }
      })
    })
  }

  private updateObjects(): void {
    this._objects.forEach(obj => {
      obj.position = this.normalizedPosition(obj.position.add(obj.velocity))
      obj.velocity = this.physics.updatedVelocity(obj.velocity)

      if (obj.acceleration != null) {
        obj.velocity = obj.velocity.add(this.physics.velocityForPower(obj.acceleration, obj.weight))
      }
    })
  }

  private normalizedPosition(position: Vector): Vector {
    return new Vector(
      (position.x + this.size.x) % this.size.x,
      (position.y + this.size.y) % this.size.y
    )
  }

  private runEnvironmentalObjects(): void {
    this._environmentalObjects.forEach(environmentalObject => {
      const { objectsToAdd } = environmentalObject.run()
      this.addObjects(objectsToAdd)
    })
  }

  private runAgents(agents: Agent[]): void {
    agents.forEach(agent => {
      agent.actionReserves = {}
      agent.software(agent)
    })
  }

  public renderPixi(container: PIXI.Container): void {
    // コンテナをクリア
    container.removeChildren()

    // 世界の境界線を描画
    const border = new PIXI.Graphics()
    border.rect(0, 0, this.size.x, this.size.y)
    border.stroke({ width: 1, color: 0x666666 })
    container.addChild(border)

    // オブジェクトを描画
    const drawableObjects: DrawableObject[] = [...this._environmentalObjects, ...this._objects]
    drawableObjects.forEach(drawableObject => {
      const graphics = new PIXI.Graphics()
      drawableObject.renderPixi(graphics, this.renderTheme)
      container.addChild(graphics)
    })
  }

  public getObjectCount(): number {
    return 0 // TODO:
  }
}
