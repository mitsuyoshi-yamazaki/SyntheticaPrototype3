import { Graphics } from "pixi.js"
import { Vector } from "../../utility/Vector"
import { GameObject } from "../object/GameObject"
import { RenderTheme } from "../GameWorld"

export class Energy extends GameObject {
  public readonly type = "Energy"
  public readonly radius: number
  public readonly weight: number
  public acceleration = Vector.zero()

  public constructor(
    public position: Vector,
    public velocity: Vector,
    public readonly amount: number
  ) {
    super()

    this.weight = amount
    this.radius = Math.sqrt(amount)
  }

  public renderPixi(graphics: Graphics, renderTheme: RenderTheme): void {
    graphics.circle(this.position.x - this.radius, this.position.y - this.radius, this.radius)
    graphics.fill(renderTheme.energyColor)
  }
}

export const isEnergy = (obj: GameObject): obj is Energy => {
  return obj.type === "Energy"
}
