import { InstructionExecutor } from "./vm-executor"
import { VMState } from "./vm-state"

/*
## Claudeへの指令
### タスクの概要
src/engine/vm-instructions.test.ts のテストを編集せよ
目的は、命令セットの仕様を検証するのに必要なテストケースを記述することである

### ファイルの内容
このファイルに記載されているテストのテスト対象は SyntheticaScript というアセンブラ言語の命令セットで、仕様は docs/spec-v3/synthetica-script.md に記載されている

### 現在の状況
現在は、命令セットの定義が src/engine/vm-instructions.ts に実装されており、仮想CPUの状態保持は src/engine/vm-state.ts に、また命令セットの実行系が src/engine/vm-executor.ts へ実装されている状態である
しかし、完全に仕様に沿った実装とはなっていないため、網羅的なテストを記述する必要がある

## テスト実装方法
### テスト実装方法
- ルート階層の describe() に各命令セットのテストをまとめ、その中に必要な条件のテストを test() で記述する
- 命令の実行は InstructionExecutor.step() で行う
- スタックポインタ（sp）の初期値は `new VMState(メモリサイズ)` の引数値から1を引いた値（例：VMState(0x0a)の場合、sp初期値は0x09）

### テスト内容
- docs/spec-v3/synthetica-script.md の仕様をもとにテスト内容を作成する。仕様に疑問が生じた場合は、 **実装されたコードを参照するのではなく、人間に確認せよ**
  - 実装不備を洗い出すことが目的なので、 **テストが通る必要はない。** 仕様上必要とされるテスト内容を実装する
- すべてのテストケースで必ず検証する項目
  - InstructionExecutor.step() の返り値の success, error, cycles の各値の検証
  - InstructionExecutor.step() の **実行前後** の、VMのPC, 各レジスタおよびすべてのフラグの内容（ `expectVMState()` により確認する）
  - InstructionExecutor.step() の **実行前後** の、テスト対象の命令がVMに加える操作の対象（例：メモリを操作するならメモリの内容を確認する）
- 未定義命令のテスト
  - 未定義命令実行時：PCが1進む、success=true、error=undefined、cycles=1、他のレジスタ・フラグ・メモリは変化なし
  - ファイル末尾に describe.each() や test.each() を使用して一括テストを実装

### 備考
- ユニット操作に関する命令などのように、VM以外への副作用を持つ命令については、後に実装するため、テストのプレースホルダを記述するのみで良い
 */

// VMの全状態を検証するためのヘルパー関数
type VMSnapshot = {
  pc: number
  sp: number
  registerA: number
  registerB: number
  registerC: number
  registerD: number
  carryFlag: boolean
  zeroFlag: boolean
}

function expectVMState(vm: VMState, expected: VMSnapshot): void {
  expect(vm.pc).toBe(expected.pc)
  expect(vm.sp).toBe(expected.sp)
  expect(vm.getRegister("A")).toBe(expected.registerA)
  expect(vm.getRegister("B")).toBe(expected.registerB)
  expect(vm.getRegister("C")).toBe(expected.registerC)
  expect(vm.getRegister("D")).toBe(expected.registerD)
  expect(vm.carryFlag).toBe(expected.carryFlag)
  expect(vm.zeroFlag).toBe(expected.zeroFlag)
}

describe("0x00 NOP0", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x0a)
  })

  test("NOP0実行", () => {
    vm.writeMemory8(0, 0x00) // NOP0

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x00)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
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

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x01)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
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

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0x09,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0x09,
      registerA: 0x5678,
      registerB: 0x1234,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })

  test("XCHG実行 - 両方のレジスタが0の場合", () => {
    vm.writeMemory8(0, 0x02) // XCHG

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0x09,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })

  test("XCHG実行 - 16bit境界値のテスト", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0001)
    vm.writeMemory8(0, 0x02) // XCHG

    expectVMState(vm, {
      pc: 0,
      sp: 0x09,
      registerA: 0xffff,
      registerB: 0x0001,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x00)).toBe(0x02)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expectVMState(vm, {
      pc: 1,
      sp: 0x09,
      registerA: 0x0001,
      registerB: 0xffff,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    expect(vm.readMemory8(0x00)).toBe(0x02)
  })
})

// データ移動命令
describe("0x03 MOV_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_AB実行 - レジスタAをBにコピー", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0xef01)
    vm.writeMemory8(0, 0x03) // MOV_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0xabcd,
      registerD: 0xef01,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x1234,
      registerC: 0xabcd,
      registerD: 0xef01,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x04 MOV_AD", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_AD実行 - レジスタAをDにコピー", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x2345)
    vm.setRegister("C", 0x6789)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x04) // MOV_AD

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x2345,
      registerC: 0x6789,
      registerD: 0x1234,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x2345,
      registerC: 0x6789,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x05 MOV_BA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_BA実行 - レジスタBをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x05) // MOV_BA

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0xabcd,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x06 MOV_DA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_DA実行 - レジスタDをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0xabcd)
    vm.writeMemory8(0, 0x06) // MOV_DA

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x07 MOV_BC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_BC実行 - レジスタBをCにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x07) // MOV_BC

    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x08 MOV_CB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_CB実行 - レジスタCをBにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x08) // MOV_CB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x09 MOV_AC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_AC実行 - レジスタAをCにコピー", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x09) // MOV_AC

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x0A MOV_CA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_CA実行 - レジスタCをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0a) // MOV_CA

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x0B MOV_CD", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_CD実行 - レジスタCをDにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0b) // MOV_CD

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x0C MOV_DC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_DC実行 - レジスタDをCにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0xabcd)
    vm.writeMemory8(0, 0x0c) // MOV_DC

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x0D MOV_SP", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MOV_SP実行 - スタックポインタをAレジスタにコピー", () => {
    // VMState(0x10)の場合、スタックポインタの初期値は0x0f
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x0d) // MOV_SP

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xff, // スタックポインタの値
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x0E SET_SP", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("SET_SP実行 - Aレジスタをスタックポインタにコピー", () => {
    vm.setRegister("A", 0xe000)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0e) // SET_SP

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xe000,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xe000,
      registerA: 0xe000,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

// 算術演算命令
describe("0x10 INC_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("INC_A実行 - 通常の値", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0xaaaa)
    vm.setRegister("C", 0xbbbb)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x10) // INC_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0xaaaa,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1235,
      registerB: 0xaaaa,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false, // 0x1235 != 0
    })
  })

  test("INC_A実行 - オーバーフロー", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x10) // INC_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000, // 16bitでラップアラウンド
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: true,
      zeroFlag: true, // 0x0000 == 0
    })
  })
})

