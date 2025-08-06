import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

describe("スタック操作命令", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(256)
    vm.sp = 0x80 // スタックポインタ初期化
  })

  describe("プッシュ命令", () => {
    test("PUSH_A: Aレジスタをスタックにプッシュ", () => {
      vm.setRegister("A", 0x1234)
      vm.writeMemory8(0, 0x1f) // PUSH_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2) // スタック操作は2サイクル
      expect(vm.sp).toBe(0x7e) // スタックポインタが2減少
      expect(vm.readMemory16(0x7e)).toBe(0x1234)
      expect(vm.pc).toBe(1)
    })

    test("PUSH_B: Bレジスタをスタックにプッシュ", () => {
      vm.setRegister("B", 0xabcd)
      vm.writeMemory8(0, 0x20) // PUSH_B

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0x7e)
      expect(vm.readMemory16(0x7e)).toBe(0xabcd)
    })

    test("PUSH_C: Cレジスタをスタックにプッシュ", () => {
      vm.setRegister("C", 0x5678)
      vm.writeMemory8(0, 0x21) // PUSH_C

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0x7e)
      expect(vm.readMemory16(0x7e)).toBe(0x5678)
    })

    test("PUSH_D: Dレジスタをスタックにプッシュ", () => {
      vm.setRegister("D", 0xef01)
      vm.writeMemory8(0, 0x22) // PUSH_D

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0x7e)
      expect(vm.readMemory16(0x7e)).toBe(0xef01)
    })
  })

  describe("ポップ命令", () => {
    test("POP_A: スタックからAレジスタにポップ", () => {
      // スタックに値を準備
      vm.sp = 0x7e
      vm.writeMemory16(0x7e, 0x9876)

      vm.writeMemory8(0, 0x2e) // POP_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2)
      expect(vm.getRegister("A")).toBe(0x9876)
      expect(vm.sp).toBe(0x80) // スタックポインタが2増加
      expect(vm.pc).toBe(1)
    })

    test("POP_B: スタックからBレジスタにポップ", () => {
      vm.sp = 0x7e
      vm.writeMemory16(0x7e, 0x4321)

      vm.writeMemory8(0, 0x2f) // POP_B

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("B")).toBe(0x4321)
      expect(vm.sp).toBe(0x80)
    })

    test("POP_C: スタックからCレジスタにポップ", () => {
      vm.sp = 0x7e
      vm.writeMemory16(0x7e, 0xbcde)

      vm.writeMemory8(0, 0x30) // POP_C

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("C")).toBe(0xbcde)
      expect(vm.sp).toBe(0x80)
    })

    test("POP_D: スタックからDレジスタにポップ", () => {
      vm.sp = 0x7e
      vm.writeMemory16(0x7e, 0xfade)

      vm.writeMemory8(0, 0x31) // POP_D

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("D")).toBe(0xfade)
      expect(vm.sp).toBe(0x80)
    })
  })

  describe("プッシュ・ポップの組み合わせ", () => {
    test("複数のプッシュとポップ", () => {
      vm.setRegister("A", 0x1111)
      vm.setRegister("B", 0x2222)
      vm.setRegister("C", 0x3333)
      vm.setRegister("D", 0x4444)

      // A, B, C, Dの順でプッシュ
      vm.writeMemory8(0, 0x1f) // PUSH_A
      vm.writeMemory8(1, 0x20) // PUSH_B
      vm.writeMemory8(2, 0x21) // PUSH_C
      vm.writeMemory8(3, 0x22) // PUSH_D

      // 実行
      InstructionExecutor.step(vm)
      expect(vm.sp).toBe(0x7e)
      expect(vm.readMemory16(0x7e)).toBe(0x1111)

      InstructionExecutor.step(vm)
      expect(vm.sp).toBe(0x7c)
      expect(vm.readMemory16(0x7c)).toBe(0x2222)

      InstructionExecutor.step(vm)
      expect(vm.sp).toBe(0x7a)
      expect(vm.readMemory16(0x7a)).toBe(0x3333)

      InstructionExecutor.step(vm)
      expect(vm.sp).toBe(0x78)
      expect(vm.readMemory16(0x78)).toBe(0x4444)

      // D, C, B, Aの順でポップ（逆順）
      vm.writeMemory8(4, 0x2e) // POP_A
      vm.writeMemory8(5, 0x2f) // POP_B
      vm.writeMemory8(6, 0x30) // POP_C
      vm.writeMemory8(7, 0x31) // POP_D

      InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(0x4444) // 最後にプッシュしたD
      expect(vm.sp).toBe(0x7a)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("B")).toBe(0x3333) // C
      expect(vm.sp).toBe(0x7c)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("C")).toBe(0x2222) // B
      expect(vm.sp).toBe(0x7e)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("D")).toBe(0x1111) // 最初にプッシュしたA
      expect(vm.sp).toBe(0x80)
    })

    test("レジスタ値の交換", () => {
      vm.setRegister("A", 0xaaaa)
      vm.setRegister("B", 0xbbbb)

      // AとBの値を交換
      vm.writeMemory8(0, 0x1f) // PUSH_A
      vm.writeMemory8(1, 0x20) // PUSH_B
      vm.writeMemory8(2, 0x2e) // POP_A
      vm.writeMemory8(3, 0x2f) // POP_B

      InstructionExecutor.step(vm) // PUSH_A
      InstructionExecutor.step(vm) // PUSH_B
      InstructionExecutor.step(vm) // POP_A
      InstructionExecutor.step(vm) // POP_B

      expect(vm.getRegister("A")).toBe(0xbbbb)
      expect(vm.getRegister("B")).toBe(0xaaaa)
    })

    test("一時保存と復元", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)

      // A, Bの値を保存
      vm.writeMemory8(0, 0x1f) // PUSH_A
      vm.writeMemory8(1, 0x20) // PUSH_B

      // 別の値を設定
      vm.writeMemory8(2, 0x70) // MOV_A_IMM
      vm.writeMemory8(3, 0xff)
      vm.writeMemory8(4, 0xff)
      vm.writeMemory8(5, 0x71) // MOV_B_IMM
      vm.writeMemory8(6, 0x00)
      vm.writeMemory8(7, 0x00)

      // 元の値を復元
      vm.writeMemory8(8, 0x2f) // POP_B
      vm.writeMemory8(9, 0x2e) // POP_A

      InstructionExecutor.step(vm) // PUSH_A
      InstructionExecutor.step(vm) // PUSH_B
      InstructionExecutor.step(vm) // MOV_A_IMM
      InstructionExecutor.step(vm) // MOV_B_IMM

      expect(vm.getRegister("A")).toBe(0xffff)
      expect(vm.getRegister("B")).toBe(0x0000)

      InstructionExecutor.step(vm) // POP_B
      InstructionExecutor.step(vm) // POP_A

      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.getRegister("B")).toBe(0x5678)
    })
  })

  describe("境界条件テスト", () => {
    test("スタックアンダーフロー（メモリ境界）", () => {
      vm.sp = 0x02
      vm.setRegister("A", 0xdead)

      vm.writeMemory8(0, 0x1f) // PUSH_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0x00)
      expect(vm.readMemory16(0x00)).toBe(0xdead)
    })

    test("スタックアンダーフロー（ラップアラウンド）", () => {
      vm.sp = 0x00
      vm.setRegister("A", 0xbeef)

      vm.writeMemory8(0, 0x1f) // PUSH_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0xfffe) // ラップアラウンド
      expect(vm.readMemory16(0xfe)).toBe(0xbeef) // メモリサイズ256でのアドレス
    })

    test("スタックオーバーフロー", () => {
      vm.sp = 0xfe

      vm.writeMemory16(0xfe, 0xcafe)
      vm.writeMemory8(0, 0x2e) // POP_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0x0100) // 0xfe + 2 = 0x100（16bitレジスタ）
      expect(vm.getRegister("A")).toBe(0xcafe)
    })

    test("メモリ境界でのワードアクセス", () => {
      // メモリ最後尾にスタックポインタを設定
      vm.sp = 0xff
      vm.setRegister("A", 0x1234)

      vm.writeMemory8(0, 0x1f) // PUSH_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.sp).toBe(0xfd)
      // メモリがラップアラウンドする
      expect(vm.readMemory8(0xfd)).toBe(0x34)
      expect(vm.readMemory8(0xfe)).toBe(0x12)
    })
  })

  describe("スタック使用パターン", () => {
    test("関数呼び出しパターン", () => {
      // 関数呼び出し前にレジスタを保存
      vm.setRegister("A", 0x1111)
      vm.setRegister("B", 0x2222)
      vm.setRegister("C", 0x3333)
      vm.setRegister("D", 0x4444)

      // callee-saved registers
      vm.writeMemory8(0, 0x21) // PUSH_C
      vm.writeMemory8(1, 0x22) // PUSH_D

      // 関数内で自由に使用
      vm.writeMemory8(2, 0x72) // MOV_C_IMM
      vm.writeMemory8(3, 0x99)
      vm.writeMemory8(4, 0x99)
      vm.writeMemory8(5, 0x73) // MOV_D_IMM
      vm.writeMemory8(6, 0x88)
      vm.writeMemory8(7, 0x88)

      // 関数終了時に復元
      vm.writeMemory8(8, 0x31) // POP_D
      vm.writeMemory8(9, 0x30) // POP_C

      // 実行
      for (let i = 0; i < 6; i++) {
        InstructionExecutor.step(vm)
      }

      expect(vm.getRegister("A")).toBe(0x1111) // 変更なし
      expect(vm.getRegister("B")).toBe(0x2222) // 変更なし
      expect(vm.getRegister("C")).toBe(0x3333) // 復元された
      expect(vm.getRegister("D")).toBe(0x4444) // 復元された
      expect(vm.sp).toBe(0x80) // 元の位置
    })

    test("ローカル変数スペースの確保", () => {
      const initialSp = vm.sp

      // スタックに4ワード分のスペースを確保（手動で調整）
      vm.sp = initialSp - 8

      expect(vm.sp).toBe(initialSp - 8)

      // ローカル変数への書き込み（スタック相対）
      vm.setRegister("A", 0x1234)
      vm.writeMemory8(0, 0x1f) // PUSH_A

      InstructionExecutor.step(vm)
      expect(vm.readMemory16(vm.sp)).toBe(0x1234)
    })
  })
})
