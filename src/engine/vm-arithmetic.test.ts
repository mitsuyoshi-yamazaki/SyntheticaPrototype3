import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

describe("算術演算命令", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(256)
  })

  describe("基本演算命令（1バイト）", () => {
    test("ADD_AB: A = A + B", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 50)
      vm.writeMemory8(0, 0x18) // ADD_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(150)
      expect(vm.getRegister("B")).toBe(50) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.pc).toBe(1)
    })

    test("ADD_AB: オーバーフロー時のキャリーフラグ", () => {
      vm.setRegister("A", 0xffff)
      vm.setRegister("B", 1)
      vm.writeMemory8(0, 0x18) // ADD_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0) // 16bitでラップアラウンド
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(true)
    })

    test("SUB_AB: A = A - B", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 30)
      vm.writeMemory8(0, 0x19) // SUB_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(70)
      expect(vm.getRegister("B")).toBe(30) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("SUB_AB: アンダーフロー時のキャリーフラグ", () => {
      vm.setRegister("A", 10)
      vm.setRegister("B", 20)
      vm.writeMemory8(0, 0x19) // SUB_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xfff6) // -10 = 0xFFF6
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(true) // ボロー発生
    })

    test("SUB_AB: ゼロフラグ", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 100)
      vm.writeMemory8(0, 0x19) // SUB_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(false)
    })
  })

  describe("拡張演算命令（5バイト）", () => {
    test("MUL_AB: A = (A * B) & 0xFFFF", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 200)
      vm.writeMemory8(0, 0xc2) // MUL_AB
      vm.writeMemory8(1, 0x00) // 未使用
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(20000)
      expect(vm.getRegister("B")).toBe(200) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.pc).toBe(5)
    })

    test("MUL_AB: オーバーフロー時の切り捨て", () => {
      vm.setRegister("A", 0x1000)
      vm.setRegister("B", 0x1000)
      vm.writeMemory8(0, 0xc2) // MUL_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0) // 0x1000000 & 0xFFFF = 0
      expect(vm.zeroFlag).toBe(true)
    })

    test("DIV_AB: A = A / B, B = A % B", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 30)
      vm.writeMemory8(0, 0xc3) // DIV_AB
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(3) // 100 / 30 = 3
      expect(vm.getRegister("B")).toBe(10) // 100 % 30 = 10
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("DIV_AB: ゼロ除算エラー", () => {
      vm.setRegister("A", 100)
      vm.setRegister("B", 0)
      vm.writeMemory8(0, 0xc3) // DIV_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Division by zero")
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(0) // PCは進まない
    })

    test("SHL: A = A << B（論理左シフト）", () => {
      vm.setRegister("A", 0x0f0f)
      vm.setRegister("B", 4)
      vm.writeMemory8(0, 0xc4) // SHL
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xf0f0)
      expect(vm.getRegister("B")).toBe(4) // Bは変更されない
    })

    test("SHL: シフト量は下位4ビットのみ", () => {
      vm.setRegister("A", 1)
      vm.setRegister("B", 0x12) // 下位4bit = 2
      vm.writeMemory8(0, 0xc4) // SHL

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(4) // 1 << 2 = 4
    })

    test("SHR: A = A >> B（論理右シフト）", () => {
      vm.setRegister("A", 0xf0f0)
      vm.setRegister("B", 4)
      vm.writeMemory8(0, 0xc5) // SHR
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x0f0f)
      expect(vm.getRegister("B")).toBe(4) // Bは変更されない
    })

    test("SHR: 符号なし右シフト", () => {
      vm.setRegister("A", 0x8000) // 最上位ビットが1
      vm.setRegister("B", 1)
      vm.writeMemory8(0, 0xc5) // SHR

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x4000) // 論理シフトなので0埋め
    })
  })

  describe("複合演算テスト", () => {
    test("連続した演算", () => {
      // (10 + 20) * 3 = 90
      vm.setRegister("A", 10)
      vm.setRegister("B", 20)
      
      // ADD_AB
      vm.writeMemory8(0, 0x18)
      // MOV_AB
      vm.writeMemory8(1, 0x03)
      // MOV_BA
      vm.writeMemory8(2, 0x05)
      // MOV_A_IMM (A = 3)
      vm.writeMemory8(3, 0x70)
      vm.writeMemory8(4, 0x03)
      vm.writeMemory8(5, 0x00)
      // XCHG
      vm.writeMemory8(6, 0x02)
      // MUL_AB
      vm.writeMemory8(7, 0xc2)
      vm.writeMemory8(8, 0x00)
      vm.writeMemory8(9, 0x00)
      vm.writeMemory8(10, 0x00)
      vm.writeMemory8(11, 0x00)

      // ADD_AB実行
      let result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(30)

      // MOV_AB実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("B")).toBe(30)

      // MOV_BA実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(30)

      // MOV_A_IMM実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(3)

      // XCHG実行
      result = InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(30)
      expect(vm.getRegister("B")).toBe(3)

      // MUL_AB実行
      result = InstructionExecutor.step(vm)
      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(90)
    })
  })
})