describe("0x11 INC_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("INC_B実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xbbbb)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x11) // INC_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0x1234,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0x1235,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false, // 0x1235 != 0
    })
  })

  test("INC_B実行 - オーバーフロー", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xffff)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x11) // INC_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xffff,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0x0000, // 16bitでラップアラウンド
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: true,
      zeroFlag: true, // 0x0000 == 0
    })
  })
})

describe("0x12 INC_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("INC_C実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0x1234)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x12) // INC_C

    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0x1234,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0x1235,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("INC_C実行 - オーバーフロー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xffff)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x12) // INC_C

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xffff,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x0000, // 16bitでラップアラウンド
      registerD: 0x3333,
      carryFlag: true,
      zeroFlag: true, // 0x0000 == 0
    })
  })
})

describe("0x13 INC_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("INC_D実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x13) // INC_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0x1234,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0x1235,
      carryFlag: false,
      zeroFlag: false, // 0x1235 != 0
    })
  })

  test("INC_D実行 - オーバーフロー", () => {
    vm.setRegister("A", 0x4444)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0xffff)
    vm.writeMemory8(0, 0x13) // INC_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x4444,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0xffff,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x4444,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0x0000, // 16bitでラップアラウンド
      carryFlag: true,
      zeroFlag: true, // 0x0000 == 0
    })
  })
})

describe("0x14 DEC_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("DEC_A実行 - 通常の値", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x14) // DEC_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1233,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false, // 通常の減算ではキャリーフラグは変更なし
      zeroFlag: false, // 0x1233 != 0
    })
  })

  test("DEC_A実行 - アンダーフロー", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x8888)
    vm.setRegister("C", 0x9999)
    vm.setRegister("D", 0xaaaa)
    vm.writeMemory8(0, 0x14) // DEC_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x8888,
      registerC: 0x9999,
      registerD: 0xaaaa,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xffff, // 16bitでラップアラウンド
      registerB: 0x8888,
      registerC: 0x9999,
      registerD: 0xaaaa,
      carryFlag: true, // アンダーフロー時はキャリーフラグがセット
      zeroFlag: false, // 0xffff != 0
    })
  })

  test("DEC_A実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x0001)
    vm.writeMemory8(0, 0x14) // DEC_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x0001,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0,
      registerC: 0,
      registerD: 0,
      carryFlag: false, // アンダーフローではないのでキャリーはクリア
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x15 DEC_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("DEC_B実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x15) // DEC_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x1234,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x1233,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false, // 0x1233 != 0
    })
  })

  test("DEC_B実行 - アンダーフロー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x0000)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x15) // DEC_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x0000,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xffff, // 16bitでラップアラウンド
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: true, // アンダーフロー時はキャリーフラグがセット
      zeroFlag: false, // 0xffff != 0
    })
  })

  test("DEC_B実行 - ゼロフラグセット", () => {
    vm.setRegister("B", 0x0001)
    vm.writeMemory8(0, 0x15) // DEC_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0,
      registerB: 0x0001,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0,
      registerB: 0x0000,
      registerC: 0,
      registerD: 0,
      carryFlag: false, // アンダーフローではないのでキャリーはクリア
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x16 DEC_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("DEC_C実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x1234)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x16) // DEC_C

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x1234,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x1233,
      registerD: 0x7777,
      carryFlag: false, // 通常のデクリメントではキャリーフラグは変わらない
      zeroFlag: false, // 0x1233 != 0
    })
  })

  test("DEC_C実行 - アンダーフロー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x0000)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x16) // DEC_C

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x0000,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xffff, // 16bitでラップアラウンド
      registerD: 0x3333,
      carryFlag: true, // アンダーフロー時はキャリーフラグがセット
      zeroFlag: false, // 0xffff != 0
    })
  })

  test("DEC_C実行 - ゼロフラグセット", () => {
    vm.setRegister("C", 0x0001)
    vm.writeMemory8(0, 0x16) // DEC_C

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0,
      registerB: 0,
      registerC: 0x0001,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0,
      registerB: 0,
      registerC: 0x0000,
      registerD: 0,
      carryFlag: false, // アンダーフローではないのでキャリーはクリア
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x17 DEC_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("DEC_D実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x17) // DEC_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x1234,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x1233,
      carryFlag: false, // 通常のデクリメントではキャリーフラグは変わらない
      zeroFlag: false, // 0x1233 != 0
    })
  })

  test("DEC_D実行 - アンダーフロー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x0000)
    vm.writeMemory8(0, 0x17) // DEC_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x0000,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xffff, // 16bitでラップアラウンド
      carryFlag: true, // アンダーフロー時はキャリーフラグがセット
      zeroFlag: false, // 0xffff != 0
    })
  })

  test("DEC_D実行 - ゼロフラグセット", () => {
    vm.setRegister("D", 0x0001)
    vm.writeMemory8(0, 0x17) // DEC_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0x0001,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0,
      registerB: 0,
      registerC: 0,
      registerD: 0x0000,
      carryFlag: false, // アンダーフローではないのでキャリーはクリア
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x18 ADD_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("ADD_AB実行 - 通常の加算", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x1111)
    vm.setRegister("D", 0x2222)
    vm.writeMemory8(0, 0x18) // ADD_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x68ac,
      registerB: 0x5678,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false, // キャリーなし
      zeroFlag: false, // 0x68ac != 0
    })
  })

  test("ADD_AB実行 - キャリー発生", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0010)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x18) // ADD_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x0010,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false, // キャリーなし
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x000f,
      registerB: 0x0010,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: true, // キャリー発生
      zeroFlag: false, // 0x0000 == 0 (桁上がりによる0)
    })
  })

  test("ADD_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0001)
    vm.writeMemory8(0, 0x18) // ADD_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x0001,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x0001,
      registerC: 0,
      registerD: 0,
      carryFlag: true, // 桁上がりも発生
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x19 SUB_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("SUB_AB実行 - 通常の減算", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)
    vm.writeMemory8(0, 0x19) // SUB_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5678,
      registerB: 0x1234,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x4444,
      registerB: 0x1234,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false, // ボローなし
      zeroFlag: false, // 0x4444 != 0
    })
  })

  test("SUB_AB実行 - ボロー発生", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x0010)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)
    vm.writeMemory8(0, 0x19) // SUB_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x0010,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xfff0,
      registerB: 0x0010,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: true, // ボロー発生
      zeroFlag: false, // 0xfff0 != 0
    })
  })

  test("SUB_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x5555)
    vm.writeMemory8(0, 0x19) // SUB_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x5555,
      registerC: 0,
      registerD: 0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x5555,
      registerC: 0,
      registerD: 0,
      carryFlag: false, // ボローは発生しない
      zeroFlag: true, // 結果が0なのでゼロフラグがセット
    })
  })
})

