import { DrawableObject } from "./DrawableObject"
import type { GameObject } from "./GameObject"

/// EnvironmentalObjectは他のEnvironmentalObjectやGameObjectと相互作用を持たない
export abstract class EnvironmentalObject extends DrawableObject {
  public abstract readonly type: string

  public abstract run(): { objectsToAdd: GameObject[] }
}
