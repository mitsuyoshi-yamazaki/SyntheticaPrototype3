import { Vector } from "../../utility/Vector"
import { EnvironmentalObject } from "../object/EnvironmentalObject"

export class EnergySource extends EnvironmentalObject {
  public readonly type = "EnergySource"

  public constructor(public readonly position: Vector) {
    super()
  }
}

export const isEnergySource = (obj: EnvironmentalObject): obj is EnergySource => {
  return obj.type === "EnergySource"
}
