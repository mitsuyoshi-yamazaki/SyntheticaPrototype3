import { Vector } from "../../utility/Vector"
import { AgentSpec } from "./AgentType"

export type AgentApi = AgentSpec & {
  // Property Accessor
  readonly energyAmount: number
  readonly velocity: Vector

  // Action APIs
  move(power: Vector): void
}

export type AgentSoftware = (api: AgentApi) => void
