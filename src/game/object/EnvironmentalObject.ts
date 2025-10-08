import { Vector } from "../../utility/Vector"

/// EnvironmentalObjectは他のEnvironmentalObjectやGameObjectと相互作用を持たない
export abstract class EnvironmentalObject {
  public abstract readonly type: string
  public abstract readonly position: Vector
}
