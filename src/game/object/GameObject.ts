import type { Vector } from "../../utility/Vector"
import { DrawableObject } from "./DrawableObject"
import type { Id } from "./ObjectId"

export abstract class GameObject<T extends GameObject<T>> extends DrawableObject {
  public abstract readonly id: Id<T>

  public abstract readonly type: string
  public abstract readonly radius: number
  public abstract readonly weight: number
  public abstract velocity: Vector

  public acceleration: Vector | null = null

  public applyForce(force: Vector): void {
    if (this.acceleration == null) {
      this.acceleration = force
    } else {
      this.acceleration = this.acceleration.add(force)
    }
  }
}
