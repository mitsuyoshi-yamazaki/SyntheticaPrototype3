import { Graphics } from "pixi.js"
import { randomInRange, Range } from "../../utility/UtilityFunctions"
import { Vector } from "../../utility/Vector"
import { EnvironmentalObject } from "../object/EnvironmentalObject"
import { Energy } from "./Energy"
import { RenderTheme } from "../game-world/GameWorld"
import { AnyEnvironmentalObject, AnyGameObject } from "../object/types"
import { getNewId, Id } from "../object/ObjectId"

export class EnergySource extends EnvironmentalObject<EnergySource> {
  public readonly type = "EnergySource"
  public readonly id: Id<EnergySource> = getNewId()

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

  public run(): { objectsToAdd: AnyGameObject[] } {
    if (this.cooldown > 0) {
      this.cooldown -= 1
      return { objectsToAdd: [] }
    }

    const energyAmountToProduce = Math.floor(randomInRange(this.energyAmountRange))
    this.cooldown = Math.floor(randomInRange(this.cooldownRange))
    const energyVelocityDirection = randomInRange(this.energyProductionDirectionRange)
    const energyVelocity = Vector.fromAngle(
      (energyVelocityDirection * Math.PI) / 180,
      randomInRange(this.energyProductionVelocityRange)
    )

    return {
      objectsToAdd: [new Energy(this.position, energyVelocity, energyAmountToProduce)],
    }
  }

  public renderPixi(graphics: Graphics, renderTheme: RenderTheme): void {
    const size = 10
    const radius = size / 2
    graphics.roundRect(this.position.x - radius, this.position.y - radius, size, size, size / 5)
    graphics.fill(renderTheme.energyColor)
  }
}

export const isEnergySource = (obj: AnyEnvironmentalObject): obj is EnergySource => {
  return obj.type === "EnergySource"
}
