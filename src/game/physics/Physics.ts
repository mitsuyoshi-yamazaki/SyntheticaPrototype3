import { GameObject } from "../object/GameObject"

type EnergyConsumptionParameters = {
  readonly moveWeight: number
}

type PhysicsParameters = {
  readonly energyConsumption: EnergyConsumptionParameters
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

  /// オブジェクトの位置と速度の更新
  public updateObjects(_objects: GameObject[]): void {
    // TODO:
  }
}
