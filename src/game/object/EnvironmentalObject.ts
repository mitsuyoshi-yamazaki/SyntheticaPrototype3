import type { Vector } from "../../utility/Vector"
import type { GameObject } from "./GameObject"

/// EnvironmentalObjectは他のEnvironmentalObjectやGameObjectと相互作用を持たない
export abstract class EnvironmentalObject {
  public abstract readonly type: string
  public abstract readonly position: Vector

  public abstract run(): { objectsToAdd: GameObject[] }
}
