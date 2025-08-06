import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import { InstructionExecutor } from "./vm-executor"

describe("InstructionExecutor", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(1024)
  })

  describe("NOP命令", () => {
    test("NOP0実行", () => {
      vm.writeMemory8(0, 0x00) // NOP0
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(1)
    })
  })

  describe("データ移動命令", () => {
    test("XCHG（レジスタ交換）", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)
      vm.writeMemory8(0, 0x02) // XCHG

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x5678)
      expect(vm.getRegister("B")).toBe(0x1234)
      expect(vm.pc).toBe(1)
    })

    test("MOV_AB（レジスタコピー）", () => {
      vm.setRegister("A", 0xabcd)
      vm.writeMemory8(0, 0x03) // MOV_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("B")).toBe(0xabcd)
      expect(vm.pc).toBe(1)
    })

    test("MOV_SP（スタックポインタ読み取り）", () => {
      vm.sp = 0x8000
      vm.writeMemory8(0, 0x0d) // MOV_SP

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x8000)
    })

    test("SET_SP（スタックポインタ設定）", () => {
      vm.setRegister("A", 0x7fff)
      vm.writeMemory8(0, 0x0e) // SET_SP

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.sp).toBe(0x7fff)
    })

    test("MOV_A_IMM（即値ロード）", () => {
      vm.writeMemory8(0, 0x70) // MOV_A_IMM
      vm.writeMemory8(1, 0x34)
      vm.writeMemory8(2, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.pc).toBe(3)
    })
  })

  describe("算術演算命令", () => {
    test("INC_A（インクリメント）", () => {
      vm.setRegister("A", 0x00ff)
      vm.writeMemory8(0, 0x10) // INC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x0100)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("INC_A（キャリー発生）", () => {
      vm.setRegister("A", 0xffff)
      vm.writeMemory8(0, 0x10) // INC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x0000)
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(true)
    })

    test("DEC_A（デクリメント）", () => {
      vm.setRegister("A", 0x0100)
      vm.writeMemory8(0, 0x14) // DEC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x00ff)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("ADD_AB（レジスタ加算）", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)
      vm.writeMemory8(0, 0x18) // ADD_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x68ac)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("SUB_AB（レジスタ減算）", () => {
      vm.setRegister("A", 0x5678)
      vm.setRegister("B", 0x1234)
      vm.writeMemory8(0, 0x19) // SUB_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x4444)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("XOR_AB（排他的論理和）", () => {
      vm.setRegister("A", 0xff00)
      vm.setRegister("B", 0x0ff0)
      vm.writeMemory8(0, 0x1a) // XOR_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0xf0f0)
      expect(vm.carryFlag).toBe(false)
    })

    test("CMP_AB（比較）", () => {
      vm.setRegister("A", 0x1000)
      vm.setRegister("B", 0x1000)
      vm.writeMemory8(0, 0x1e) // CMP_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x1000) // 値は変更されない
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(false)
    })

    test("ADD_A_IMM（即値加算）", () => {
      vm.setRegister("A", 0x1000)
      vm.writeMemory8(0, 0x74) // ADD_A_IMM
      vm.writeMemory8(1, 0x34)
      vm.writeMemory8(2, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x2234)
      expect(vm.pc).toBe(3)
    })
  })

  describe("スタック操作命令", () => {
    test("PUSH_A", () => {
      vm.setRegister("A", 0x1234)
      vm.sp = 0xfffe
      vm.writeMemory8(0, 0x1f) // PUSH_A

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2) // スタック操作は2サイクル
      expect(vm.sp).toBe(0xfffc)
      expect(vm.readMemory16(0xfffc)).toBe(0x1234)
    })

    test("POP_A", () => {
      vm.sp = 0xfffc
      vm.writeMemory16(0xfffc, 0x5678)
      vm.writeMemory8(0, 0x2e) // POP_A

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(2)
      expect(vm.getRegister("A")).toBe(0x5678)
      expect(vm.sp).toBe(0xfffe)
    })
  })

  describe("メモリアクセス命令", () => {
    test("LOAD_A（相対アドレス）", () => {
      vm.pc = 0x100
      vm.writeMemory8(0x100, 0x40) // LOAD_A
      vm.writeMemory8(0x101, 0x10) // offset low
      vm.writeMemory8(0x102, 0x00) // offset high
      vm.writeMemory8(0x113, 0x42) // データ（0x100 + 3 + 0x10）

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(2) // メモリアクセスは2サイクル
      expect(vm.getRegister("A")).toBe(0x42)
      expect(vm.pc).toBe(0x103)
    })

    test("STORE_A（相対アドレス）", () => {
      vm.setRegister("A", 0x1234)
      vm.writeMemory8(0, 0x41) // STORE_A
      vm.writeMemory8(1, 0x10)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.readMemory8(0x13)).toBe(0x34) // 下位バイトのみ
    })

    test("LOAD_IND（インデックス）", () => {
      vm.setRegister("B", 0x200)
      vm.writeMemory8(0, 0x42) // LOAD_IND
      vm.writeMemory8(1, 0x10) // offset
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(0x210, 0x99) // B + offset

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x99)
    })

    test("LOAD_REG（レジスタベース）", () => {
      vm.setRegister("C", 0x300) // レジスタ2
      vm.writeMemory8(0x300, 0x77)
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x02) // Cレジスタ
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x77)
    })

    test("LOAD_ABS（絶対アドレス）", () => {
      vm.writeMemory8(0x1234, 0x88)
      vm.writeMemory8(0, 0x80) // LOAD_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34) // address low
      vm.writeMemory8(3, 0x12) // address high

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x88)
      expect(vm.pc).toBe(4)
    })

    test("LOAD_ABS_W（16bitロード）", () => {
      vm.writeMemory16(0x1234, 0xabcd)
      vm.writeMemory8(0, 0x82) // LOAD_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0xabcd)
    })
  })

  describe("ジャンプ命令", () => {
    test("JMP（無条件ジャンプ）", () => {
      vm.pc = 0x100
      vm.writeMemory8(0x100, 0x60) // JMP
      vm.writeMemory8(0x101, 0x10) // offset
      vm.writeMemory8(0x102, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(3) // ジャンプは3サイクル
      expect(vm.pc).toBe(0x113) // 0x100 + 3 + 0x10
    })

    test("JZ（ゼロフラグジャンプ - 成立）", () => {
      vm.zeroFlag = true
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x20)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(0x23) // 0 + 3 + 0x20
    })

    test("JZ（ゼロフラグジャンプ - 不成立）", () => {
      vm.zeroFlag = false
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x20)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(1) // ジャンプしない場合は1サイクル
      expect(vm.pc).toBe(3) // 通常のPC進行
    })

    test("CALL（サブルーチン呼び出し）", () => {
      vm.pc = 0x100
      vm.sp = 0xfffe
      vm.writeMemory8(0x100, 0x65) // CALL
      vm.writeMemory8(0x101, 0x50)
      vm.writeMemory8(0x102, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x153) // 0x100 + 3 + 0x50
      expect(vm.sp).toBe(0xfffc)
      expect(vm.readMemory16(0xfffc)).toBe(0x103) // リターンアドレス
    })

    test("RET（リターン）", () => {
      vm.sp = 0xfffc
      vm.writeMemory16(0xfffc, 0x200)
      vm.writeMemory8(0, 0x66) // RET
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x200)
      expect(vm.sp).toBe(0xfffe)
    })

    test("JMP_ABS（絶対ジャンプ）", () => {
      vm.writeMemory8(0, 0x90) // JMP_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x1234)
    })
  })

  describe("特殊命令", () => {
    test("HALT（実行停止）", () => {
      vm.writeMemory8(0, 0xff) // HALT
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.halted).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(0) // PCは進まない
    })
  })

  describe("エラー処理", () => {
    test("未定義命令", () => {
      vm.writeMemory8(0, 0x3f) // 未定義

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Undefined instruction")
    })

    test("ユニット制御命令（ユニットコンテキストなし）", () => {
      vm.writeMemory8(0, 0xa0) // UNIT_MEM_READ
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Unit control instruction requires unit context")
    })
  })

  describe("step実行", () => {
    test("単一ステップ実行", () => {
      vm.writeMemory8(0, 0x10) // INC_A
      vm.setRegister("A", 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x01)
      expect(vm.pc).toBe(1)
    })
  })

  describe("run実行", () => {
    test("複数命令の連続実行", () => {
      // プログラム: A=1, A++, A++, HALT
      vm.writeMemory8(0, 0x70) // MOV_A_IMM
      vm.writeMemory8(1, 0x01)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x10) // INC_A
      vm.writeMemory8(4, 0x10) // INC_A
      vm.writeMemory8(5, 0xff) // HALT
      vm.writeMemory8(6, 0x00)
      vm.writeMemory8(7, 0x00)
      vm.writeMemory8(8, 0x00)
      vm.writeMemory8(9, 0x00)

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(4) // 1 + 1 + 1 + 1
      expect(vm.getRegister("A")).toBe(0x03)
      expect(vm.pc).toBe(5) // HALTで停止
    })

    test("HALT命令で停止", () => {
      vm.writeMemory8(0, 0x10) // INC_A
      vm.writeMemory8(1, 0xff) // HALT
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)
      vm.writeMemory8(5, 0x00)
      vm.writeMemory8(6, 0x10) // INC_A（実行されない）

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(2) // INC_A(1) + HALT(1)
      expect(vm.getRegister("A")).toBe(0x01)
      expect(vm.pc).toBe(1) // HALTで停止
    })

    test("最大サイクル制限", () => {
      // 無限ループ
      vm.writeMemory8(0, 0x60) // JMP
      vm.writeMemory8(1, 0xfd) // -3
      vm.writeMemory8(2, 0xff)

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(12) // 3サイクル × 4回 = 12（10を超える）
    })
  })
})