describe("0x1A XOR_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("XOR_AB実行 - 通常のXOR", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x3333)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)
    vm.writeMemory8(0, 0x1a) // XOR_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x3333,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x6666,
      registerB: 0x3333,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("XOR_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x9999)
    vm.setRegister("D", 0xaaaa)
    vm.writeMemory8(0, 0x1a) // XOR_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x5555,
      registerC: 0x9999,
      registerD: 0xaaaa,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x5555,
      registerC: 0x9999,
      registerD: 0xaaaa,
      carryFlag: false,
      zeroFlag: true, // ゼロフラグセット
    })
  })
})

describe("0x1B AND_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("AND_AB実行 - 通常のAND", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x0ff0)
    vm.setRegister("C", 0x1111)
    vm.setRegister("D", 0x2222)
    vm.writeMemory8(0, 0x1b) // AND_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xff00,
      registerB: 0x0ff0,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0f00,
      registerB: 0x0ff0,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("AND_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x00ff)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x1b) // AND_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xff00,
      registerB: 0x00ff,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x00ff,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: true,
    })
  })
})

describe("0x1C OR_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("OR_AB実行 - 通常のOR", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x00ff)
    vm.setRegister("C", 0x5555)
    vm.setRegister("D", 0x6666)
    vm.writeMemory8(0, 0x1c) // OR_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xff00,
      registerB: 0x00ff,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x00ff,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("OR_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x0000)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)
    vm.writeMemory8(0, 0x1c) // OR_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x0000,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0x0000,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: true,
    })
  })
})

describe("0x1D NOT_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("NOT_A実行 - ビット反転", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x9999)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)
    vm.writeMemory8(0, 0x1d) // NOT_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x9999,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0x9999,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("NOT_A実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0xcccc)
    vm.setRegister("C", 0xdddd)
    vm.setRegister("D", 0xeeee)
    vm.writeMemory8(0, 0x1d) // NOT_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0xcccc,
      registerC: 0xdddd,
      registerD: 0xeeee,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0000,
      registerB: 0xcccc,
      registerC: 0xdddd,
      registerD: 0xeeee,
      carryFlag: false,
      zeroFlag: true,
    })
  })
})

describe("0x1E CMP_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CMP_AB実行 - A > B", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xbcde)
    vm.setRegister("D", 0xf012)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5678,
      registerB: 0x1234,
      registerC: 0xbcde,
      registerD: 0xf012,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x5678, // Aは変更されない
      registerB: 0x1234,
      registerC: 0xbcde,
      registerD: 0xf012,
      carryFlag: false, // A >= Bなのでキャリーなし
      zeroFlag: false, // A != Bなのでゼロフラグなし
    })
  })

  test("CMP_AB実行 - A < B", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x3456)
    vm.setRegister("D", 0x789a)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x3456,
      registerD: 0x789a,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1234, // Aは変更されない
      registerB: 0x5678,
      registerC: 0x3456,
      registerD: 0x789a,
      carryFlag: true, // A < Bなのでキャリーセット
      zeroFlag: false,
    })
  })

  test("CMP_AB実行 - A == B", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0x5555)
    vm.setRegister("D", 0x6666)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x1234,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x1234, // Aは変更されない
      registerB: 0x1234,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false, // A >= Bなのでキャリーなし
      zeroFlag: true, // A == Bなのでゼロフラグセット
    })
  })
})

// スタック操作
describe("0x1F PUSH_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("PUSH_A実行 - 16bit値のプッシュ", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x9abc)
    vm.setRegister("D", 0xdef0)
    vm.writeMemory8(0, 0x1f) // PUSH_A

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x00) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x00) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2) // スタック操作は2サイクル

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xfd, // スタックポインタは0xFF - 2 = 0xFD
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })
    // メモリに16bit値がリトルエンディアンで格納される
    expect(vm.readMemory8(0xfd)).toBe(0x34) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x12) // 上位バイト
  })
})

describe("0x20 PUSH_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("PUSH_B実行 - 16bit値のプッシュ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x20) // PUSH_B

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x00) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x00) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0xabcd,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0xab) // 上位バイト
  })
})

describe("0x21 PUSH_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("PUSH_C実行 - 16bit値のプッシュ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x21) // PUSH_C

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x00) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x00) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0xabcd,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0xab) // 上位バイト
  })
})

describe("0x22 PUSH_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("PUSH_D実行 - 16bit値のプッシュ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0xabcd)
    vm.writeMemory8(0, 0x22) // PUSH_D

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x00) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x00) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0xab) // 上位バイト
  })
})

describe("0x2E POP_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_A実行 - 16bit値のポップ", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x2e) // POP_A
    vm.sp = 0xfd
    vm.writeMemory8(0xfd, 0x78) // 下位バイト
    vm.writeMemory8(0xfe, 0x56) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xfd,
      registerA: 0x0000,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2) // スタック操作は2サイクル

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff, // POP後のSP
      registerA: 0x5678, // 元の値が復元される
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    // メモリはクリアされない
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト
  })
})

describe("0x2F POP_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_B実行 - 16bit値のポップ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x0000)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x2f) // POP_B
    vm.sp = 0xfd
    vm.writeMemory8(0xfd, 0x78) // 下位バイト
    vm.writeMemory8(0xfe, 0x56) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0x0000,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff, // POP後のSP
      registerA: 0x1111,
      registerB: 0x5678, // 元の値が復元される
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    // メモリはクリアされない
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト
  })
})

describe("0x30 POP_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_C実行 - 16bit値のポップ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x0000)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x30) // POP_C
    vm.sp = 0xfd
    vm.writeMemory8(0xfd, 0x78) // 下位バイト
    vm.writeMemory8(0xfe, 0x56) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x0000,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff, // POP後のSP
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x5678, // 元の値が復元される
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    // メモリはクリアされない
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト
  })
})

describe("0x31 POP_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_D実行 - 16bit値のポップ", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x0000)
    vm.writeMemory8(0, 0x31) // POP_D
    vm.sp = 0xfd
    vm.writeMemory8(0xfd, 0x78) // 下位バイト
    vm.writeMemory8(0xfe, 0x56) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xfd,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x0000,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト

    const result = InstructionExecutor.step(vm)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff, // POP後のSP
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x5678, // 元の値が復元される
      carryFlag: false,
      zeroFlag: false,
    })

    // メモリはクリアされない
    expect(vm.readMemory8(0xfd)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xfe)).toBe(0x56) // 上位バイト
  })
})

