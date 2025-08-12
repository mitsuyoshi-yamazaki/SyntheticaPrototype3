import { UnitTypes } from "../types/game"
import { VMInvalidUnitError, VMUnitPortNone } from "./vm-unit-port"

describe("VMUnitPortNone", () => {
  test.each(UnitTypes)("read $unitType", unitType => {
    try {
      VMUnitPortNone.read(unitType, 0, 0)

      fail("例外が発生していない")
    } catch (error) {
      expect(error instanceof VMInvalidUnitError).toBe(true)
      expect((error as VMInvalidUnitError).unitType).toBe(unitType)
      expect((error as VMInvalidUnitError).errorType).toBe("Unit index out of range")
    }
  })

  test.each(UnitTypes)("write $unitType", unitType => {
    try {
      VMUnitPortNone.write(unitType, 0, 0, 0)

      fail("例外が発生していない")
    } catch (error) {
      expect(error instanceof VMInvalidUnitError).toBe(true)
      expect((error as VMInvalidUnitError).unitType).toBe(unitType)
      expect((error as VMInvalidUnitError).errorType).toBe("Unit index out of range")
    }
  })
})
