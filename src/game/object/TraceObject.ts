import { Graphics } from "pixi.js"
import { Vector } from "../../utility/Vector"
import { RenderTheme } from "../game-world/GameWorld"
import { getNewId, Id } from "../object/ObjectId"
import type { AnyEnvironmentalObject, AnyGameObject } from "../object/types"
import { EnvironmentalObject } from "./EnvironmentalObject"

type TraceTypeLine = {
  readonly case: "Line"
  readonly size: number
  readonly endPoint: Vector
  readonly color: number
}
type TraceTypeBlock = {
  readonly case: "Block"
  readonly size: number
  readonly color: number
}
type TraceType = TraceTypeLine | TraceTypeBlock

export class TraceObject extends EnvironmentalObject<TraceObject> {
  public readonly type = "TraceObject"
  public readonly id: Id<TraceObject> = getNewId()
  public readonly radius: number
  public readonly weight = 0
  public readonly velocity = Vector.zero()

  public constructor(
    public position: Vector,
    public readonly traceType: TraceType,
    public readonly createdAt: number,
    public readonly lifetime: number
  ) {
    super()

    switch (traceType.case) {
      case "Line":
        this.radius = 1
        break
      case "Block":
        this.radius = traceType.size / 2
        break
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = traceType
        this.radius = 1
        break
      }
    }
  }

  public run(t: number): {
    objectsToAdd: AnyGameObject[]
    environmentalObjectsToRemove: AnyEnvironmentalObject[]
  } {
    if (t - this.createdAt > this.lifetime) {
      return {
        objectsToAdd: [],
        environmentalObjectsToRemove: [this],
      }
    }

    return {
      objectsToAdd: [],
      environmentalObjectsToRemove: [],
    }
  }

  public renderPixi(graphics: Graphics, renderTheme: RenderTheme): void {
    switch (this.traceType.case) {
      case "Line":
        graphics.moveTo(this.position.x, this.position.y)
        graphics.lineTo(this.traceType.endPoint.x, this.traceType.endPoint.y).stroke({
          width: this.traceType.size,
          color: renderTheme.energyColor,
          alpha: 0.1,
          alignment: 0.5,
        })
        return
      case "Block":
        graphics.rect(
          this.position.x - this.radius,
          this.position.y - this.radius,
          this.traceType.size,
          this.traceType.size
        )
        graphics.fill({ color: this.traceType.color, alpha: 0.1 })
        return
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = this.traceType
        return
      }
    }
  }
}

export const isTraceObject = (obj: AnyEnvironmentalObject): obj is TraceObject => {
  return obj.type === "TraceObject"
}
