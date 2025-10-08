import * as PIXI from "pixi.js"
import { Vector } from "../../utility/Vector"
import { GameObject } from "../object/GameObject"
import { AgentApi } from "./AgentApi"
import { AgentSoftware, AgentSpec } from "./AgentType"
import type { AnyGameObject } from "../object/types"
import { getNewId, Id } from "../object/ObjectId"
import { RenderTheme } from "../game-world/GameWorld"

// ActionReserveには予約する必要のある（ゲーム世界に影響を及ぼす）アクションのみが定義される
type ActionReserveSay = {
  readonly case: "Say"
  readonly message: string
}
type ActionReserveMove = {
  readonly case: "Move"
  readonly power: Vector
}
type ActionReserveAssemble = {
  readonly case: "Assemble"
  readonly spec: AgentSpec
}
type ActionReserveTransfer = {
  readonly case: "Transfer"
  readonly energyAmount: number
  readonly targetId: Id<Agent>
}
type ActionReserve =
  | ActionReserveSay
  | ActionReserveMove
  | ActionReserveAssemble
  | ActionReserveTransfer

/* eslint-disable @typescript-eslint/member-ordering */
export class Agent extends GameObject<Agent> implements AgentApi {
  public readonly type = "Agent"
  public readonly id: Id<Agent> = getNewId()
  public readonly radius: number
  public velocity = Vector.zero()

  public actionReserves: { [A in ActionReserve as A["case"]]?: A } = {}
  public saying: string | null = null

  public get weight(): number {
    return this.capacity + this.energyAmount
  }

  public constructor(
    public position: Vector,
    spec: AgentSpec
  ) {
    super()

    this.movePower = spec.movePower
    this.capacity = spec.capacity
    this.accessControl = spec.accessControl
    this.assemblePower = spec.assemblePower
    this.disassemblePower = spec.disassemblePower
    this.numberOfConnectors = spec.numberOfConnectors
    this.movePower = spec.movePower
    this.senseRange = spec.senseRange
    this.software = spec.software

    this.radius = Math.max(Math.sqrt(this.capacity), 1)
  }

  public renderPixi(graphics: PIXI.Graphics, renderTheme: RenderTheme): void {
    graphics.circle(this.position.x - this.radius, this.position.y - this.radius, this.radius)
    graphics.fill(renderTheme.backgroundColor)
    graphics.stroke({
      width: 2,
      color: renderTheme.agentColor,
    })

    if (this.saying != null) {
      const centerX = this.position.x - this.radius
      const centerY = this.position.y - this.radius
      const textY = centerY - this.radius - 7

      const text = new PIXI.Text({
        text: this.saying,
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: 8,
          fill: 0xffffff,
          fontWeight: "bold",
        },
      })
      text.x = centerX
      text.y = textY
      text.anchor.set(0.5) // 中央揃え

      graphics.addChild(text)
    }
  }

  // ---- APIs ---- //
  // Read agent spec
  public readonly capacity: number
  public readonly accessControl: "Accessible" | "Inaccessible"
  public readonly assemblePower: number
  public readonly disassemblePower: number
  public readonly numberOfConnectors: number
  public readonly movePower: number
  public readonly senseRange: number
  public readonly software: AgentSoftware

  // Property Accessor
  public energyAmount = 0

  // Action APIs
  // Action Reserve APIs
  public say(message: string): void {
    this.actionReserves.Say = {
      case: "Say",
      message,
    }
  }

  public move(power: Vector): void {
    this.actionReserves.Move = {
      case: "Move",
      power,
    }
  }

  public assemble(spec: AgentSpec): void {
    this.actionReserves.Assemble = {
      case: "Assemble",
      spec,
    }
  }

  public transfer(energyAmount: number, targetId: Id<Agent>): void {
    this.actionReserves.Transfer = {
      case: "Transfer",
      energyAmount,
      targetId,
    }
  }
}
/* eslint-enable @typescript-eslint/member-ordering */

export const isAgent = (obj: AnyGameObject): obj is Agent => {
  return obj.type === "Agent"
}
