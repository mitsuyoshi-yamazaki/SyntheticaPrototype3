import * as PIXI from "pixi.js"
import { GameObject } from "./object/GameObject"
import { Vector } from "../utility/Vector"
import { Physics } from "./physics/Physics"
import { EnvironmentalObject } from "./object/EnvironmentalObject"
import { Agent, isAgent } from "./agent/Agent"
import { AgentActionResolver } from "./agent/AgentActionResolver"

export class GameWorld {
  private _t = 0
  private readonly _environmentalObjects: EnvironmentalObject[] = []
  private readonly _objects: GameObject[] = []

  public get tickCount(): number {
    return this._t
  }

  public constructor(
    public readonly size: Vector,
    public readonly physics: Physics
  ) {}

  public addEnvironmentalObject(obj: EnvironmentalObject): void {
    this._environmentalObjects.push(obj)
  }

  public addObject(obj: GameObject): void {
    this._objects.push(obj)
  }

  public tick() {
    // setup
    this._objects.forEach(obj => (obj.acceleration = Vector.zero()))
    const agents = this._objects.filter(isAgent)

    // 1. エージェント動作
    this.runReservedAgentActions(agents)

    // 2. 物理計算
    this.updateObjects()

    // 3. 環境動作
    // TODO:

    // 4. ソフトウェア実行
    this.runAgents(agents)
  }

  private runReservedAgentActions(agents: Agent[]): void {
    agents.forEach(agent => {
      Array.from(Object.values(agent.actionReserves)).forEach(actionReserve => {
        switch (actionReserve.case) {
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
      // strictEntries(agent.actionReserves).forEach(<A extends ActionReserve, T = A["case"]>([actionType, actionReserve]: [T, A]) => {

      // })
    })
  }

  private updateObjects(): void {
    this._objects.forEach(obj => {
      obj.position = obj.position.add(obj.velocity)
      obj.velocity = this.physics
        .updatedVelocity(obj.velocity)
        .add(this.physics.velocityForPower(obj.acceleration, obj.weight))
    })
  }

  private runAgents(agents: Agent[]): void {
    agents.forEach(agent => {
      agent.actionReserves = {}
      agent.software(agent)
    })
  }

  public renderPixi(_container: PIXI.Container): void {
    // TODO:
  }

  public getObjectCount(): number {
    return 0 // TODO:
  }
}
