import type { Vector } from "../../utility/Vector"
import type { Energy } from "../energy/Energy"
import type { Id } from "../object/ObjectId"
import type { Agent } from "./Agent"
import { AgentSpec } from "./AgentType"

export type AgentApi = AgentSpec & {
  // Property Accessor
  readonly energyAmount: number
  readonly velocity: Vector

  // Action APIs

  // Action Reserve APIs
  say(message: string): void
  move(power: Vector): void
  assemble(spec: AgentSpec): void
  absorb(targetId: Id<Energy>, amount: number): void
  transfer(energyAmount: number, targetId: Id<Agent>): void
}
