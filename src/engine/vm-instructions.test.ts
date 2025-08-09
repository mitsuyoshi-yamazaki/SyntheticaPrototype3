import { InstructionExecutor } from "./vm-executor"
import { VMState } from "./vm-state"

/*
## 概要
命令セットのテスト

## テスト実装方法
- ルート階層の describe() に各命令セットのテストをまとめ、その中に必要な条件のテストを test() で記述する
- 命令の実行は InstructionExecutor.step() で行う

## テスト内容
- 実装ではなく、 docs/spec-v3/synthetica-script.md の仕様をもとにテスト内容を作成する
- 以下の内容は各 test() で必ず検証する
  - InstructionExecutor.step() の返り値の success, error, cycles の各値の検証
  - InstructionExecutor.step() の実行前後の、VMのPCと各レジスタの内容
  - InstructionExecutor.step() の実行前後の、テスト対象の命令がVMに加える操作の対象（例：メモリを操作するならメモリの内容を確認する）

## 備考
- ユニット操作に関する命令などのように、VM以外への副作用を持つ命令については、後に実装するため、コメントでテストのプレースホルダを記述するのみとする

 */

describe("0x00 NOP0", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x0a)
  })

  test("NOP0実行", () => {
    vm.writeMemory8(0, 0x00) // NOP0

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x00)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x00)
  })
})

describe("0x01 NOP1", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x0a)
  })

  test("NOP1実行", () => {
    vm.writeMemory8(0, 0x01) // NOP1

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x01)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x01)
  })
})

describe("0x02 XCHG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x0a)
  })

  test("XCHG実行 - レジスタAとBの値を交換", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.writeMemory8(0, 0x02) // XCHG

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })

  test("XCHG実行 - 両方のレジスタが0の場合", () => {
    vm.writeMemory8(0, 0x02) // XCHG

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0)
    expect(vm.getRegister("B")).toBe(0)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })

  test("XCHG実行 - 16bit境界値のテスト", () => {
    vm.setRegister("A", 0xFFFF)
    vm.setRegister("B", 0x0001)
    vm.writeMemory8(0, 0x02) // XCHG

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xFFFF)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0001)
    expect(vm.getRegister("B")).toBe(0xFFFF)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })
})
