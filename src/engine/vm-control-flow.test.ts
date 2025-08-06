import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

describe("制御フロー命令", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(256)
  })

  describe("無条件ジャンプ", () => {
    test("JMP: 相対ジャンプ（前方）", () => {
      vm.writeMemory8(0, 0x60) // JMP
      vm.writeMemory8(1, 0x05) // offset: +5
      vm.writeMemory8(2, 0x00)
      // ジャンプ先: PC(0) + 3(命令長) + 5 = 8

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3) // ジャンプは3サイクル
      expect(vm.pc).toBe(8)
    })

    test("JMP: 相対ジャンプ（後方）", () => {
      vm.pc = 10
      vm.writeMemory8(10, 0x60) // JMP
      vm.writeMemory8(11, 0xfb) // offset: -5（2の補数）
      vm.writeMemory8(12, 0xff)
      // ジャンプ先: PC(10) + 3(命令長) + (-5) = 8

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.pc).toBe(8)
    })

    test("JMP_ABS: 絶対ジャンプ", () => {
      vm.writeMemory8(0, 0x90) // JMP_ABS
      vm.writeMemory8(1, 0x00) // 未使用
      vm.writeMemory8(2, 0x34) // address: 0x1234
      vm.writeMemory8(3, 0x12)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(0x1234)
    })
  })

  describe("条件ジャンプ", () => {
    test("JZ: ゼロフラグがセットされている時ジャンプ", () => {
      vm.zeroFlag = true
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x10) // offset: +16
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3) // ジャンプ実行
      expect(vm.pc).toBe(19) // 0 + 3 + 16
    })

    test("JZ: ゼロフラグがクリアされている時ジャンプしない", () => {
      vm.zeroFlag = false
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x10)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1) // ジャンプせず
      expect(vm.pc).toBe(3) // 次の命令へ
    })

    test("JNZ: ゼロフラグがクリアされている時ジャンプ", () => {
      vm.zeroFlag = false
      vm.writeMemory8(0, 0x62) // JNZ
      vm.writeMemory8(1, 0x08)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(11) // 0 + 3 + 8
    })

    test("JNZ: ゼロフラグがセットされている時ジャンプしない", () => {
      vm.zeroFlag = true
      vm.writeMemory8(0, 0x62) // JNZ
      vm.writeMemory8(1, 0x08)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(3)
    })

    test("JC: キャリーフラグがセットされている時ジャンプ", () => {
      vm.carryFlag = true
      vm.writeMemory8(0, 0x63) // JC
      vm.writeMemory8(1, 0x20)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(35) // 0 + 3 + 32
    })

    test("JNC: キャリーフラグがクリアされている時ジャンプ", () => {
      vm.carryFlag = false
      vm.writeMemory8(0, 0x64) // JNC
      vm.writeMemory8(1, 0x04)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(7) // 0 + 3 + 4
    })
  })

  describe("サブルーチン", () => {
    test("CALL: サブルーチン呼び出し（相対）", () => {
      vm.sp = 0x80 // スタックポインタ初期化
      vm.writeMemory8(0, 0x65) // CALL
      vm.writeMemory8(1, 0x10) // offset: +16
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(19) // 0 + 3 + 16
      expect(vm.sp).toBe(0x7e) // スタックポインタが2減少
      
      // リターンアドレスがスタックに保存されているか確認
      const returnAddr = vm.readMemory16(0x7e)
      expect(returnAddr).toBe(3) // 次の命令のアドレス
    })

    test("CALL_ABS: サブルーチン呼び出し（絶対）", () => {
      vm.sp = 0x80
      vm.writeMemory8(0, 0x91) // CALL_ABS
      vm.writeMemory8(1, 0x00) // 未使用
      vm.writeMemory8(2, 0x00) // address: 0x5000
      vm.writeMemory8(3, 0x50)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(0x5000)
      expect(vm.sp).toBe(0x7e)
      
      const returnAddr = vm.readMemory16(0x7e)
      expect(returnAddr).toBe(4) // 次の命令のアドレス
    })

    test("RET: サブルーチンから復帰", () => {
      // スタックにリターンアドレスを準備
      vm.sp = 0x7e
      vm.writeMemory16(0x7e, 0x1234)
      
      vm.writeMemory8(0, 0x66) // RET
      vm.writeMemory8(1, 0x00) // 未使用
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(0x1234)
      expect(vm.sp).toBe(0x80) // スタックポインタが2増加
    })
  })

  describe("条件分岐の実用例", () => {
    test("ループカウンタ", () => {
      // カウンタを5から0までデクリメント
      vm.setRegister("A", 5)
      
      // ループ開始位置
      vm.writeMemory8(0, 0x14) // DEC_A
      vm.writeMemory8(1, 0x62) // JNZ
      vm.writeMemory8(2, 0xfc) // offset: -4（ループ開始へ: 1 + 3 + (-4) = 0へ戻る）
      vm.writeMemory8(3, 0xff)
      vm.writeMemory8(4, 0x00) // NOP（ループ終了後）

      let _cycles = 0
      let stepCount = 0
      // 最大20ステップで安全停止
      while (stepCount < 20 && vm.pc !== 4) {
        const result = InstructionExecutor.step(vm)
        expect(result.success).toBe(true)
        _cycles += result.cycles
        stepCount++
      }

      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true)
      expect(vm.pc).toBe(4) // ループ終了後のNOP
      expect(stepCount).toBe(10) // DEC_A×5回 + JNZ×5回
    })

    test("条件付き処理スキップ", () => {
      // Aレジスタが0の場合、次の命令をスキップしてジャンプ
      vm.setRegister("A", 0)
      vm.zeroFlag = true // A=0なのでゼロフラグをセット
      
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x04) // offset: +4 (PC=0 + 3(命令長) + 4 = 7)
      vm.writeMemory8(2, 0x00)
      // スキップされる命令
      vm.writeMemory8(3, 0x10) // INC_A
      vm.writeMemory8(4, 0x10) // INC_A
      vm.writeMemory8(5, 0x10) // INC_A
      vm.writeMemory8(6, 0x10) // INC_A
      // ジャンプ先
      vm.writeMemory8(7, 0x11) // INC_B

      // JZ実行
      let result = InstructionExecutor.step(vm)
      expect(result.success).toBe(true)
      expect(vm.pc).toBe(7) // スキップ成功

      // INC_B実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(0) // Aは変更されていない
      expect(vm.getRegister("B")).toBe(1) // Bがインクリメントされた
    })

    test("サブルーチンコール統合テスト", () => {
      vm.sp = 0xff
      
      // メインルーチン
      vm.writeMemory8(0, 0x70) // MOV_A_IMM
      vm.writeMemory8(1, 0x05)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x65) // CALL
      vm.writeMemory8(4, 0x05) // offset: +5（サブルーチンへ）
      vm.writeMemory8(5, 0x00)
      vm.writeMemory8(6, 0x00) // NOP（戻り先）
      vm.writeMemory8(7, 0x00) // NOP
      vm.writeMemory8(8, 0x00) // NOP
      
      // サブルーチン（アドレス11）
      vm.writeMemory8(11, 0x18) // ADD_AB
      vm.writeMemory8(12, 0x66) // RET
      vm.writeMemory8(13, 0x00)
      vm.writeMemory8(14, 0x00)

      vm.setRegister("B", 3)

      // MOV_A_IMM実行
      let result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(5)

      // CALL実行
      result = InstructionExecutor.step(vm)
      expect(vm.pc).toBe(11) // サブルーチンへジャンプ

      // ADD_AB実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(8) // 5 + 3

      // RET実行
      const _result = InstructionExecutor.step(vm)
      expect(vm.pc).toBe(6) // 戻り先
    })
  })

  describe("境界条件テスト", () => {
    test("アドレスラップアラウンド", () => {
      vm.pc = 0xfffe
      vm.writeMemory8(0xfffe, 0x60) // JMP
      vm.writeMemory8(0xffff, 0x05) // offset
      vm.writeMemory8(0x0000, 0x00)
      // ジャンプ先: 0xfffe + 3 + 5 = 0x10006 & 0xffff = 0x0006

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.pc).toBe(0x0006)
    })

    test("スタックオーバーフロー", () => {
      vm.sp = 0x01 // スタックポインタが限界に近い
      vm.writeMemory8(0, 0x65) // CALL
      vm.writeMemory8(1, 0x10)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      // スタックオーバーフローでもアドレスがラップアラウンド
      expect(vm.sp).toBe(0xffff) // 0x01 - 2 = 0xffff
    })
  })
})