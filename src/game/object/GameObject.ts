import { Vector } from "../../utility/Vector"

export abstract class GameObject {
  public abstract readonly type: string
  public abstract readonly position: Vector
  public abstract readonly radius: number
  public abstract readonly weight: number
  public abstract readonly velocity: Vector
}
