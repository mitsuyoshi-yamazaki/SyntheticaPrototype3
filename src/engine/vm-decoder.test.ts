import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"

describe("InstructionDecoder", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(1024)
  })

  describe("1バイト命令のデコード", () => {
    test("NOP命令", () => {
      vm.writeMemory8(0, 0x00) // NOP0
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.opcode).toBe(0x00)
      expect(decoded.instruction?.mnemonic).toBe("NOP0")
      expect(decoded.length).toBe(1)
      expect(decoded.isUndefined).toBe(false)
      expect(decoded.address).toBe(0)
      expect(decoded.operands).toEqual({})
    })

    test("データ移動命令", () => {
      vm.writeMemory8(0, 0x03) // MOV_AB
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.opcode).toBe(0x03)
      expect(decoded.instruction?.mnemonic).toBe("MOV_AB")
      expect(decoded.instruction?.type).toBe("DATA_MOVE")
      expect(decoded.length).toBe(1)
    })

    test("算術演算命令", () => {
      vm.writeMemory8(0, 0x18) // ADD_AB
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.opcode).toBe(0x18)
      expect(decoded.instruction?.mnemonic).toBe("ADD_AB")
      expect(decoded.instruction?.type).toBe("ARITHMETIC")
    })

    test("スタック操作命令", () => {
      vm.writeMemory8(0, 0x1f) // PUSH_A
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.opcode).toBe(0x1f)
      expect(decoded.instruction?.mnemonic).toBe("PUSH_A")
      expect(decoded.instruction?.type).toBe("STACK")
    })
  })

  describe("3バイト命令のデコード", () => {
    test("相対メモリアクセス（正のオフセット）", () => {
      vm.writeMemory8(0, 0x40) // LOAD_A
      vm.writeMemory8(1, 0x34) // offset low
      vm.writeMemory8(2, 0x12) // offset high
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.opcode).toBe(0x40)
      expect(decoded.instruction?.mnemonic).toBe("LOAD_A")
      expect(decoded.length).toBe(3)
      expect(decoded.operands.offset16).toBe(0x1234)
    })

    test("相対メモリアクセス（負のオフセット）", () => {
      vm.writeMemory8(0, 0x41) // STORE_A
      vm.writeMemory8(1, 0xfe) // offset low (-2)
      vm.writeMemory8(2, 0xff) // offset high
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.operands.offset16).toBe(-2)
    })

    test("レジスタベースメモリアクセス", () => {
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x42) // レジスタ2（C）、他のビットは無視
      vm.writeMemory8(2, 0xff) // 無視される
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("LOAD_REG")
      expect(decoded.operands.register).toBe(2) // Cレジスタ
    })

    test("相対ジャンプ命令", () => {
      vm.pc = 0x1000
      vm.writeMemory8(0x1000, 0x60) // JMP
      vm.writeMemory8(0x1001, 0x10) // offset low
      vm.writeMemory8(0x1002, 0x00) // offset high
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("JMP")
      expect(decoded.operands.offset16).toBe(0x0010)
      expect(decoded.address).toBe(0x1000)
    })

    test("即値ロード命令", () => {
      vm.writeMemory8(0, 0xe0) // LOAD_IMM
      vm.writeMemory8(1, 0xcd) // immediate low
      vm.writeMemory8(2, 0xab) // immediate high
      vm.writeMemory8(3, 0x00) // unused
      vm.writeMemory8(4, 0x00) // unused
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("LOAD_IMM")
      expect(decoded.length).toBe(5)
      expect(decoded.operands.immediate16).toBe(0xabcd)
    })

    test("即値演算命令（削除済み）", () => {
      vm.writeMemory8(0, 0x74) // 未定義命令（仕様から削除）
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.isUndefined).toBe(true)
      expect(decoded.instruction).toBe(null)
    })

    test("RET命令（特殊ケース）", () => {
      vm.writeMemory8(0, 0xb2) // RET
      vm.writeMemory8(1, 0xff) // 無視される
      vm.writeMemory8(2, 0xff) // 無視される
      vm.writeMemory8(3, 0xff) // 無視される
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("RET")
      expect(decoded.length).toBe(4)
      expect(decoded.operands).toEqual({}) // オペランドなし
    })
  })

  describe("4バイト命令のデコード", () => {
    test("絶対アドレスメモリアクセス", () => {
      vm.writeMemory8(0, 0xa0) // LOAD_ABS
      vm.writeMemory8(1, 0x01) // 無視される（命令の一部）
      vm.writeMemory8(2, 0x34) // address low
      vm.writeMemory8(3, 0x12) // address high
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("LOAD_ABS")
      expect(decoded.length).toBe(4)
      expect(decoded.operands.address16).toBe(0x1234)
    })

    test("絶対ジャンプ命令", () => {
      vm.writeMemory8(0, 0xb1) // JMP_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0xef) // address low
      vm.writeMemory8(3, 0xbe) // address high
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("JMP_ABS")
      expect(decoded.operands.address16).toBe(0xbeef)
    })

    test("ユニット制御命令", () => {
      vm.writeMemory8(0, 0x90) // UNIT_MEM_READ
      vm.writeMemory8(1, 0x00) // 無視される
      vm.writeMemory8(2, 0x42) // ユニット識別子
      vm.writeMemory8(3, 0x10) // ユニットメモリアドレス
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("UNIT_MEM_READ")
      expect(decoded.operands.unitId).toBe(0x42)
      expect(decoded.operands.unitMemAddr).toBe(0x10)
    })
  })

  describe("5バイト命令のデコード", () => {
    test("演算命令", () => {
      vm.writeMemory8(0, 0xc0) // MUL_AB
      vm.writeMemory8(1, 0x11)
      vm.writeMemory8(2, 0x22)
      vm.writeMemory8(3, 0x33)
      vm.writeMemory8(4, 0x44)
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("MUL_AB")
      expect(decoded.length).toBe(5)
      expect(decoded.instruction?.type).toBe("ARITHMETIC")
    })
  })

  describe("未定義命令", () => {
    test("未定義オペコード", () => {
      vm.writeMemory8(0, 0x3f) // 未定義（1バイト範囲の境界）
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.isUndefined).toBe(true)
      expect(decoded.instruction).toBeNull()
      expect(decoded.length).toBe(1)
    })

    test("各長さ範囲の未定義命令", () => {
      const testCases = [
        { opcode: 0x3e, expectedLength: 1 },
        { opcode: 0x7f, expectedLength: 3 },
        { opcode: 0xbf, expectedLength: 4 },
        { opcode: 0xfe, expectedLength: 5 },
      ]

      for (const { opcode, expectedLength } of testCases) {
        vm.reset()
        vm.writeMemory8(0, opcode)
        const decoded = InstructionDecoder.decode(vm)
        expect(decoded.isUndefined).toBe(true)
        expect(decoded.length).toBe(expectedLength)
      }
    })
  })

  describe("decodeAt", () => {
    test("指定アドレスでのデコード", () => {
      vm.pc = 0x500 // 現在のPC
      vm.writeMemory8(0x100, 0xe0) // LOAD_IMM
      vm.writeMemory8(0x101, 0x34)
      vm.writeMemory8(0x102, 0x12)
      vm.writeMemory8(0x103, 0x00)
      vm.writeMemory8(0x104, 0x00)

      const decoded = InstructionDecoder.decodeAt(vm, 0x100)

      expect(decoded.address).toBe(0x100)
      expect(decoded.instruction?.mnemonic).toBe("LOAD_IMM")
      expect(decoded.operands.immediate16).toBe(0x1234)
      expect(vm.pc).toBe(0x500) // PCは変更されない
    })
  })

  describe("format", () => {
    test("1バイト命令のフォーマット", () => {
      vm.writeMemory8(0, 0x18) // ADD_AB
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: 18              ADD_AB")
    })

    test("メモリアクセス命令のフォーマット（相対）", () => {
      vm.pc = 0x1000
      vm.writeMemory8(0x1000, 0x40) // LOAD_A
      vm.writeMemory8(0x1001, 0x10)
      vm.writeMemory8(0x1002, 0x00)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x1000: 40 10 00        LOAD_A +16")
    })

    test("メモリアクセス命令のフォーマット（絶対）", () => {
      vm.writeMemory8(0, 0xa0) // LOAD_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: a0 00 34 12     LOAD_ABS 0x1234")
    })

    test("レジスタベースメモリアクセスのフォーマット", () => {
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x02) // Cレジスタ
      vm.writeMemory8(2, 0x00)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: 50 02 00        LOAD_REG [C]")
    })

    test("ジャンプ命令のフォーマット（相対）", () => {
      vm.pc = 0x1000
      vm.writeMemory8(0x1000, 0x60) // JMP
      vm.writeMemory8(0x1001, 0xfc) // -4
      vm.writeMemory8(0x1002, 0xff)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      // PC + length + offset = 0x1000 + 3 + (-4) = 0x0fff
      expect(formatted).toBe("0x1000: 60 fc ff        JMP -4 (0x0fff)")
    })

    test("即値命令のフォーマット", () => {
      vm.writeMemory8(0, 0xe0) // LOAD_IMM
      vm.writeMemory8(1, 0xcd)
      vm.writeMemory8(2, 0xab)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: e0 cd ab 00 00  LOAD_IMM #0xabcd")
    })

    test("ユニット制御命令のフォーマット", () => {
      vm.writeMemory8(0, 0x90) // UNIT_MEM_READ
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x42)
      vm.writeMemory8(3, 0x10)
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: 90 00 42 10     UNIT_MEM_READ unit:0x42, addr:0x10")
    })

    test("未定義命令のフォーマット", () => {
      vm.writeMemory8(0, 0x3f) // 未定義
      const decoded = InstructionDecoder.decode(vm)
      const formatted = InstructionDecoder.format(decoded)

      expect(formatted).toBe("0x0000: 3f              <undefined 0x3f>")
    })
  })

  describe("バイト配列", () => {
    test("命令バイト列の保存", () => {
      vm.writeMemory8(0, 0xc0) // SCAN
      vm.writeMemory8(1, 0x11)
      vm.writeMemory8(2, 0x22)
      vm.writeMemory8(3, 0x33)
      vm.writeMemory8(4, 0x44)
      const decoded = InstructionDecoder.decode(vm)

      expect(Array.from(decoded.bytes)).toEqual([0xc0, 0x11, 0x22, 0x33, 0x44])
    })
  })

  describe("境界条件", () => {
    test("メモリ境界での命令読み取り", () => {
      // メモリサイズ1024での境界テスト（5バイト命令）
      vm.pc = 1020
      vm.writeMemory8(1020, 0xe0) // LOAD_IMM
      vm.writeMemory8(1021, 0xab)
      vm.writeMemory8(1022, 0xcd)
      vm.writeMemory8(1023, 0x00) // 循環
      vm.writeMemory8(0, 0x00)
      const decoded = InstructionDecoder.decode(vm)

      expect(decoded.instruction?.mnemonic).toBe("LOAD_IMM")
      expect(decoded.operands.immediate16).toBe(0xcdab)
    })
  })
})
