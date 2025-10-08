import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent } from "./Agent"

export const AgentActionResolver = {
  resolveMove(
    physics: Physics,
    agent: Agent,
    power: Vector
  ): { energyConsumption: number; forceToApply: Vector } {
    const forcePower = power.length
    const requiredEnergy = physics.energyConsumption.requiredEnergyForMovingWeight(
      agent.weight,
      forcePower
    )
    if (requiredEnergy >= agent.energyAmount) {
      return {
        energyConsumption: requiredEnergy,
        forceToApply: power,
      }
    }

    const reducedPower = physics.energyConsumption.maxPowerForMovingWeight(
      agent.weight,
      agent.energyAmount
    )
    return {
      energyConsumption: agent.energyAmount,
      forceToApply: power.normalized.multiply(reducedPower),
    }
  },
}
