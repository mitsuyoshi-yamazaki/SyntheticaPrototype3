import { Vector } from "../../utility/Vector"

type EnergyConsumptionParameters = {
  readonly moveWeight: number
}

export type PhysicsParameters = {
  readonly energyConsumption: EnergyConsumptionParameters

  readonly inertia: number

  frictionForVelocity: (velocity: number) => number
}

class EnergyConsumption {
  public constructor(public readonly parameters: EnergyConsumptionParameters) {}

  public requiredEnergyForMovingWeight(weight: number, power: number): number {
    return power * weight * this.parameters.moveWeight
  }

  public maxPowerForMovingWeight(weight: number, availableEnergy: number): number {
    return availableEnergy / (weight * this.parameters.moveWeight)
  }
}

export class Physics {
  public readonly energyConsumption: EnergyConsumption

  public constructor(public readonly parameters: PhysicsParameters) {
    this.energyConsumption = new EnergyConsumption(parameters.energyConsumption)
  }

  public frictionForVelocity(velocity: number): number {
    return this.parameters.frictionForVelocity(velocity)
  }

  public updatedVelocity(velocity: Vector): Vector {
    return velocity.multiply(
      (velocity.length - this.frictionForVelocity(velocity.length)) / velocity.length
    )
  }

  public velocityForPower(power: Vector, weight: number): Vector {
    return power.divide(Math.max(weight * this.parameters.inertia, 0.01))
  }
}
