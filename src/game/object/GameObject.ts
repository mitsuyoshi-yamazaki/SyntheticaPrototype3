import type { Vector } from "../../utility/Vector"

export abstract class GameObject {
  public abstract readonly type: string
  public abstract readonly radius: number
  public abstract readonly weight: number
  public abstract position: Vector
  public abstract velocity: Vector
  public abstract acceleration: Vector

  public applyForce(force: Vector): void {
    this.acceleration = this.acceleration.add(force)
  }
}
