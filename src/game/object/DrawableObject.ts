import type { Graphics } from "pixi.js"
import type { Vector } from "../../utility/Vector"
import type { RenderTheme } from "../GameWorld"

export abstract class DrawableObject {
  public abstract position: Vector

  public abstract renderPixi(graphics: Graphics, renderTheme: RenderTheme): void
}