// 3バイト命令 - メモリアクセス命令
describe("0x40 LOAD_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_A実行 - 相対アドレスからの8bit読み込み", () => {
    // メモリにデータを配置
    vm.writeMemory8(0x10, 0xab) // アドレス0x10に値を書き込み

    // レジスタ初期化
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)

    // LOAD_A命令（PC=0から相対オフセット0x10）
    vm.writeMemory8(0, 0x40) // LOAD_A
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x00ab, // 上位8bitは0、下位8bitに読み込んだ値
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("LOAD_A実行 - 負の相対オフセット", () => {
    vm.pc = 0x50
    vm.writeMemory8(0x40, 0xcd) // アドレス0x40に値を書き込み

    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    // LOAD_A命令（PC=0x50から相対オフセット-0x10）
    vm.writeMemory8(0x50, 0x40) // LOAD_A
    vm.writeMemory8(0x51, 0xf0) // 下位バイト
    vm.writeMemory8(0x52, 0xff) // 上位バイト（オフセット = -0x10）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0x50,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x53,
      sp: 0xff,
      registerA: 0x00cd,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x41 STORE_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_A実行 - 相対アドレスへの8bit書き込み", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x9abc)
    vm.setRegister("D", 0xdef0)

    // STORE_A命令（PC=0から相対オフセット0x20）
    vm.writeMemory8(0, 0x41) // STORE_A
    vm.writeMemory8(1, 0x20) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0020）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x20)).toBe(0x34) // Aの下位8bitのみ書き込まれる
  })
})

describe("0x42 LOAD_IND", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_IND実行 - Bレジスタベースの相対アドレスから読み込み", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0020)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    // メモリにデータを配置
    vm.writeMemory8(0x30, 0xab) // B(0x20) + offset(0x10) = 0x30

    // LOAD_IND命令
    vm.writeMemory8(0, 0x42) // LOAD_IND
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x0020,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x00ab,
      registerB: 0x0020,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x43 STORE_IND", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_IND実行 - Bレジスタベースの相対アドレスへ書き込み", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x0040)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)

    // STORE_IND命令
    vm.writeMemory8(0, 0x43) // STORE_IND
    vm.writeMemory8(1, 0x20) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0020）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x0040,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x0040,
      registerC: 0xaaaa,
      registerD: 0xbbbb,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x60)).toBe(0x34) // B(0x40) + offset(0x20) = 0x60にAの下位8bit
  })
})

describe("0x44 LOAD_A_W", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_A_W実行 - 16bit値の読み込み（リトルエンディアン）", () => {
    // メモリに16bit値を配置（リトルエンディアン）
    vm.writeMemory8(0x10, 0x34) // 下位バイト
    vm.writeMemory8(0x11, 0x12) // 上位バイト（値は0x1234）

    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0xeeee)
    vm.setRegister("C", 0xdddd)
    vm.setRegister("D", 0xcccc)

    // LOAD_A_W命令
    vm.writeMemory8(0, 0x44) // LOAD_A_W
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0xeeee,
      registerC: 0xdddd,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0xeeee,
      registerC: 0xdddd,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x45 STORE_A_W", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_A_W実行 - 16bit値の書き込み（リトルエンディアン）", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    // STORE_A_W命令
    vm.writeMemory8(0, 0x45) // STORE_A_W
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x10)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0x11)).toBe(0xab) // 上位バイト
  })
})

describe("0x50 LOAD_REG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_REG実行 - レジスタ指定アドレスから読み込み", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0080)
    vm.setRegister("C", 0x0050)
    vm.setRegister("D", 0x0030)

    // メモリにデータを配置
    vm.writeMemory8(0x80, 0xef)

    // LOAD_REG命令（Bレジスタの値から読み込み）
    vm.writeMemory8(0, 0x50) // LOAD_REG
    vm.writeMemory8(1, 0x01) // レジスタ指定 (1=B)
    vm.writeMemory8(2, 0x00) // 未使用

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x0080,
      registerC: 0x0050,
      registerD: 0x0030,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x00ef,
      registerB: 0x0080,
      registerC: 0x0050,
      registerD: 0x0030,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x51 STORE_REG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_REG実行 - レジスタ指定アドレスへ書き込み", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x0040)
    vm.setRegister("C", 0x0060)
    vm.setRegister("D", 0x0080)

    // STORE_REG命令（Cレジスタの値へ書き込み）
    vm.writeMemory8(0, 0x51) // STORE_REG
    vm.writeMemory8(1, 0x02) // レジスタ指定 (2=C)
    vm.writeMemory8(2, 0x00) // 未使用

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5678,
      registerB: 0x0040,
      registerC: 0x0060,
      registerD: 0x0080,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x5678,
      registerB: 0x0040,
      registerC: 0x0060,
      registerD: 0x0080,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x60)).toBe(0x78) // Cレジスタの値のアドレスにAの下位8bit
  })
})

describe("0x52 LOAD_IND_REG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_IND_REG実行 - 間接アドレスから読み込み", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    // 間接アドレスを設定
    vm.writeMemory8(0x50, 0x80) // アドレス0x50に0x0080をポインタとして格納
    vm.writeMemory8(0x51, 0x00)
    vm.writeMemory8(0x80, 0xab) // 実際のデータ

    // LOAD_IND_REG命令
    vm.writeMemory8(0, 0x52) // LOAD_IND_REG
    vm.writeMemory8(1, 0x50) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x0050）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x00ab,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x53 STORE_IND_REG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_IND_REG実行 - 間接アドレスへ書き込み", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x9abc)
    vm.setRegister("D", 0xdef0)

    // 間接アドレスを設定
    vm.writeMemory8(0x60, 0x90) // アドレス0x60に0x0090をポインタとして格納
    vm.writeMemory8(0x61, 0x00)

    // STORE_IND_REG命令
    vm.writeMemory8(0, 0x53) // STORE_IND_REG
    vm.writeMemory8(1, 0x60) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x0060）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x9abc,
      registerD: 0xdef0,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x90)).toBe(0x34) // 間接アドレスの先にAの下位8bit
  })
})

