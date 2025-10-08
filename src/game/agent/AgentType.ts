import type { GameWorldApi } from "../game-world/GameWorldApi"
import type { AgentApi } from "./AgentApi"

export type AgentSoftware = (agentApi: AgentApi, gameWorldApi: GameWorldApi) => void

export type AgentSpec = {
  readonly capacity: number
  readonly accessControl: "Accessible" | "Inaccessible"
  readonly assemblePower: number
  readonly disassemblePower: number
  readonly numberOfConnectors: number
  readonly movePower: number
  readonly senseRange: number

  readonly software: AgentSoftware
}
