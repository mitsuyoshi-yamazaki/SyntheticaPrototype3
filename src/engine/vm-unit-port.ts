import { UnitType } from "../types/game"

export class VMInvalidUnitError extends Error {
  public constructor(
    public readonly unitType: UnitType,
    public readonly errorType:
      | "Unit index out of range"
      | "Memory index out of range"
      | "Readonly memory"
  ) {
    super(errorType)
    this.name = "VMInvalidUnitError"
  }
}

/**
 * VMStateと共に扱う、外部ユニットアクセスを司るポートの抽象インターフェース
 */
export type VMUnitPort = {
  read: (unitType: UnitType, unitIndex: number, memoryIndex: number) => number
  write: (unitType: UnitType, unitIndex: number, memoryIndex: number, value: number) => void
}

export const VMUnitPortNone: VMUnitPort = {
  read(unitType: UnitType, _unitIndex: number, _memoryIndex: number): number {
    throw new VMInvalidUnitError(unitType, "Unit index out of range")
  },

  write(unitType: UnitType, _unitIndex: number, _memoryIndex: number, _value: number): void {
    throw new VMInvalidUnitError(unitType, "Unit index out of range")
  },
}
