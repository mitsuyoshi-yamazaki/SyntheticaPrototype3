import { DrawableObject } from "./DrawableObject"
import type { Id } from "./ObjectId"
import type { AnyEnvironmentalObject, AnyGameObject } from "./types"

/// EnvironmentalObjectは他のEnvironmentalObjectやGameObjectと相互作用を持たない
export abstract class EnvironmentalObject<T extends EnvironmentalObject<T>> extends DrawableObject {
  public abstract readonly id: Id<T>

  public abstract readonly type: string

  public abstract run(t: number): {
    objectsToAdd: AnyGameObject[]
    environmentalObjectsToRemove: AnyEnvironmentalObject[]
  }
}
