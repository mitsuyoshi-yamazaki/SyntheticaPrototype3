import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent } from "./Agent"
import { AgentSpec, requiredEnergyAmountForSpec } from "./AgentSpec"

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
    if (requiredEnergy <= agent.energyAmount) {
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
      forceToApply: power.length === 0 ? power : power.normalized.multiply(reducedPower),
    }
  },

  resolveAssemble(
    _physics: Physics,
    agent: Agent,
    spec: AgentSpec,
    transferEnergyAmount: number
  ): { canAssemble: boolean; assembleEnergyConsumption: number } {
    const requiredEnergy = requiredEnergyAmountForSpec(spec)
    if (agent.energyAmount < requiredEnergy + transferEnergyAmount) {
      return { canAssemble: false, assembleEnergyConsumption: 0 }
    }
    return {
      canAssemble: true,
      assembleEnergyConsumption: requiredEnergy,
    }
  },
}
