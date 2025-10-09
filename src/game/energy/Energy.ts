import { Graphics } from "pixi.js"
import { Vector } from "../../utility/Vector"
import { GameObject } from "../object/GameObject"
import { RenderTheme } from "../game-world/GameWorld"
import { getNewId, Id } from "../object/ObjectId"
import type { AnyGameObject } from "../object/types"

export class Energy extends GameObject<Energy> {
  public readonly type = "Energy"
  public readonly id: Id<Energy> = getNewId()
  public readonly radius: number
  public readonly weight: number

  public constructor(
    public position: Vector,
    public velocity: Vector,
    public amount: number
  ) {
    super()

    this.weight = amount
    this.radius = Math.sqrt(amount)
  }

  public renderPixi(graphics: Graphics, renderTheme: RenderTheme): void {
    graphics.circle(this.position.x - this.radius, this.position.y - this.radius, this.radius)
    graphics.fill({ color: renderTheme.energyColor, alpha: 1 })
  }
}

export const isEnergy = (obj: AnyGameObject): obj is Energy => {
  return obj.type === "Energy"
}