// 制御命令
describe("0x60 JMP", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JMP実行 - 前方ジャンプ", () => {
    vm.pc = 0x10
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)

    // JMP命令（相対オフセット+0x20）
    vm.writeMemory8(0x10, 0x60) // JMP
    vm.writeMemory8(0x11, 0x20) // 下位バイト
    vm.writeMemory8(0x12, 0x00) // 上位バイト（オフセット = 0x0020）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0x10,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x30, // 0x10 + 0x20
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("JMP実行 - 後方ジャンプ（ループ）", () => {
    vm.pc = 0x50
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)

    // JMP命令（相対オフセット-0x10）
    vm.writeMemory8(0x50, 0x60) // JMP
    vm.writeMemory8(0x51, 0xf0) // 下位バイト
    vm.writeMemory8(0x52, 0xff) // 上位バイト（オフセット = -0x10）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0x50,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x40, // 0x50 - 0x10
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x61 JZ", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JZ実行 - ゼロフラグセット時のジャンプ", () => {
    vm.zeroFlag = true
    vm.setRegister("A", 0x9999)
    vm.setRegister("B", 0xaaaa)
    vm.setRegister("C", 0xbbbb)
    vm.setRegister("D", 0xcccc)

    vm.writeMemory8(0, 0x61) // JZ
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x9999,
      registerB: 0xaaaa,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: true,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x10, // ジャンプ実行
      sp: 0xff,
      registerA: 0x9999,
      registerB: 0xaaaa,
      registerC: 0xbbbb,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: true,
    })
  })

  test("JZ実行 - ゼロフラグクリア時は次の命令へ", () => {
    vm.zeroFlag = false
    vm.setRegister("A", 0xdddd)
    vm.setRegister("B", 0xeeee)
    vm.setRegister("C", 0xffff)
    vm.setRegister("D", 0x0001)

    vm.writeMemory8(0, 0x61) // JZ
    vm.writeMemory8(1, 0x10) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xdddd,
      registerB: 0xeeee,
      registerC: 0xffff,
      registerD: 0x0001,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3, // ジャンプせず次の命令へ
      sp: 0xff,
      registerA: 0xdddd,
      registerB: 0xeeee,
      registerC: 0xffff,
      registerD: 0x0001,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x62 JNZ", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JNZ実行 - ゼロフラグクリア時のジャンプ", () => {
    vm.zeroFlag = false
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)

    vm.writeMemory8(0, 0x62) // JNZ
    vm.writeMemory8(1, 0x20) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0020）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x20, // ジャンプ実行
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: false,
      zeroFlag: false,
    })
  })

  test("JNZ実行 - ゼロフラグセット時は次の命令へ", () => {
    vm.zeroFlag = true
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)

    vm.writeMemory8(0, 0x62) // JNZ
    vm.writeMemory8(1, 0x20) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: true,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 3, // ジャンプせず次の命令へ
      sp: 0xff,
      registerA: 0x5555,
      registerB: 0x6666,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: false,
      zeroFlag: true,
    })
  })
})

describe("0x63 JC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JC実行 - キャリーフラグセット時のジャンプ", () => {
    vm.carryFlag = true
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    vm.writeMemory8(0, 0x63) // JC
    vm.writeMemory8(1, 0x30) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0030）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: true,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x30, // ジャンプ実行
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: true,
      zeroFlag: false,
    })
  })
})

describe("0x64 JNC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JNC実行 - キャリーフラグクリア時のジャンプ", () => {
    vm.carryFlag = false
    vm.setRegister("A", 0xeeee)
    vm.setRegister("B", 0xffff)
    vm.setRegister("C", 0x0001)
    vm.setRegister("D", 0x0002)

    vm.writeMemory8(0, 0x64) // JNC
    vm.writeMemory8(1, 0x40) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（オフセット = 0x0040）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xeeee,
      registerB: 0xffff,
      registerC: 0x0001,
      registerD: 0x0002,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x40, // ジャンプ実行
      sp: 0xff,
      registerA: 0xeeee,
      registerB: 0xffff,
      registerC: 0x0001,
      registerD: 0x0002,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x65 CALL", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CALL実行 - 戻り先をCレジスタに保存してジャンプ", () => {
    vm.pc = 0x20
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x0000)
    vm.setRegister("D", 0xabcd)

    vm.writeMemory8(0x20, 0x65) // CALL
    vm.writeMemory8(0x21, 0x30) // 下位バイト
    vm.writeMemory8(0x22, 0x00) // 上位バイト（オフセット = 0x0030）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0x20,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x0000,
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x50, // 0x20 + 0x30
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0x5678,
      registerC: 0x23, // 戻り先（次の命令のアドレス）
      registerD: 0xabcd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x66 JG", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JG実行 - 符号付き大なり時のジャンプ", () => {
    // CMP_ABでA > Bの状態を作る
    vm.setRegister("A", 0x0010)
    vm.setRegister("B", 0x0005)
    vm.setRegister("C", 0x1111)
    vm.setRegister("D", 0x2222)
    vm.writeMemory8(0, 0x1e) // CMP_AB
    InstructionExecutor.step(vm)

    vm.writeMemory8(1, 0x66) // JG
    vm.writeMemory8(2, 0x10) // 下位バイト
    vm.writeMemory8(3, 0x00) // 上位バイト（オフセット = 0x0010）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0010,
      registerB: 0x0005,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x11, // 1 + 0x10 = 0x11へジャンプ
      sp: 0xff,
      registerA: 0x0010,
      registerB: 0x0005,
      registerC: 0x1111,
      registerD: 0x2222,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0x67 JLE", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JLE実行 - 符号付き以下時のジャンプ", () => {
    // CMP_ABでA <= Bの状態を作る
    vm.setRegister("A", 0x0005)
    vm.setRegister("B", 0x0010)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x1e) // CMP_AB
    InstructionExecutor.step(vm)

    vm.writeMemory8(1, 0x67) // JLE
    vm.writeMemory8(2, 0x20) // 下位バイト
    vm.writeMemory8(3, 0x00) // 上位バイト（オフセット = 0x0020）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0005,
      registerB: 0x0010,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: true,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x21, // 1 + 0x20 = 0x21へジャンプ
      sp: 0xff,
      registerA: 0x0005,
      registerB: 0x0010,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: true,
      zeroFlag: false,
    })
  })
})

