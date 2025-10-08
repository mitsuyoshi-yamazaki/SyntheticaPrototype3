import type { Vector } from "../../utility/Vector"
import { DrawableObject } from "./DrawableObject"

export abstract class GameObject extends DrawableObject {
  public abstract readonly type: string
  public abstract readonly radius: number
  public abstract readonly weight: number
  public abstract velocity: Vector
  public abstract acceleration: Vector | null

  public applyForce(force: Vector): void {
    if (this.acceleration == null) {
      this.acceleration = force
    } else {
      this.acceleration = this.acceleration.add(force)
    }
  }
}
