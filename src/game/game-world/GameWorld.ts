import * as PIXI from "pixi.js"
import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent, isAgent } from "../agent/Agent"
import { AgentActionResolver } from "../agent/AgentActionResolver"
import { DrawableObject } from "../object/DrawableObject"
import { AnyEnvironmentalObject, AnyGameObject } from "../object/types"
import { Id } from "../object/ObjectId"

export type RenderTheme = {
  readonly backgroundColor: number
  readonly agentColor: number
  readonly energyColor: number
}

export class GameWorld {
  private _t = 0
  private readonly _environmentalObjects: AnyEnvironmentalObject[] = []
  private readonly _objects: AnyGameObject[] = []
  private readonly _objectsMap = new Map<AnyGameObject["id"], AnyGameObject>()

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
    objects.forEach(obj => this._objectsMap.set(obj.id, obj))
  }

  public removeObjects(objectIds: AnyGameObject["id"][]): void {
    objectIds.forEach(objectId => {
      const index = this._objects.findIndex(obj => obj.id === objectId)
      if (index >= 0) {
        this._objects.splice(index, 1)
      }

      this._objectsMap.delete(objectId)
    })
  }

  public getObjectById<T extends AnyGameObject>(id: Id<T>): T | null {
    return (this._objectsMap.get(id as AnyGameObject["id"]) ?? null) as T | null
  }

  public tick() {
    // setup
    this._objects.forEach(obj => (obj.acceleration = null))
    const agents = this._objects.filter(isAgent)

    // 1. エージェント動作
    const { objectsToRemove } = this.runReservedAgentActions(agents)

    // 2. 物理計算
    this.updateObjects()

    // 3. 環境動作
    this.runEnvironmentalObjects()

    // 4. ソフトウェア実行
    this.runAgents(agents)

    this.removeObjects(objectsToRemove.map(obj => obj.id))
  }

  private runReservedAgentActions(agents: Agent[]): { objectsToRemove: AnyGameObject[] } {
    const objectsToRemove: AnyGameObject[] = []

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
          case "Absorb": {
            const target = this.getObjectById(actionReserve.targetId)
            if (target != null && target.type === "Energy" && agent.isAdjacentTo(target)) {
              const absorbableAmount = Math.min(actionReserve.amount, target.amount)
              const receivableAmount = Math.min(
                absorbableAmount,
                agent.capacity - agent.energyAmount
              )
              target.amount -= receivableAmount
              agent.energyAmount += receivableAmount

              if (target.amount <= 0.1) {
                objectsToRemove.push(target)
              }
            }
            return
          }
          case "Transfer": {
            const target = this.getObjectById(actionReserve.targetId)
            if (target != null && target.type === "Agent") {
              const transferableAmount = Math.min(actionReserve.energyAmount, agent.energyAmount)
              const receivableAmount = Math.min(
                transferableAmount,
                target.capacity - target.energyAmount
              )
              agent.energyAmount -= receivableAmount
              target.energyAmount += receivableAmount
            }
            return
          }
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = actionReserve
            return
          }
        }
      })
    })

    return { objectsToRemove }
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

  /**
   * トーラス平面上での2点間の相対位置ベクトルを計算する（最短距離）
   * @param from 基準点
   * @param to 対象点
   * @returns fromを原点としたときのtoの相対位置（最短経路）
   */
  private torusRelativePosition(from: Vector, to: Vector): Vector {
    const dx = to.x - from.x
    const dy = to.y - from.y

    // 各軸について、境界を越えた場合の距離と通常の距離を比較して短い方を選ぶ
    const shortestDx = Math.abs(dx) <= this.size.x / 2 ? dx : dx - Math.sign(dx) * this.size.x
    const shortestDy = Math.abs(dy) <= this.size.y / 2 ? dy : dy - Math.sign(dy) * this.size.y

    return new Vector(shortestDx, shortestDy)
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
      agent.software(agent, {
        searchObjects: () => this.searchObjects(agent.position, agent.senseRange),
        searchEnvironmentalObjects: () =>
          this.searchEnvironmentalObjects(agent.position, agent.senseRange),
      })
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
    return this._objects.length
  }

  // ---- APIs ---- //
  public searchObjects(
    position: Vector,
    range: number
  ): {
    id: AnyGameObject["id"]
    objectType: AnyGameObject["type"]
    position: Vector
  }[] {
    const rangeSquared = range * range
    return this._objects
      .map(obj => {
        const relativePos = this.torusRelativePosition(position, obj.position)
        return {
          object: obj,
          relativePosition: relativePos,
          distanceSquared: relativePos.lengthSquared,
        }
      })
      .filter(item => item.distanceSquared <= rangeSquared)
      .map(item => ({
        id: item.object.id,
        objectType: item.object.type,
        position: item.relativePosition,
      }))
  }

  public searchEnvironmentalObjects(
    position: Vector,
    range: number
  ): {
    id: AnyEnvironmentalObject["id"]
    objectType: AnyEnvironmentalObject["type"]
    position: Vector
  }[] {
    const rangeSquared = range * range
    return this._environmentalObjects
      .map(obj => {
        const relativePos = this.torusRelativePosition(position, obj.position)
        return {
          object: obj,
          relativePosition: relativePos,
          distanceSquared: relativePos.lengthSquared,
        }
      })
      .filter(item => item.distanceSquared <= rangeSquared)
      .map(item => ({
        id: item.object.id,
        objectType: item.object.type,
        position: item.relativePosition,
      }))
  }
}
