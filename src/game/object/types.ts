import type { Agent } from "../agent/Agent"
import type { Energy } from "../energy/Energy"
import type { EnergySource } from "../energy/EnergySource"

export type AnyGameObject = Agent | Energy
export type AnyEnvironmentalObject = EnergySource
