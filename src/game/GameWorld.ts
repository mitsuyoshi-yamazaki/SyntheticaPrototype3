import * as PIXI from "pixi.js"

export class GameWorld {
  private _t = 0

  public get tickCount(): number {
    return this._t
  }

  public constructor(
    public readonly width: number,
    public readonly height: number
  ) {}

  public tick() {
    // TODO:
  }

  public renderPixi(_container: PIXI.Container): void {
    // TODO:
  }

  public getObjectCount(): number {
    return 0 // TODO:
  }
}
