import { InstructionExecutor } from "./vm-executor"
import { VMState } from "./vm-state"

/*
## 概要
命令セットのテスト

## テスト実装方法
- ルート階層の describe() に各命令セットのテストをまとめ、その中に必要な条件のテストを test() で記述する
- 命令の実行は InstructionExecutor.step() で行う

## テスト内容
- 以下の内容は各 test() で必ず検証する
  - InstructionExecutor.step() の返り値の success, error, cycles の各値の検証
  - InstructionExecutor.step() の実行前後の、VMのPCと各レジスタの内容
  - InstructionExecutor.step() の実行前後の、テスト対象の命令がVMに加える操作の対象（例：メモリを操作するならメモリの内容を確認する）

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
