import { Assembler, Computer, Hull, ObjectId, Unit, UnitType } from "../types/game"
import { VMUnitMemoryAccessor } from "./vm-unit-memory-accessor"

/**
 * VMStateと共に扱う、外部ユニットアクセスを司るポートの抽象インターフェース
 */
export type VMUnitPort = {
  read: (unitType: UnitType, unitIndex: number, memoryIndex: number) => number
  write: (unitType: UnitType, unitIndex: number, memoryIndex: number, value: number) => void
  exists: (unitType: UnitType, unitIndex: number) => boolean
}

export const VMUnitPortNone: VMUnitPort = {
  read(_unitType: UnitType, _unitIndex: number, _memoryIndex: number): number {
    return 0xff
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  write(_unitType: UnitType, _unitIndex: number, _memoryIndex: number, _value: number): void {},

  exists(_unitType: UnitType, _unitIndex: number): boolean {
    return false
  },
}

type UnitMap = { HULL: Hull[]; ASSEMBLER: Assembler[]; COMPUTER: Computer[] }

export class VMPhysicalUnitPort implements VMUnitPort {
  private readonly _connectedUnits: UnitMap

  public constructor(computer: Computer, getUnitById: (unitId: ObjectId) => Unit | null) {
    /**
     1. docs/spec-v3/circuit-connection-specification.md

  - ユニットインデックス (行75-78):
    - 各ユニット種別ごとに0から始まるインデックス
    - 同一HULL内でのみ有効
    - ユニット削除時もインデックスは保持（歯抜け状態を許容）
  - ユニット指定方法 (行80-93):
    - 上位4bit: ユニット種別（0x0=HULL, 0x4=ASSEMBLER, 0xC=COMPUTER）
    - 下位4bit: インデックス（0-15）
    - 例: ASSEMBLER[2] = 0x42、COMPUTER[1] = 0xC1

  2. docs/spec-v3/synthetica-script.md

  - VM命令でのユニット指定 (行235-254, 1027-1033):
    - UNIT_MEM_READ/WRITE命令の第2バイトでユニット指定
    - 上位4bit=種別、下位4bit=インデックス
    - 自己参照時はCOMPUTER[0]が常に自身を示す
  - 動的ユニット操作 (行260-263):
    - UNIT_MEM_WRITE_DYN命令でレジスタ経由のアドレス指定可能
     */
    this._connectedUnits = {
      HULL: [],
      ASSEMBLER: [],
      COMPUTER: [],
    }

    this._connectedUnits = { HULL: [], ASSEMBLER: [], COMPUTER: [] }
    this.recursivelyGetConnectedUnits(computer, this._connectedUnits, [], getUnitById)
  }

  private recursivelyGetConnectedUnits(
    unit: Unit,
    connectedUnits: UnitMap,
    unitIds: ObjectId[],
    getUnitById: (unitId: ObjectId) => Unit | null
  ): void {
    unitIds.push(unit.id)

    switch (unit.type) {
      case "HULL":
        connectedUnits[unit.type].push(unit)
        break
      case "ASSEMBLER":
        connectedUnits[unit.type].push(unit)
        break
      case "COMPUTER":
        connectedUnits[unit.type].push(unit)
        break
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = unit
        break
      }
    }

    if (unit.parentHullId == null) {
      return
    }

    const hull = getUnitById(unit.parentHullId) as Hull | null
    if (hull == null) {
      return
    }

    hull.attachedUnitIds.forEach(unitId => {
      if (unitIds.includes(unitId)) {
        return
      }
      const attachedUnit = getUnitById(unitId)
      if (attachedUnit == null) {
        return
      }
      this.recursivelyGetConnectedUnits(attachedUnit, connectedUnits, unitIds, getUnitById)
    })

    this.recursivelyGetConnectedUnits(hull, connectedUnits, unitIds, getUnitById)
  }

  public read(unitType: UnitType, unitIndex: number, memoryIndex: number): number {
    const unit = this._connectedUnits[unitType][unitIndex]
    if (unit == null) {
      return 0xff
    }
    return VMUnitMemoryAccessor.readMemory(unit, memoryIndex)
  }

  public write(unitType: UnitType, unitIndex: number, memoryIndex: number, value: number): void {
    const unit = this._connectedUnits[unitType][unitIndex]
    if (unit == null) {
      return
    }
    VMUnitMemoryAccessor.writeMemory(unit, memoryIndex, value)
  }

  public exists(unitType: UnitType, unitIndex: number): boolean {
    return this._connectedUnits[unitType][unitIndex] != null
  }
}
