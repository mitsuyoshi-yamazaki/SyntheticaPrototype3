import type { Vector } from "../../utility/Vector"
import { DrawableObject } from "./DrawableObject"

export abstract class GameObject extends DrawableObject {
  public abstract readonly type: string
  public abstract readonly radius: number
  public abstract readonly weight: number
  public abstract velocity: Vector
  public abstract acceleration: Vector

  public applyForce(force: Vector): void {
    this.acceleration = this.acceleration.add(force)
  }
}
