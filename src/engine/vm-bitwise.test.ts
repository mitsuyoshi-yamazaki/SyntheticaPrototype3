import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

describe("ビット操作命令", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(256)
  })

  describe("基本ビット操作命令（1バイト）", () => {
    test("AND_AB: A = A AND B", () => {
      vm.setRegister("A", 0xff0f)
      vm.setRegister("B", 0x0fff)
      vm.writeMemory8(0, 0x1b) // AND_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(0x0f0f)
      expect(vm.getRegister("B")).toBe(0x0fff) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.pc).toBe(1)
    })

    test("AND_AB: ゼロフラグ", () => {
      vm.setRegister("A", 0xff00)
      vm.setRegister("B", 0x00ff)
      vm.writeMemory8(0, 0x1b) // AND_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true)
    })

    test("OR_AB: A = A OR B", () => {
      vm.setRegister("A", 0xff00)
      vm.setRegister("B", 0x00ff)
      vm.writeMemory8(0, 0x1c) // OR_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(0xffff)
      expect(vm.getRegister("B")).toBe(0x00ff) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("XOR_AB: A = A XOR B", () => {
      vm.setRegister("A", 0xffff)
      vm.setRegister("B", 0xf0f0)
      vm.writeMemory8(0, 0x1a) // XOR_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(0x0f0f)
      expect(vm.getRegister("B")).toBe(0xf0f0) // Bは変更されない
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("XOR_AB: 同じ値でゼロ", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x1234)
      vm.writeMemory8(0, 0x1a) // XOR_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true)
    })

    test("NOT_A: A = NOT A", () => {
      vm.setRegister("A", 0x0f0f)
      vm.writeMemory8(0, 0x1d) // NOT_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.getRegister("A")).toBe(0xf0f0)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("NOT_A: ゼロの否定", () => {
      vm.setRegister("A", 0)
      vm.writeMemory8(0, 0x1d) // NOT_A

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xffff)
      expect(vm.zeroFlag).toBe(false)
    })
  })

  describe("即値ビット操作命令（3バイト）", () => {
    test("AND_A_IMM: A = A AND immediate", () => {
      vm.setRegister("A", 0xffff)
      vm.writeMemory8(0, 0x76) // AND_A_IMM
      vm.writeMemory8(1, 0xf0) // 下位バイト
      vm.writeMemory8(2, 0x0f) // 上位バイト
      // リトルエンディアンなので即値は 0x0ff0

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2) // 即値命令は2サイクル
      expect(vm.getRegister("A")).toBe(0x0ff0) // 0xffff & 0x0ff0 = 0x0ff0
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.pc).toBe(3)
    })

    test("OR_A_IMM: A = A OR immediate", () => {
      vm.setRegister("A", 0x0f0f)
      vm.writeMemory8(0, 0x77) // OR_A_IMM
      vm.writeMemory8(1, 0xf0)
      vm.writeMemory8(2, 0xf0)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xffff)
      expect(vm.zeroFlag).toBe(false)
    })

    test("XOR_A_IMM: A = A XOR immediate", () => {
      vm.setRegister("A", 0xffff)
      vm.writeMemory8(0, 0x78) // XOR_A_IMM
      vm.writeMemory8(1, 0xff)
      vm.writeMemory8(2, 0xff)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true)
    })
  })

  describe("ビットマスク応用例", () => {
    test("特定ビットのクリア", () => {
      // ビット4-7をクリア
      vm.setRegister("A", 0xabcd)
      vm.writeMemory8(0, 0x76) // AND_A_IMM
      vm.writeMemory8(1, 0x0f) // マスク: 0xff0f
      vm.writeMemory8(2, 0xff)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xab0d)
    })

    test("特定ビットのセット", () => {
      // ビット8-11をセット
      vm.setRegister("A", 0xa0cd)
      vm.writeMemory8(0, 0x77) // OR_A_IMM
      vm.writeMemory8(1, 0x00) // マスク: 0x0f00
      vm.writeMemory8(2, 0x0f)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xa0cd | 0x0f00) // 0xafcd
    })

    test("特定ビットの反転", () => {
      // 下位8ビットを反転
      vm.setRegister("A", 0xab12)
      vm.writeMemory8(0, 0x78) // XOR_A_IMM
      vm.writeMemory8(1, 0xff) // マスク: 0x00ff
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xabed)
    })

    test("ビットテスト（AND後のゼロフラグ）", () => {
      // ビット12が立っているかテスト
      vm.setRegister("A", 0x1000)
      vm.setRegister("B", 0x1000)
      vm.writeMemory8(0, 0x1b) // AND_AB

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1000)
      expect(vm.zeroFlag).toBe(false) // ビットが立っている

      // ビット12が立っていない場合
      vm.setRegister("A", 0x0fff)
      vm.setRegister("B", 0x1000)
      vm.writeMemory8(1, 0x1b) // AND_AB

      const result2 = InstructionExecutor.step(vm)

      expect(result2.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.zeroFlag).toBe(true) // ビットが立っていない
    })
  })
})
