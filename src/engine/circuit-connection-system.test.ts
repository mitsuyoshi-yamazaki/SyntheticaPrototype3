import { CircuitConnectionSystem } from "./circuit-connection-system"
import type { ObjectId, Hull, Assembler, Computer, Unit } from "@/types/game"
import { Vec2 } from "@/utils/vec2"

describe("CircuitConnectionSystem", () => {
  describe("ユニット識別子", () => {
    test("種別コードの取得", () => {
      expect(CircuitConnectionSystem.getTypeCode("HULL")).toBe(0x00)
      expect(CircuitConnectionSystem.getTypeCode("ASSEMBLER")).toBe(0x40)
      expect(CircuitConnectionSystem.getTypeCode("COMPUTER")).toBe(0xc0)
    })

    test("識別子の生成", () => {
      // HULL[0]
      expect(CircuitConnectionSystem.createIdentifier("HULL", 0)).toBe(0x00)
      // HULL[3]
      expect(CircuitConnectionSystem.createIdentifier("HULL", 3)).toBe(0x03)
      // ASSEMBLER[0]
      expect(CircuitConnectionSystem.createIdentifier("ASSEMBLER", 0)).toBe(0x40)
      // ASSEMBLER[2]
      expect(CircuitConnectionSystem.createIdentifier("ASSEMBLER", 2)).toBe(0x42)
      // COMPUTER[0]
      expect(CircuitConnectionSystem.createIdentifier("COMPUTER", 0)).toBe(0xc0)
      // COMPUTER[1]
      expect(CircuitConnectionSystem.createIdentifier("COMPUTER", 1)).toBe(0xc1)
    })

    test("無効なインデックスでエラー", () => {
      expect(() => CircuitConnectionSystem.createIdentifier("HULL", -1)).toThrow()
      expect(() => CircuitConnectionSystem.createIdentifier("HULL", 64)).toThrow()
    })

    test("識別子から種別コード取得", () => {
      expect(CircuitConnectionSystem.getTypeFromIdentifier(0x00)).toBe(0x00)
      expect(CircuitConnectionSystem.getTypeFromIdentifier(0x03)).toBe(0x00)
      expect(CircuitConnectionSystem.getTypeFromIdentifier(0x42)).toBe(0x40)
      expect(CircuitConnectionSystem.getTypeFromIdentifier(0xc1)).toBe(0xc0)
    })

    test("識別子からインデックス取得", () => {
      expect(CircuitConnectionSystem.getIndexFromIdentifier(0x00)).toBe(0)
      expect(CircuitConnectionSystem.getIndexFromIdentifier(0x03)).toBe(3)
      expect(CircuitConnectionSystem.getIndexFromIdentifier(0x42)).toBe(2)
      expect(CircuitConnectionSystem.getIndexFromIdentifier(0xc1)).toBe(1)
    })

    test("識別子からユニット種別取得", () => {
      expect(CircuitConnectionSystem.getUnitTypeFromIdentifier(0x00)).toBe("HULL")
      expect(CircuitConnectionSystem.getUnitTypeFromIdentifier(0x42)).toBe("ASSEMBLER")
      expect(CircuitConnectionSystem.getUnitTypeFromIdentifier(0xc1)).toBe("COMPUTER")
      // 0xffは0xc0マスクされるとCOMPUTERになる
      expect(CircuitConnectionSystem.getUnitTypeFromIdentifier(0x80)).toBeNull() // 無効な種別コード
    })
  })

  describe("回路接続チェック", () => {
    let hull1: Hull
    let hull2: Hull
    let assembler1: Assembler
    let assembler2: Assembler
    let computer1: Computer

    beforeEach(() => {
      hull1 = {
        id: 1 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [{ id: 2 as ObjectId, visualData: { angle: 0 } }],
          computers: [{ id: 3 as ObjectId, visualData: { startAngle: 0, endAngle: 360 } }],
        },
      }

      hull2 = {
        id: 10 as ObjectId,
        type: "HULL",
        position: Vec2.create(100, 0),
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [{ id: 11 as ObjectId, visualData: { angle: 0 } }],
          computers: [],
        },
      }

      assembler1 = {
        id: 2 as ObjectId,
        type: "ASSEMBLER",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 1000,
        mass: 1000,
        buildEnergy: 1000,
        currentEnergy: 1000,
        assemblePower: 1,
        isAssembling: false,
        progress: 0,
        parentHull: hull1.id,
      }

      assembler2 = {
        id: 11 as ObjectId,
        type: "ASSEMBLER",
        position: Vec2.create(100, 0),
        velocity: Vec2.zero,
        radius: 10,
        energy: 1000,
        mass: 1000,
        buildEnergy: 1000,
        currentEnergy: 1000,
        assemblePower: 1,
        isAssembling: false,
        progress: 0,
        parentHull: hull2.id,
      }

      computer1 = {
        id: 3 as ObjectId,
        type: "COMPUTER",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 3700,
        mass: 3700,
        buildEnergy: 3700,
        currentEnergy: 3700,
        processingPower: 1,
        memorySize: 64,
        memory: new Uint8Array(64),
        programCounter: 0,
        registers: new Uint16Array(8),
        stackPointer: 0,
        zeroFlag: false,
        carryFlag: false,
        isRunning: false,
        vmCyclesExecuted: 0,
        parentHull: hull1.id,
      }
    })

    test("同一HULL上のユニット間はアクセス可能", () => {
      expect(CircuitConnectionSystem.canAccess(assembler1, computer1)).toBe(true)
      expect(CircuitConnectionSystem.canAccess(computer1, assembler1)).toBe(true)
    })

    test("異なるHULL上のユニット間はアクセス不可", () => {
      expect(CircuitConnectionSystem.canAccess(assembler1, assembler2)).toBe(false)
      expect(CircuitConnectionSystem.canAccess(computer1, assembler2)).toBe(false)
    })

    test("parentHullがないユニットはアクセス不可", () => {
      // parentHullを除外したアセンブラーを作成
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parentHull: _parentHull, ...assemblerBase } = assembler1
      const assemblerWithoutHull = assemblerBase as Assembler
      expect(CircuitConnectionSystem.canAccess(assemblerWithoutHull, computer1)).toBe(false)
      expect(CircuitConnectionSystem.canAccess(computer1, assemblerWithoutHull)).toBe(false)
    })

    test("自己参照は可能", () => {
      expect(CircuitConnectionSystem.canAccess(computer1, computer1)).toBe(true)
    })
  })

  describe("メモリアクセス", () => {
    let assembler: Assembler
    let computer: Computer

    beforeEach(() => {
      const hullId = 1 as ObjectId

      assembler = {
        id: 2 as ObjectId,
        type: "ASSEMBLER",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 1000,
        mass: 1000,
        buildEnergy: 1000,
        currentEnergy: 1000,
        assemblePower: 5,
        isAssembling: false,
        progress: 0,
        parentHull: hullId,
      }

      computer = {
        id: 3 as ObjectId,
        type: "COMPUTER",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 3700,
        mass: 3700,
        buildEnergy: 3700,
        currentEnergy: 3700,
        processingPower: 1,
        memorySize: 64,
        memory: new Uint8Array(64),
        programCounter: 0,
        registers: new Uint16Array(8),
        stackPointer: 0,
        zeroFlag: false,
        carryFlag: false,
        isRunning: false,
        vmCyclesExecuted: 0,
        parentHull: hullId,
      }
    })

    test("メモリ読み取りのアクセスチェック", () => {
      const result = CircuitConnectionSystem.readUnitMemory(computer, assembler, 0x00)
      expect(result.success).toBe(true)
      // 値は仮実装なので0
      expect(result.value).toBe(0)
    })

    test("接続されていないユニットからの読み取りは失敗", () => {
      const computerDifferentHull = { ...computer, parentHull: 99 as ObjectId }
      const result = CircuitConnectionSystem.readUnitMemory(computerDifferentHull, assembler, 0x00)
      expect(result.success).toBe(false)
      expect(result.error).toContain("not on same HULL")
    })

    test("無効なアドレスへの読み取りは失敗", () => {
      const result = CircuitConnectionSystem.readUnitMemory(computer, assembler, 256)
      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid memory address")
    })

    test("メモリ書き込みのアクセスチェック", () => {
      const result = CircuitConnectionSystem.writeUnitMemory(computer, assembler, 0x01, 0x00)
      expect(result.success).toBe(true)
    })

    test("無効な値の書き込みは失敗", () => {
      const result = CircuitConnectionSystem.writeUnitMemory(computer, assembler, 0x01, 0x10000)
      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid value")
    })
  })

  describe("回路再構成", () => {
    test("HULL分離時の回路再構成", () => {
      const hull: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [
            { id: 2 as ObjectId, visualData: { angle: 0 } },
            { id: 5 as ObjectId, visualData: { angle: 180 } },
          ],
          computers: [
            { id: 3 as ObjectId, visualData: { startAngle: 0, endAngle: 180 } },
            { id: 4 as ObjectId, visualData: { startAngle: 180, endAngle: 360 } },
          ],
        },
      }

      const separatedUnits = [3, 4] as ObjectId[]
      const result = CircuitConnectionSystem.reconfigureCircuitOnSeparation(hull, separatedUnits)

      expect(result.remainingUnits).toEqual([2, 5] as ObjectId[])
      expect(result.separatedCircuit).toEqual([3, 4] as ObjectId[])
    })

    test("HULL統合時の回路結合", () => {
      const hull1: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [
            { id: 2 as ObjectId, visualData: { angle: 0 } },
          ],
          computers: [
            { id: 3 as ObjectId, visualData: { startAngle: 0, endAngle: 360 } },
          ],
        },
      }

      const hull2: Hull = {
        id: 10 as ObjectId,
        type: "HULL",
        position: Vec2.create(20, 0),
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [
            { id: 11 as ObjectId, visualData: { angle: 0 } },
          ],
          computers: [
            { id: 12 as ObjectId, visualData: { startAngle: 0, endAngle: 360 } },
          ],
        },
      }

      const mergedUnits = CircuitConnectionSystem.mergeCircuits(hull1, hull2)
      expect(mergedUnits).toEqual([2, 3, 11, 12] as ObjectId[])
    })
  })

  describe("デバッグ機能", () => {
    test("回路接続状態の文字列表現", () => {
      const hull: Hull = {
        id: 123 as ObjectId,
        type: "HULL",
        position: Vec2.zero,
        velocity: Vec2.zero,
        radius: 10,
        energy: 200,
        mass: 200,
        buildEnergy: 200,
        currentEnergy: 200,
        capacity: 100,
        storedEnergy: 0,
        attachedUnits: {
          hulls: [],
          assemblers: [
            { id: 2 as ObjectId, visualData: { angle: 0 } },
            { id: 3 as ObjectId, visualData: { angle: 180 } },
          ],
          computers: [
            { id: 4 as ObjectId, visualData: { startAngle: 0, endAngle: 360 } },
          ],
        },
      }

      const units = new Map<ObjectId, Unit>([
        [2 as ObjectId, { type: "ASSEMBLER" } as Assembler],
        [3 as ObjectId, { type: "ASSEMBLER" } as Assembler],
        [4 as ObjectId, { type: "COMPUTER" } as Computer],
      ])

      const debug = CircuitConnectionSystem.debugCircuitState(hull, units)
      expect(debug).toContain("Hull[ID: 123]")
      expect(debug).toContain("ASSEMBLER[0]")
      expect(debug).toContain("ASSEMBLER[1]")
      expect(debug).toContain("COMPUTER[0]")
      expect(debug).toContain("回路接続可能")
      expect(debug).toContain("回路接続不可")
    })
  })
})
