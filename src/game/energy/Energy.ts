import { Vector } from "../../utility/Vector"
import { GameObject } from "../object/GameObject"

export class Energy extends GameObject {
  public readonly type = "Energy"

  public constructor(
    public readonly position: Vector,
    public readonly radius: number,
    public readonly weight: number,
    public readonly velocity: Vector,
    public readonly amount: number
  ) {
    super()
  }
}

export const isEnergy = (obj: GameObject): obj is Energy => {
  return obj.type === "Energy"
}
