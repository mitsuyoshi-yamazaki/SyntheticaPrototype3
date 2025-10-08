import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent } from "./Agent"

export const AgentActionResolver = {
  /**
   * 予約された移動アクションに対して、消費エネルギーと発生する力を返す
   * エージェントのもつエネルギーが不足する場合は、全エネルギーを消費したときに発生させられる力を返す
   */
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
