import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"

// 各命令が正常にデコードされるかの検証は vm-instructions.test.ts の各命令の動作検証に含まれるので、ここでは基本的な命令型ごとのデコードの検証のみを行う

describe("InstructionDecoder", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  describe("命令のデコード", () => {
    test("オペランドを持たない命令", () => {
      vm.writeMemory8(0, 0x00) // NOP0
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "NOP0") {
        // decodedの型を収束させるためのif
        expect(decoded.mnemonic).toBe("NOP0")
        fail()
      }

      expect(decoded.opcode).toBe(0x00)
      expect(decoded.length).toBe(1)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(1)
      expect(decoded.conditionalCycles).toEqual(1)
    })

    test("OperandOffset16", () => {
      vm.writeMemory8(0, 0x40) // LOAD_A
      vm.writeMemory8(1, 0x12)
      vm.writeMemory8(2, 0x34)
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "LOAD_A") {
        expect(decoded.mnemonic).toBe("LOAD_A")
        fail()
      }

      expect(decoded.opcode).toBe(0x40)
      expect(decoded.length).toBe(3)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(2)
      expect(decoded.conditionalCycles).toEqual(2)
      expect(decoded.operand.offset16).toEqual(0x3412)
    })

    test("OperandRegister", () => {
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x01) // Bレジスタ
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "LOAD_REG") {
        expect(decoded.mnemonic).toBe("LOAD_REG")
        fail()
      }

      expect(decoded.opcode).toBe(0x50)
      expect(decoded.length).toBe(3)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(2)
      expect(decoded.conditionalCycles).toEqual(2)
      expect(decoded.operand.register).toEqual("B")
    })

    test("OperandAddress16", () => {
      vm.writeMemory8(0, 0x52) // LOAD_IND_REG
      vm.writeMemory8(1, 0x12)
      vm.writeMemory8(2, 0x34)
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "LOAD_IND_REG") {
        expect(decoded.mnemonic).toBe("LOAD_IND_REG")
        fail()
      }

      expect(decoded.opcode).toBe(0x52)
      expect(decoded.length).toBe(3)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(2)
      expect(decoded.conditionalCycles).toEqual(2)
      expect(decoded.operand.address16).toEqual(0x3412)
    })

    test("OperandUnit", () => {
      vm.writeMemory8(0, 0x94) // UNIT_EXISTS
      vm.writeMemory8(1, 0x01) // 上位4bit: ユニット種別, 下位4bit: ユニットインデックス
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "UNIT_EXISTS") {
        expect(decoded.mnemonic).toBe("UNIT_EXISTS")
        fail()
      }

      expect(decoded.opcode).toBe(0x94)
      expect(decoded.length).toBe(4)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.unitType).toEqual("HULL")
      expect(decoded.operand.unitIndex).toEqual(0x01)
    })

    test("OperandUnit & OperandUnitMemoryAddress", () => {
      vm.writeMemory8(0, 0x90) // UNIT_MEM_READ
      vm.writeMemory8(1, 0x12) // 上位4bit: ユニット種別, 下位4bit: ユニットインデックス
      vm.writeMemory8(2, 0x34) // ユニット操作メモリアドレス
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "UNIT_MEM_READ") {
        expect(decoded.mnemonic).toBe("UNIT_MEM_READ")
        fail()
      }

      expect(decoded.opcode).toBe(0x90)
      expect(decoded.length).toBe(4)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.unitType).toEqual("ASSEMBLER")
      expect(decoded.operand.unitIndex).toEqual(0x02)
      expect(decoded.operand.unitMemoryAddress).toEqual(0x34)
    })

    test("OperandUnit & OperandRegister", () => {
      vm.writeMemory8(0, 0x92) // UNIT_MEM_READ_REG
      vm.writeMemory8(1, 0x25) // 上位4bit: ユニット種別, 下位4bit: ユニットインデックス
      vm.writeMemory8(2, 0x03) // Dレジスタ
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "UNIT_MEM_READ_REG") {
        expect(decoded.mnemonic).toBe("UNIT_MEM_READ_REG")
        fail()
      }

      expect(decoded.opcode).toBe(0x92)
      expect(decoded.length).toBe(4)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.unitType).toEqual("COMPUTER")
      expect(decoded.operand.unitIndex).toEqual(0x05)
      expect(decoded.operand.register).toEqual("D")
    })

    test("OperandRegisters", () => {
      vm.writeMemory8(0, 0xc5) // CMOV_Z
      vm.writeMemory8(1, 0x00) // Aレジスタ
      vm.writeMemory8(2, 0x02) // Cレジスタ
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "CMOV_Z") {
        expect(decoded.mnemonic).toBe("CMOV_Z")
        fail()
      }

      expect(decoded.opcode).toBe(0xc5)
      expect(decoded.length).toBe(5)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.sourceRegister).toEqual("A")
      expect(decoded.operand.destinationRegister).toEqual("C")
    })

    test("OperandImmediate16", () => {
      vm.writeMemory8(0, 0xe0) // LOAD_IMM
      vm.writeMemory8(1, 0x23)
      vm.writeMemory8(2, 0x45)
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "LOAD_IMM") {
        expect(decoded.mnemonic).toBe("LOAD_IMM")
        fail()
      }

      expect(decoded.opcode).toBe(0xe0)
      expect(decoded.length).toBe(5)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.immediate16).toEqual(0x4523)
    })

    test("未定義命令", () => {
      vm.writeMemory8(0, 0xff)
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "NOP") {
        fail()
      }

      expect(decoded.opcode).toBe(0xff)
      expect(decoded.mnemonic).toBe("NOP")
      expect(decoded.length).toBe(1)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(1)
      expect(decoded.conditionalCycles).toEqual(1)
    })

    test("無効なオペランド(OperandRegister)", () => {
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x05) // 対象レジスタなし
      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "INVALID") {
        expect(decoded.mnemonic).toBe("INVALID")
        fail()
      }

      expect(decoded.opcode).toBe(0x50)
      expect(decoded.length).toBe(3)
      expect(decoded.address).toBe(0)
      expect(decoded.cycles).toEqual(1)
      expect(decoded.conditionalCycles).toEqual(1)
    })
  })

  describe("format", () => {
    test.todo("TODO")
  })

  describe("境界条件", () => {
    test("メモリ境界での命令読み取り", () => {
      // メモリサイズ0x10での境界テスト（5バイト命令）
      vm.programCounter = 0x0e
      vm.writeMemory8(0x0e, 0xe0) // LOAD_IMM
      vm.writeMemory8(0x0f, 0xab)
      vm.writeMemory8(0x00, 0xcd)
      vm.writeMemory8(0x01, 0x00) // 循環
      vm.writeMemory8(0x02, 0x00)

      const decoded = InstructionDecoder.decode(vm)

      if (decoded.mnemonic !== "LOAD_IMM") {
        expect(decoded.mnemonic).toBe("LOAD_IMM")
        fail()
      }

      expect(decoded.opcode).toBe(0xe0)
      expect(decoded.length).toBe(5)
      expect(decoded.address).toBe(0x0e)
      expect(decoded.cycles).toEqual(3)
      expect(decoded.conditionalCycles).toEqual(3)
      expect(decoded.operand.immediate16).toEqual(0xcdab)
    })
  })
})
