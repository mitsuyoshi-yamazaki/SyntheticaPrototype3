import { ObjectId } from "../types/game"
import { DebugComputerVMSystem } from "./computer-vm-system"

export class WorldDebugger {
  public constructor(private readonly _computerVMSystem: DebugComputerVMSystem) {}

  public setSelectedHull(hullId: ObjectId | null): void {
    this._computerVMSystem.selectedHullId = hullId
    if (hullId != null) {
      console.log(`[${this.constructor.name}] HULLを選択: #${hullId}`)
    }
  }
}