describe("0x68 JGE", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JGE実行 - 符号付き以上時のジャンプ", () => {
    // CMP_ABでA >= Bの状態を作る（等しい場合）
    vm.setRegister("A", 0x0010)
    vm.setRegister("B", 0x0010)
    vm.setRegister("C", 0x5555)
    vm.setRegister("D", 0x6666)
    vm.writeMemory8(0, 0x1e) // CMP_AB
    InstructionExecutor.step(vm)

    vm.writeMemory8(1, 0x68) // JGE
    vm.writeMemory8(2, 0x30) // 下位バイト
    vm.writeMemory8(3, 0x00) // 上位バイト（オフセット = 0x0030）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0x0010,
      registerB: 0x0010,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false,
      zeroFlag: true,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x31, // 1 + 0x30 = 0x31へジャンプ
      sp: 0xff,
      registerA: 0x0010,
      registerB: 0x0010,
      registerC: 0x5555,
      registerD: 0x6666,
      carryFlag: false,
      zeroFlag: true,
    })
  })
})

describe("0x69 JL", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JL実行 - 符号付き小なり時のジャンプ", () => {
    // CMP_ABでA < Bの状態を作る
    vm.setRegister("A", 0xfffe) // -2 (符号付き)
    vm.setRegister("B", 0x0001) // 1
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)
    vm.writeMemory8(0, 0x1e) // CMP_AB
    InstructionExecutor.step(vm)

    vm.writeMemory8(1, 0x69) // JL
    vm.writeMemory8(2, 0x40) // 下位バイト
    vm.writeMemory8(3, 0x00) // 上位バイト（オフセット = 0x0040）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 1,
      sp: 0xff,
      registerA: 0xfffe,
      registerB: 0x0001,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: true,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 0x41, // 1 + 0x40 = 0x41へジャンプ
      sp: 0xff,
      registerA: 0xfffe,
      registerB: 0x0001,
      registerC: 0x7777,
      registerD: 0x8888,
      carryFlag: true,
      zeroFlag: false,
    })
  })
})

// 4バイト命令
describe("0xa0 LOAD_ABS", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_ABS実行 - 絶対アドレスからの8bit読み込み", () => {
    vm.writeMemory8(0x80, 0xef) // アドレス0x80に値を書き込み

    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    // LOAD_ABS命令
    vm.writeMemory8(0, 0xa0) // LOAD_ABS
    vm.writeMemory8(1, 0x80) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x0080）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xaaaa,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 4,
      sp: 0xff,
      registerA: 0x00ef,
      registerB: 0xbbbb,
      registerC: 0xcccc,
      registerD: 0xdddd,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0xa1 STORE_ABS", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_ABS実行 - 絶対アドレスへの8bit書き込み", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    // STORE_ABS命令
    vm.writeMemory8(0, 0xa1) // STORE_ABS
    vm.writeMemory8(1, 0x90) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x0090）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 4,
      sp: 0xff,
      registerA: 0xabcd,
      registerB: 0x1111,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
    expect(vm.readMemory8(0x90)).toBe(0xcd) // Aの下位8bit
  })
})

describe("0xa2 LOAD_ABS_W", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_ABS_W実行 - 絶対アドレスからの16bit読み込み", () => {
    vm.writeMemory8(0xa0, 0x34) // 下位バイト
    vm.writeMemory8(0xa1, 0x12) // 上位バイト

    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0xeeee)
    vm.setRegister("C", 0xdddd)
    vm.setRegister("D", 0xcccc)

    // LOAD_ABS_W命令
    vm.writeMemory8(0, 0xa2) // LOAD_ABS_W
    vm.writeMemory8(1, 0xa0) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x00a0）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xffff,
      registerB: 0xeeee,
      registerC: 0xdddd,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 4,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0xeeee,
      registerC: 0xdddd,
      registerD: 0xcccc,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0xa3 STORE_ABS_W", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("STORE_ABS_W実行 - 絶対アドレスへの16bit書き込み", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x9999)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)

    // STORE_ABS_W命令
    vm.writeMemory8(0, 0xa3) // STORE_ABS_W
    vm.writeMemory8(1, 0xb0) // 下位バイト
    vm.writeMemory8(2, 0x00) // 上位バイト（アドレス = 0x00b0）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x9999)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(4)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x9999)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
    expect(vm.readMemory8(0xb0)).toBe(0x78) // 下位バイト
    expect(vm.readMemory8(0xb1)).toBe(0x56) // 上位バイト
  })
})

describe("0xb0 JMP_IND", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JMP_IND実行 - レジスタの値へジャンプ", () => {
    vm.pc = 0x10
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x9abc)
    vm.setRegister("D", 0xdef0)

    // JMP_IND命令（Bレジスタの値へジャンプ）
    vm.writeMemory8(0x10, 0xb0) // JMP_IND
    vm.writeMemory8(0x11, 0x01) // レジスタ指定（0=A, 1=B, 2=C, 3=D）
    vm.writeMemory8(0x12, 0x00) // 第3バイト（未使用）
    vm.writeMemory8(0x13, 0x00) // 第4バイト（未使用）

    expect(vm.pc).toBe(0x10)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x5678) // Bレジスタの値
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)
  })
})

describe("0xb1 JMP_ABS", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("JMP_ABS実行 - 絶対アドレスへのジャンプ", () => {
    vm.pc = 0x10
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)

    // JMP_ABS命令
    vm.writeMemory8(0x10, 0xb1) // JMP_ABS
    vm.writeMemory8(0x11, 0x34) // 下位バイト
    vm.writeMemory8(0x12, 0x12) // 上位バイト（アドレス = 0x1234）
    vm.writeMemory8(0x13, 0x00) // 第4バイト（未使用）

    expect(vm.pc).toBe(0x10)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x1234)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
  })
})

describe("0xb2 RET", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("RET実行 - Cレジスタの値にジャンプ", () => {
    vm.pc = 0x50
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x1234)
    vm.setRegister("D", 0x7777)

    vm.writeMemory8(0x50, 0xb2) // RET
    vm.writeMemory8(0x51, 0x00) // 第2バイト（未使用）
    vm.writeMemory8(0x52, 0x00) // 第3バイト（未使用）
    vm.writeMemory8(0x53, 0x00) // 第4バイト（未使用）

    expect(vm.pc).toBe(0x50)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x1234)
    expect(vm.getRegister("D")).toBe(0x7777)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x1234)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x1234)
    expect(vm.getRegister("D")).toBe(0x7777)
  })
})

