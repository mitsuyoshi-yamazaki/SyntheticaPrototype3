import { UnitTypes } from "../types/game"
import { VMUnitPortNone } from "./vm-unit-port"

describe("VMUnitPortNone", () => {
  test.each(UnitTypes)("read $unitType", unitType => {
    expect(VMUnitPortNone.read(unitType, 0, 0)).toBe(0xff)
  })

  test.each(UnitTypes)("write $unitType", unitType => {
    expect(() => VMUnitPortNone.write(unitType, 0, 0, 0)).not.toThrow()
  })
})
