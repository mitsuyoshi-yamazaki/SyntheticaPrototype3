import type { Agent } from "../agent/Agent"
import type { Energy } from "../energy/Energy"
import type { EnergySource } from "../energy/EnergySource"
import type { TraceObject } from "./TraceObject"

export type AnyGameObject = Agent | Energy
export type AnyEnvironmentalObject = EnergySource | TraceObject
