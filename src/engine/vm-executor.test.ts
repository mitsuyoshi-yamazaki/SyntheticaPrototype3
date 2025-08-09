import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import { InstructionExecutor } from "./vm-executor"
import type { ObjectId, Assembler, Computer } from "@/types/game"

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

    test("LOAD_IMM（即値ロード）", () => {
      vm.writeMemory8(0, 0xe0) // LOAD_IMM
      vm.writeMemory8(1, 0x34)
      vm.writeMemory8(2, 0x12)
      vm.writeMemory8(3, 0x00) // unused
      vm.writeMemory8(4, 0x00) // unused

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.pc).toBe(5)
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

    // ADD_A_IMM is not in the specification - removed
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
      vm.writeMemory8(0, 0xa0) // LOAD_ABS
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
      vm.writeMemory8(0, 0xa2) // LOAD_ABS_W
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
      vm.setRegister("C", 0x200)
      vm.writeMemory8(0, 0xb2) // RET
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x200)
    })

    test("JMP_ABS（絶対ジャンプ）", () => {
      vm.writeMemory8(0, 0xb1) // JMP_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x1234)
    })
  })

  describe("拡張演算命令", () => {
    describe("SHL命令", () => {
      test("論理左シフトが正しく動作する", () => {
        vm.setRegister("A", 0x1234)
        vm.setRegister("B", 2) // 2ビットシフト
        vm.writeMemory8(0, 0xc2) // SHL
        vm.writeMemory8(1, 0x00) // unused
        vm.writeMemory8(2, 0x00) // unused
        vm.writeMemory8(3, 0x00) // unused
        vm.writeMemory8(4, 0x00) // unused

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x48d0) // 0x1234 << 2
        expect(vm.pc).toBe(5) // 5バイト命令
      })

      test("キャリーフラグが正しく設定される", () => {
        vm.setRegister("A", 0x8000) // MSBが1
        vm.setRegister("B", 1) // 1ビットシフト
        vm.writeMemory8(0, 0xc2) // SHL
        vm.writeMemory8(1, 0x00)
        vm.writeMemory8(2, 0x00)
        vm.writeMemory8(3, 0x00)
        vm.writeMemory8(4, 0x00)

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x0000) // 0x8000 << 1 = 0x10000 -> 0x0000 (16bit)
        expect(vm.carryFlag).toBe(true) // キャリー発生
        expect(vm.zeroFlag).toBe(true) // 結果は0
      })

      test("シフト量が大きい場合は結果が0になる", () => {
        vm.setRegister("A", 0xffff)
        vm.setRegister("B", 16) // 16ビットシフト
        vm.writeMemory8(0, 0xc2) // SHL
        vm.writeMemory8(1, 0x00)
        vm.writeMemory8(2, 0x00)
        vm.writeMemory8(3, 0x00)
        vm.writeMemory8(4, 0x00)

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x0000) // 16ビット以上のシフトは0
        expect(vm.zeroFlag).toBe(true)
      })
    })

    describe("MUL_AB命令", () => {
      test("16bit乗算が正しく動作する", () => {
        vm.setRegister("A", 0x0010) // 16
        vm.setRegister("B", 0x0020) // 32
        vm.writeMemory8(0, 0xc0) // MUL_AB
        vm.writeMemory8(1, 0x00) // unused
        vm.writeMemory8(2, 0x00) // unused
        vm.writeMemory8(3, 0x00) // unused
        vm.writeMemory8(4, 0x00) // unused

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x0200) // 16 * 32 = 512
        expect(vm.pc).toBe(5) // 5バイト命令
      })

      test("オーバーフローが正しく処理される", () => {
        vm.setRegister("A", 0x8000) // 32768
        vm.setRegister("B", 0x0004) // 4
        vm.writeMemory8(0, 0xc0) // MUL_AB
        vm.writeMemory8(1, 0x00)
        vm.writeMemory8(2, 0x00)
        vm.writeMemory8(3, 0x00)
        vm.writeMemory8(4, 0x00)

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x0000) // 131072 & 0xFFFF = 0
        expect(vm.zeroFlag).toBe(true)
      })
    })

    describe("SHR命令", () => {
      test("論理右シフトが正しく動作する", () => {
        vm.setRegister("A", 0x1234)
        vm.setRegister("B", 2) // 2ビットシフト
        vm.writeMemory8(0, 0xc3) // SHR
        vm.writeMemory8(1, 0x00) // unused
        vm.writeMemory8(2, 0x00) // unused
        vm.writeMemory8(3, 0x00) // unused
        vm.writeMemory8(4, 0x00) // unused

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x048d) // 0x1234 >> 2
        expect(vm.pc).toBe(5) // 5バイト命令
      })

      test("シフト量が大きい場合は結果が0になる", () => {
        vm.setRegister("A", 0xffff)
        vm.setRegister("B", 16) // 16ビットシフト
        vm.writeMemory8(0, 0xc3) // SHR
        vm.writeMemory8(1, 0x00)
        vm.writeMemory8(2, 0x00)
        vm.writeMemory8(3, 0x00)
        vm.writeMemory8(4, 0x00)

        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.getRegister("A")).toBe(0x0000) // 16ビット以上のシフトは0
        expect(vm.zeroFlag).toBe(true)
      })
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
      vm.writeMemory8(0, 0x90) // UNIT_MEM_READ
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
      // プログラム: A=1, A++, A++, JMP 0 (無限ループ)
      vm.writeMemory8(0, 0xe0) // LOAD_IMM
      vm.writeMemory8(1, 0x01)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)
      vm.writeMemory8(5, 0x10) // INC_A
      vm.writeMemory8(6, 0x10) // INC_A
      vm.writeMemory8(7, 0x60) // JMP
      vm.writeMemory8(8, 0xf5) // -11 (0x100 - 11 = 0xf5, ジャンプして0x00に戻る)
      vm.writeMemory8(9, 0xff)

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(10) // 最大サイクルまで実行
      expect(vm.getRegister("A")).toBeGreaterThan(0x02) // 複数回実行される
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
