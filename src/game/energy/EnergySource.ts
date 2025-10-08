import { randomInRange, Range } from "../../utility/UtilityFunctions"
import { Vector } from "../../utility/Vector"
import { EnvironmentalObject } from "../object/EnvironmentalObject"
import { GameObject } from "../object/GameObject"
import { Energy } from "./Energy"

export class EnergySource extends EnvironmentalObject {
  public readonly type = "EnergySource"

  private cooldown = 0

  public constructor(
    public readonly position: Vector,
    public readonly energyAmountRange: Range,
    public readonly cooldownRange: Range,
    public readonly energyProductionDirectionRange: Range,
    public readonly energyProductionVelocityRange: Range
  ) {
    super()
  }

  public run(): { objectsToAdd: GameObject[] } {
    if (this.cooldown > 0) {
      this.cooldown -= 1
      return { objectsToAdd: [] }
    }

    const energyAmountToProduce = Math.floor(randomInRange(this.energyAmountRange))
    this.cooldown = Math.floor(randomInRange(this.cooldownRange))
    const energyVelocityDirection = randomInRange(this.energyProductionDirectionRange)
    const energyVelocity = Vector.fromAngle(
      energyVelocityDirection,
      randomInRange(this.energyProductionVelocityRange)
    )

    return {
      objectsToAdd: [new Energy(this.position, energyVelocity, energyAmountToProduce)],
    }
  }
}

export const isEnergySource = (obj: EnvironmentalObject): obj is EnergySource => {
  return obj.type === "EnergySource"
}