// 5バイト命令
describe("0xc0 MUL_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("MUL_AB実行 - 16bit乗算", () => {
    vm.setRegister("A", 0x0010)
    vm.setRegister("B", 0x0020)
    vm.setRegister("C", 0x8888)
    vm.setRegister("D", 0x9999)

    vm.writeMemory8(0, 0xc0) // MUL_AB
    vm.writeMemory8(1, 0x00) // 第2-5バイト（未使用）
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x0010)
    expect(vm.getRegister("B")).toBe(0x0020)
    expect(vm.getRegister("C")).toBe(0x8888)
    expect(vm.getRegister("D")).toBe(0x9999)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x0200) // 0x10 * 0x20 = 0x200
    expect(vm.getRegister("B")).toBe(0x0020)
    expect(vm.getRegister("C")).toBe(0x8888)
    expect(vm.getRegister("D")).toBe(0x9999)
  })

  test("MUL_AB実行 - オーバーフロー時は下位16bitのみ保持", () => {
    vm.setRegister("A", 0x1000)
    vm.setRegister("B", 0x1000)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)

    vm.writeMemory8(0, 0xc0) // MUL_AB
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1000)
    expect(vm.getRegister("B")).toBe(0x1000)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x0000) // 0x1000000 & 0xFFFF = 0x0000
    expect(vm.getRegister("B")).toBe(0x1000)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
  })
})

describe("0xc1 DIV_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("DIV_AB実行 - 16bit除算とモジュロ", () => {
    vm.setRegister("A", 0x0064) // 100
    vm.setRegister("B", 0x0007) // 7
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    vm.writeMemory8(0, 0xc1) // DIV_AB
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x0064)
    expect(vm.getRegister("B")).toBe(0x0007)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x000e) // 100 / 7 = 14
    expect(vm.getRegister("B")).toBe(0x0002) // 100 % 7 = 2
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
  })

  test("DIV_AB実行 - ゼロ除算はエラー", () => {
    vm.setRegister("A", 0x0064)
    vm.setRegister("B", 0x0000)

    vm.writeMemory8(0, 0xc1) // DIV_AB
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error).toContain("division by zero")
  })
})

describe("0xc2 SHL", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("SHL実行 - 論理左シフト", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x0004) // 4ビットシフト
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)

    vm.writeMemory8(0, 0xc2) // SHL
    vm.writeMemory8(1, 0x00) // 第2-5バイト（未使用）
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x0004)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x2340) // 0x1234 << 4
    expect(vm.getRegister("B")).toBe(0x0004)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
  })
})

describe("0xc3 SHR", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("SHR実行 - 論理右シフト", () => {
    vm.setRegister("A", 0x8000)
    vm.setRegister("B", 0x0008) // 8ビットシフト
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    vm.writeMemory8(0, 0xc3) // SHR
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x8000)
    expect(vm.getRegister("B")).toBe(0x0008)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x0080) // 0x8000 >> 8
    expect(vm.getRegister("B")).toBe(0x0008)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
  })
})

describe("0xc4 SAR", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("SAR実行 - 算術右シフト（符号ビット保持）", () => {
    vm.setRegister("A", 0x8000) // 負数（最上位ビットが1）
    vm.setRegister("B", 0x0004) // 4ビットシフト
    vm.setRegister("C", 0xeeee)
    vm.setRegister("D", 0xffff)

    vm.writeMemory8(0, 0xc4) // SAR
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x8000)
    expect(vm.getRegister("B")).toBe(0x0004)
    expect(vm.getRegister("C")).toBe(0xeeee)
    expect(vm.getRegister("D")).toBe(0xffff)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0xf800) // 符号ビットが保持される
    expect(vm.getRegister("B")).toBe(0x0004)
    expect(vm.getRegister("C")).toBe(0xeeee)
    expect(vm.getRegister("D")).toBe(0xffff)
  })
})

describe("0xc5 CMOV_Z", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CMOV_Z実行 - ゼロフラグセット時の条件移動", () => {
    vm.zeroFlag = true
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    vm.writeMemory8(0, 0xc5) // CMOV_Z
    vm.writeMemory8(1, 0x01) // ソースレジスタ (1=B)
    vm.writeMemory8(2, 0x00) // 宛先レジスタ (0=A)
    vm.writeMemory8(3, 0x00) // 未使用
    vm.writeMemory8(4, 0x00) // 未使用

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3) // 分岐を伴わないため3サイクル

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0xabcd) // BからAへコピー
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })

  test("CMOV_Z実行 - ゼロフラグクリア時は何もしない", () => {
    vm.zeroFlag = false
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    vm.writeMemory8(0, 0xc5) // CMOV_Z
    vm.writeMemory8(1, 0x01) // ソースレジスタ (1=B)
    vm.writeMemory8(2, 0x00) // 宛先レジスタ (0=A)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x1111) // 変更されない
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0xc6 CMOV_NZ", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CMOV_NZ実行 - ゼロフラグクリア時の条件移動", () => {
    vm.zeroFlag = false
    vm.setRegister("A", 0x4444)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0xeeee)
    vm.setRegister("D", 0xffff)

    vm.writeMemory8(0, 0xc6) // CMOV_NZ
    vm.writeMemory8(1, 0x03) // ソースレジスタ (3=D)
    vm.writeMemory8(2, 0x02) // 宛先レジスタ (2=C)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x4444)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0xeeee)
    expect(vm.getRegister("D")).toBe(0xffff)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x4444)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0xffff) // DからCへコピー
    expect(vm.getRegister("D")).toBe(0xffff)
  })
})

describe("0xc7 CMOV_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CMOV_C実行 - キャリーフラグセット時の条件移動", () => {
    vm.carryFlag = true
    vm.setRegister("A", 0x6666)
    vm.setRegister("B", 0x7777)
    vm.setRegister("C", 0x8888)
    vm.setRegister("D", 0x9999)

    vm.writeMemory8(0, 0xc7) // CMOV_C
    vm.writeMemory8(1, 0x02) // ソースレジスタ (2=C)
    vm.writeMemory8(2, 0x01) // 宛先レジスタ (1=B)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x6666)
    expect(vm.getRegister("B")).toBe(0x7777)
    expect(vm.getRegister("C")).toBe(0x8888)
    expect(vm.getRegister("D")).toBe(0x9999)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x6666)
    expect(vm.getRegister("B")).toBe(0x8888) // CからBへコピー
    expect(vm.getRegister("C")).toBe(0x8888)
    expect(vm.getRegister("D")).toBe(0x9999)
  })
})

describe("0xc8 CMOV_NC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("CMOV_NC実行 - キャリーフラグクリア時の条件移動", () => {
    vm.carryFlag = false
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)

    vm.writeMemory8(0, 0xc8) // CMOV_NC
    vm.writeMemory8(1, 0x00) // ソースレジスタ (0=A)
    vm.writeMemory8(2, 0x03) // 宛先レジスタ (3=D)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xaaaa) // AからDへコピー
  })
})

