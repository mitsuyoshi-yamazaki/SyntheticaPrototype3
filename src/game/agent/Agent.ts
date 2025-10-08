import { Vector } from "../../utility/Vector"
import { GameObject } from "../object/GameObject"
import { AgentApi } from "./AgentApi"
import { AgentSpec } from "./AgentType"

// ActionReserveには予約する必要のある（ゲーム世界に影響を及ぼす）アクションのみが定義される
type ActionReserveMove = {
  readonly case: "Move"
  readonly power: Vector
}
type ActionReserveConnect = {
  readonly case: "Connect"
  readonly target: number // TODO:
}
type ActionReserve = ActionReserveMove | ActionReserveConnect

/* eslint-disable @typescript-eslint/member-ordering */
export class Agent extends GameObject implements AgentApi {
  public readonly type = "Agent"
  public actionReserves: { [A in ActionReserve as A["case"]]?: A } = {}

  public constructor(
    public readonly position: Vector,
    public readonly radius: number,
    public readonly weight: number,
    public readonly velocity: Vector,
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

  // Property Accessor
  public readonly energyAmount: number = 0

  // Action APIs
  public move(power: Vector): void {
    this.actionReserves.Move = {
      case: "Move",
      power,
    }
  }
}
/* eslint-enable @typescript-eslint/member-ordering */

export const isAgent = (obj: GameObject): obj is Agent => {
  return obj.type === "Agent"
}