describe("0xE0 LOAD_IMM", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_IMM実行 - 16bit即値のロード", () => {
    vm.setRegister("A", 0xeeee)
    vm.setRegister("B", 0xffff)
    vm.setRegister("C", 0x0000)
    vm.setRegister("D", 0x1111)

    vm.writeMemory8(0, 0xe0) // LOAD_IMM
    vm.writeMemory8(1, 0x34) // 下位バイト
    vm.writeMemory8(2, 0x12) // 上位バイト（値 = 0x1234、リトルエンディアン）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）
    vm.writeMemory8(4, 0x00) // 第5バイト（未使用）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0xeeee,
      registerB: 0xffff,
      registerC: 0x0000,
      registerD: 0x1111,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 5,
      sp: 0xff,
      registerA: 0x1234,
      registerB: 0xffff,
      registerC: 0x0000,
      registerD: 0x1111,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0xE1 LOAD_IMM_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("LOAD_IMM_B実行 - Bレジスタに16bit即値のロード", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xffff)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)

    vm.writeMemory8(0, 0xe1) // LOAD_IMM_B
    vm.writeMemory8(1, 0x78) // 下位バイト
    vm.writeMemory8(2, 0x56) // 上位バイト（値 = 0x5678、リトルエンディアン）
    vm.writeMemory8(3, 0x00) // 第4バイト（未使用）
    vm.writeMemory8(4, 0x00) // 第5バイト（未使用）

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0xffff,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 5,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x5678,
      registerC: 0x2222,
      registerD: 0x3333,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

describe("0xF0 NOP5", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("NOP5実行 - 5バイトNOP", () => {
    vm.setRegister("A", 0x4444)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0x7777)

    vm.writeMemory8(0, 0xf0) // NOP5
    vm.writeMemory8(1, 0x00) // パディング
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    // 実行前の状態を検証
    expectVMState(vm, {
      pc: 0,
      sp: 0xff,
      registerA: 0x4444,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false,
    })

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    // 実行後の状態を検証
    expectVMState(vm, {
      pc: 5,
      sp: 0xff,
      registerA: 0x4444,
      registerB: 0x5555,
      registerC: 0x6666,
      registerD: 0x7777,
      carryFlag: false,
      zeroFlag: false,
    })
  })
})

// ユニット操作命令のプレースホルダ
describe("ユニット操作命令", () => {
  test.todo("0x90 UNIT_MEM_READ - 外部ユニットメモリ読み取り")
  test.todo("0x91 UNIT_MEM_WRITE - 外部ユニットメモリ書き込み")
  test.todo("0x92 UNIT_MEM_READ_REG - レジスタ指定で外部ユニットメモリ読み取り")
  test.todo("0x93 UNIT_MEM_WRITE_REG - レジスタ指定で外部ユニットメモリ書き込み")
  test.todo("0x94 UNIT_EXISTS - ユニット存在確認")
  test.todo("0x9b UNIT_MEM_WRITE_DYN - レジスタ指定アドレスへのユニットメモリ書き込み")
})

// エネルギー計算命令のプレースホルダ
describe("エネルギー計算命令", () => {
  test.todo("0x95 ADD_E32 - 32bitエネルギー加算（1024進法）")
  test.todo("0x96 SUB_E32 - 32bitエネルギー減算（1024進法）")
  test.todo("0x97 CMP_E32 - 32bitエネルギー比較")
  test.todo("0x98 SHR_E10 - エネルギー値を1024で除算")
  test.todo("0x99 SHL_E10 - エネルギー値を1024倍")
})

// パターンマッチング命令のプレースホルダ
describe("パターンマッチング命令", () => {
  test.todo("0x80 SEARCH_F - 前方検索（可変長テンプレート）")
  test.todo("0x81 SEARCH_B - 後方検索")
  test.todo("0x82 SEARCH_F_MAX - 前方検索（最大距離指定）")
  test.todo("0x83 SEARCH_B_MAX - 後方検索（最大距離指定）")
})

// 未定義命令の一括テスト
describe("未定義命令", () => {
  // 未定義命令のオペコード一覧
  const undefinedOpcodes = [
    // 1バイト未定義命令
    0x0f,
    ...Array.from({ length: 11 }, (_, i) => 0x23 + i), // 0x23-0x2D
    ...Array.from({ length: 14 }, (_, i) => 0x32 + i), // 0x32-0x3F
    // 3バイト未定義命令
    ...Array.from({ length: 10 }, (_, i) => 0x46 + i), // 0x46-0x4F
    ...Array.from({ length: 12 }, (_, i) => 0x54 + i), // 0x54-0x5F
    ...Array.from({ length: 22 }, (_, i) => 0x6a + i), // 0x6A-0x7F
    // 4バイト未定義命令
    ...Array.from({ length: 12 }, (_, i) => 0x84 + i), // 0x84-0x8F
    ...Array.from({ length: 6 }, (_, i) => 0x9a + i), // 0x9A-0x9F
    ...Array.from({ length: 12 }, (_, i) => 0xa4 + i), // 0xA4-0xAF
    ...Array.from({ length: 13 }, (_, i) => 0xb3 + i), // 0xB3-0xBF
    // 5バイト未定義命令
    ...Array.from({ length: 23 }, (_, i) => 0xc9 + i), // 0xC9-0xDF
    ...Array.from({ length: 14 }, (_, i) => 0xe2 + i), // 0xE2-0xEF
    ...Array.from({ length: 15 }, (_, i) => 0xf1 + i), // 0xF1-0xFF
  ]

  test.each(undefinedOpcodes)("オペコード 0x%02X - PCが1増加、他の状態は変化しない", opcode => {
    const vm = new VMState(0x100)

    // 初期状態を設定
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.carryFlag = true
    vm.zeroFlag = true

    // 未定義命令をセット
    vm.writeMemory8(0, opcode)

    // 実行前の状態を記録
    const beforeState = {
      pc: 0,
      sp: 0xff,
      registerA: 0x1111,
      registerB: 0x2222,
      registerC: 0x3333,
      registerD: 0x4444,
      carryFlag: true,
      zeroFlag: true,
    }

    // 実行前の状態を検証
    expectVMState(vm, beforeState)

    // 命令実行
    const result = InstructionExecutor.step(vm)

    // エラーが返されることを確認（未定義命令）
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.cycles).toBe(1) // 未定義命令でも1サイクル消費

    // 実行後の状態を検証 - PCのみ1増加
    expectVMState(vm, {
      ...beforeState,
      pc: 1, // PCのみ増加
    })
  })
})
