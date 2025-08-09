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
  - 実装不備を洗い出すことが目的なので、 **テストが通る必要はない。** 仕様上必要とされるテスト内容を実装する
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
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0001)
    vm.writeMemory8(0, 0x02) // XCHG

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
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
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0)
    expect(vm.getRegister("D")).toBe(0)
    expect(vm.readMemory8(0x00)).toBe(0x02)
  })
})

// データ移動命令
describe("0x03 MOV_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_AB実行 - レジスタAをBにコピー", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0xef01)
    vm.writeMemory8(0, 0x03) // MOV_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0xef01)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0xef01)
  })
})

describe("0x04 MOV_AD", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_AD実行 - レジスタAをDにコピー", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x2345)
    vm.setRegister("C", 0x6789)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x04) // MOV_AD

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x2345)
    expect(vm.getRegister("C")).toBe(0x6789)
    expect(vm.getRegister("D")).toBe(0x1234)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x2345)
    expect(vm.getRegister("C")).toBe(0x6789)
    expect(vm.getRegister("D")).toBe(0xabcd)
  })
})

describe("0x05 MOV_BA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_BA実行 - レジスタBをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x05) // MOV_BA

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x06 MOV_DA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_DA実行 - レジスタDをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0xabcd)
    vm.writeMemory8(0, 0x06) // MOV_DA

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0xabcd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0xabcd)
  })
})

describe("0x07 MOV_BC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_BC実行 - レジスタBをCにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0xabcd)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x07) // MOV_BC

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x08 MOV_CB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_CB実行 - レジスタCをBにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x08) // MOV_CB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x09 MOV_AC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_AC実行 - レジスタAをCにコピー", () => {
    vm.setRegister("A", 0xabcd)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x09) // MOV_AC

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x0a MOV_CA", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_CA実行 - レジスタCをAにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0a) // MOV_CA

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x0b MOV_CD", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_CD実行 - レジスタCをDにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0xabcd)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0b) // MOV_CD

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0xabcd)
  })
})

describe("0x0c MOV_DC", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_DC実行 - レジスタDをCにコピー", () => {
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0xabcd)
    vm.writeMemory8(0, 0x0c) // MOV_DC

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0xabcd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0xabcd)
  })
})

describe("0x0d MOV_SP", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("MOV_SP実行 - スタックポインタをAレジスタにコピー", () => {
    // スタックポインタの初期値は仕様書より0xFFFF
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x0d) // MOV_SP

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xffff) // スタックポインタの初期値
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
  })
})

describe("0x0e SET_SP", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("SET_SP実行 - Aレジスタをスタックポインタにコピー", () => {
    vm.setRegister("A", 0xe000)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x0e) // SET_SP

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xe000)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xe000)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
    
    // スタックポインタが設定されたことを確認するため、MOV_SPで読み出してテスト
    vm.writeMemory8(1, 0x0d) // MOV_SP
    InstructionExecutor.step(vm)
    expect(vm.getRegister("A")).toBe(0xe000)
  })
})

// 算術演算命令
describe("0x10 INC_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("INC_A実行 - 通常の値", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0xaaaa)
    vm.setRegister("C", 0xbbbb)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x10) // INC_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0xaaaa)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1235)
    expect(vm.getRegister("B")).toBe(0xaaaa)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)
  })

  test("INC_A実行 - オーバーフロー", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x10) // INC_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000) // 16bitでラップアラウンド
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x11 INC_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("INC_B実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xbbbb)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x11) // INC_B

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0x1235)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)
  })
})

describe("0x12 INC_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("INC_C実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0x1234)
    vm.setRegister("D", 0xcccc)
    vm.writeMemory8(0, 0x12) // INC_C

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0x1234)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0x1235)
    expect(vm.getRegister("D")).toBe(0xcccc)
  })
})

describe("0x13 INC_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("INC_D実行 - 通常の値", () => {
    vm.setRegister("A", 0xaaaa)
    vm.setRegister("B", 0xbbbb)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x13) // INC_D

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0x1234)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0x1235)
  })
})

describe("0x14 DEC_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("DEC_A実行 - 通常の値", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x14) // DEC_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1233)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)
  })

  test("DEC_A実行 - アンダーフロー", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x8888)
    vm.setRegister("C", 0x9999)
    vm.setRegister("D", 0xaaaa)
    vm.writeMemory8(0, 0x14) // DEC_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x8888)
    expect(vm.getRegister("C")).toBe(0x9999)
    expect(vm.getRegister("D")).toBe(0xaaaa)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xffff) // 16bitでラップアラウンド
    expect(vm.getRegister("B")).toBe(0x8888)
    expect(vm.getRegister("C")).toBe(0x9999)
    expect(vm.getRegister("D")).toBe(0xaaaa)
  })
})

describe("0x15 DEC_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("DEC_B実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0x6666)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x15) // DEC_B

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x1233)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)
  })
})

describe("0x16 DEC_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("DEC_C実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x1234)
    vm.setRegister("D", 0x7777)
    vm.writeMemory8(0, 0x16) // DEC_C

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x1234)
    expect(vm.getRegister("D")).toBe(0x7777)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x1233)
    expect(vm.getRegister("D")).toBe(0x7777)
  })
})

describe("0x17 DEC_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("DEC_D実行 - 通常の値", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x6666)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x1234)
    vm.writeMemory8(0, 0x17) // DEC_D

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x1234)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x1233)
  })
})

describe("0x18 ADD_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("ADD_AB実行 - 通常の加算", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x1111)
    vm.setRegister("D", 0x2222)
    vm.writeMemory8(0, 0x18) // ADD_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x68ac)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)
    expect(vm.carryFlag).toBe(false) // キャリーなし
  })

  test("ADD_AB実行 - キャリー発生", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0x0001)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x18) // ADD_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
    expect(vm.carryFlag).toBe(true) // キャリー発生
  })
})

describe("0x19 SUB_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("SUB_AB実行 - 通常の減算", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)
    vm.writeMemory8(0, 0x19) // SUB_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x4444)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
    expect(vm.carryFlag).toBe(false) // ボローなし
  })

  test("SUB_AB実行 - ボロー発生", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x0001)
    vm.setRegister("C", 0xcccc)
    vm.setRegister("D", 0xdddd)
    vm.writeMemory8(0, 0x19) // SUB_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
    expect(vm.carryFlag).toBe(true) // ボロー発生
  })
})

describe("0x1a XOR_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("XOR_AB実行 - 通常のXOR", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x3333)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)
    vm.writeMemory8(0, 0x1a) // XOR_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x3333)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x6666)
    expect(vm.getRegister("B")).toBe(0x3333)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)
    expect(vm.zeroFlag).toBe(false)
  })

  test("XOR_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x5555)
    vm.setRegister("C", 0x9999)
    vm.setRegister("D", 0xaaaa)
    vm.writeMemory8(0, 0x1a) // XOR_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x9999)
    expect(vm.getRegister("D")).toBe(0xaaaa)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x9999)
    expect(vm.getRegister("D")).toBe(0xaaaa)
    expect(vm.zeroFlag).toBe(true) // ゼロフラグセット
  })
})

describe("0x1b AND_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("AND_AB実行 - 通常のAND", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x0ff0)
    vm.setRegister("C", 0x1111)
    vm.setRegister("D", 0x2222)
    vm.writeMemory8(0, 0x1b) // AND_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xff00)
    expect(vm.getRegister("B")).toBe(0x0ff0)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0f00)
    expect(vm.getRegister("B")).toBe(0x0ff0)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)
    expect(vm.zeroFlag).toBe(false)
  })

  test("AND_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x00ff)
    vm.setRegister("C", 0x3333)
    vm.setRegister("D", 0x4444)
    vm.writeMemory8(0, 0x1b) // AND_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xff00)
    expect(vm.getRegister("B")).toBe(0x00ff)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x00ff)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
    expect(vm.zeroFlag).toBe(true)
  })
})

describe("0x1c OR_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("OR_AB実行 - 通常のOR", () => {
    vm.setRegister("A", 0xff00)
    vm.setRegister("B", 0x00ff)
    vm.setRegister("C", 0x5555)
    vm.setRegister("D", 0x6666)
    vm.writeMemory8(0, 0x1c) // OR_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xff00)
    expect(vm.getRegister("B")).toBe(0x00ff)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x00ff)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)
    expect(vm.zeroFlag).toBe(false)
  })

  test("OR_AB実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0x0000)
    vm.setRegister("B", 0x0000)
    vm.setRegister("C", 0x7777)
    vm.setRegister("D", 0x8888)
    vm.writeMemory8(0, 0x1c) // OR_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x0000)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x0000)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)
    expect(vm.zeroFlag).toBe(true)
  })
})

describe("0x1d NOT_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("NOT_A実行 - ビット反転", () => {
    vm.setRegister("A", 0x5555)
    vm.setRegister("B", 0x9999)
    vm.setRegister("C", 0xaaaa)
    vm.setRegister("D", 0xbbbb)
    vm.writeMemory8(0, 0x1d) // NOT_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x9999)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0x9999)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
    expect(vm.zeroFlag).toBe(false)
  })

  test("NOT_A実行 - ゼロフラグセット", () => {
    vm.setRegister("A", 0xffff)
    vm.setRegister("B", 0xcccc)
    vm.setRegister("C", 0xdddd)
    vm.setRegister("D", 0xeeee)
    vm.writeMemory8(0, 0x1d) // NOT_A

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0xcccc)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xeeee)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0xcccc)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xeeee)
    expect(vm.zeroFlag).toBe(true)
  })
})

describe("0x1e CMP_AB", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x10)
  })

  test("CMP_AB実行 - A > B", () => {
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0xbcde)
    vm.setRegister("D", 0xf012)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xbcde)
    expect(vm.getRegister("D")).toBe(0xf012)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x5678) // Aは変更されない
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0xbcde)
    expect(vm.getRegister("D")).toBe(0xf012)
    expect(vm.carryFlag).toBe(false) // A >= Bなのでキャリーなし
    expect(vm.zeroFlag).toBe(false) // A != Bなのでゼロフラグなし
  })

  test("CMP_AB実行 - A < B", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x5678)
    vm.setRegister("C", 0x3456)
    vm.setRegister("D", 0x789a)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x3456)
    expect(vm.getRegister("D")).toBe(0x789a)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1234) // Aは変更されない
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x3456)
    expect(vm.getRegister("D")).toBe(0x789a)
    expect(vm.carryFlag).toBe(true) // A < Bなのでキャリーセット
  })

  test("CMP_AB実行 - A == B", () => {
    vm.setRegister("A", 0x1234)
    vm.setRegister("B", 0x1234)
    vm.setRegister("C", 0x5555)
    vm.setRegister("D", 0x6666)
    vm.writeMemory8(0, 0x1e) // CMP_AB

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(1)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1234) // Aは変更されない
    expect(vm.getRegister("B")).toBe(0x1234)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)
    expect(vm.zeroFlag).toBe(true) // A == Bなのでゼロフラグセット
    expect(vm.carryFlag).toBe(false) // A >= Bなのでキャリーなし
  })
})

// スタック操作
describe("0x1f PUSH_A", () => {
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2) // スタック操作は2サイクル

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)
    // スタックポインタは0xFFFF - 2 = 0xFFFD
    // メモリに16bit値がリトルエンディアンで格納される
    expect(vm.readMemory8(0xfffd)).toBe(0x34) // 下位バイト
    expect(vm.readMemory8(0xfffe)).toBe(0x12) // 上位バイト
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xabcd)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
    expect(vm.readMemory8(0xfffd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfffe)).toBe(0xab) // 上位バイト
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0xabcd)
    expect(vm.getRegister("D")).toBe(0x3333)
    expect(vm.readMemory8(0xfffd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfffe)).toBe(0xab) // 上位バイト
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0xabcd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0xabcd)
    expect(vm.readMemory8(0xfffd)).toBe(0xcd) // 下位バイト
    expect(vm.readMemory8(0xfffe)).toBe(0xab) // 上位バイト
  })
})

describe("0x2e POP_A", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_A実行 - 16bit値のポップ", () => {
    // まずPUSHして値をスタックに入れる
    vm.setRegister("A", 0x5678)
    vm.setRegister("B", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x1f) // PUSH_A
    InstructionExecutor.step(vm)
    
    // Aを別の値に変更
    vm.setRegister("A", 0x0000)
    vm.writeMemory8(1, 0x2e) // POP_A

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0000)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2) // スタック操作は2サイクル

    expect(vm.pc).toBe(2)
    expect(vm.getRegister("A")).toBe(0x5678) // 元の値が復元される
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x2f POP_B", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_B実行 - 16bit値のポップ", () => {
    // まずPUSHして値をスタックに入れる
    vm.setRegister("B", 0x5678)
    vm.setRegister("A", 0x1111)
    vm.setRegister("C", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x20) // PUSH_B
    InstructionExecutor.step(vm)
    
    // Bを別の値に変更
    vm.setRegister("B", 0x0000)
    vm.writeMemory8(1, 0x2f) // POP_B

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x0000)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(2)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x5678) // 元の値が復元される
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x30 POP_C", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_C実行 - 16bit値のポップ", () => {
    // まずPUSHして値をスタックに入れる
    vm.setRegister("C", 0x5678)
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("D", 0x3333)
    vm.writeMemory8(0, 0x21) // PUSH_C
    InstructionExecutor.step(vm)
    
    // Cを別の値に変更
    vm.setRegister("C", 0x0000)
    vm.writeMemory8(1, 0x30) // POP_C

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x0000)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(2)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x5678) // 元の値が復元される
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0x31 POP_D", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100)
  })

  test("POP_D実行 - 16bit値のポップ", () => {
    // まずPUSHして値をスタックに入れる
    vm.setRegister("D", 0x5678)
    vm.setRegister("A", 0x1111)
    vm.setRegister("B", 0x2222)
    vm.setRegister("C", 0x3333)
    vm.writeMemory8(0, 0x22) // PUSH_D
    InstructionExecutor.step(vm)
    
    // Dを別の値に変更
    vm.setRegister("D", 0x0000)
    vm.writeMemory8(1, 0x31) // POP_D

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x0000)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(2)

    expect(vm.pc).toBe(2)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x5678) // 元の値が復元される
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x00ab) // 上位8bitは0、下位8bitに読み込んだ値
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
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

    expect(vm.pc).toBe(0x50)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x53)
    expect(vm.getRegister("A")).toBe(0x00cd)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x0020)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x00ab)
    expect(vm.getRegister("B")).toBe(0x0020)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x0040)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x0040)
    expect(vm.getRegister("C")).toBe(0xaaaa)
    expect(vm.getRegister("D")).toBe(0xbbbb)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xcccc)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x0080)
    expect(vm.getRegister("C")).toBe(0x0050)
    expect(vm.getRegister("D")).toBe(0x0030)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x00ef)
    expect(vm.getRegister("B")).toBe(0x0080)
    expect(vm.getRegister("C")).toBe(0x0050)
    expect(vm.getRegister("D")).toBe(0x0030)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x0040)
    expect(vm.getRegister("C")).toBe(0x0060)
    expect(vm.getRegister("D")).toBe(0x0080)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x5678)
    expect(vm.getRegister("B")).toBe(0x0040)
    expect(vm.getRegister("C")).toBe(0x0060)
    expect(vm.getRegister("D")).toBe(0x0080)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(4) // 間接アドレスは4サイクル

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x00ab)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(4) // 間接アドレスは4サイクル

    expect(vm.pc).toBe(3)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x9abc)
    expect(vm.getRegister("D")).toBe(0xdef0)
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

    expect(vm.pc).toBe(0x10)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x30) // 0x10 + 0x20
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
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

    expect(vm.pc).toBe(0x50)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x40) // 0x50 - 0x10
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x9999)
    expect(vm.getRegister("B")).toBe(0xaaaa)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x10) // ジャンプ実行
    expect(vm.getRegister("A")).toBe(0x9999)
    expect(vm.getRegister("B")).toBe(0xaaaa)
    expect(vm.getRegister("C")).toBe(0xbbbb)
    expect(vm.getRegister("D")).toBe(0xcccc)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xdddd)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xffff)
    expect(vm.getRegister("D")).toBe(0x0001)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3) // ジャンプせず次の命令へ
    expect(vm.getRegister("A")).toBe(0xdddd)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xffff)
    expect(vm.getRegister("D")).toBe(0x0001)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x20) // ジャンプ実行
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x2222)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(3) // ジャンプせず次の命令へ
    expect(vm.getRegister("A")).toBe(0x5555)
    expect(vm.getRegister("B")).toBe(0x6666)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x30) // ジャンプ実行
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xeeee)
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0x0001)
    expect(vm.getRegister("D")).toBe(0x0002)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x40) // ジャンプ実行
    expect(vm.getRegister("A")).toBe(0xeeee)
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0x0001)
    expect(vm.getRegister("D")).toBe(0x0002)
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

    expect(vm.pc).toBe(0x20)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x0000)
    expect(vm.getRegister("D")).toBe(0xabcd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x50) // 0x20 + 0x30
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x23) // 戻り先（次の命令のアドレス）
    expect(vm.getRegister("D")).toBe(0xabcd)
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

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0010)
    expect(vm.getRegister("B")).toBe(0x0005)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x11) // 1 + 0x10 = 0x11へジャンプ
    expect(vm.getRegister("A")).toBe(0x0010)
    expect(vm.getRegister("B")).toBe(0x0005)
    expect(vm.getRegister("C")).toBe(0x1111)
    expect(vm.getRegister("D")).toBe(0x2222)
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

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0005)
    expect(vm.getRegister("B")).toBe(0x0010)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x21) // 1 + 0x20 = 0x21へジャンプ
    expect(vm.getRegister("A")).toBe(0x0005)
    expect(vm.getRegister("B")).toBe(0x0010)
    expect(vm.getRegister("C")).toBe(0x3333)
    expect(vm.getRegister("D")).toBe(0x4444)
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

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0x0010)
    expect(vm.getRegister("B")).toBe(0x0010)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x31) // 1 + 0x30 = 0x31へジャンプ
    expect(vm.getRegister("A")).toBe(0x0010)
    expect(vm.getRegister("B")).toBe(0x0010)
    expect(vm.getRegister("C")).toBe(0x5555)
    expect(vm.getRegister("D")).toBe(0x6666)
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

    expect(vm.pc).toBe(1)
    expect(vm.getRegister("A")).toBe(0xfffe)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(0x41) // 1 + 0x40 = 0x41へジャンプ
    expect(vm.getRegister("A")).toBe(0xfffe)
    expect(vm.getRegister("B")).toBe(0x0001)
    expect(vm.getRegister("C")).toBe(0x7777)
    expect(vm.getRegister("D")).toBe(0x8888)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(6) // 絶対アドレス命令は高コスト

    expect(vm.pc).toBe(4)
    expect(vm.getRegister("A")).toBe(0x00ef)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xdddd)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(6) // 絶対アドレス命令は高コスト

    expect(vm.pc).toBe(4)
    expect(vm.getRegister("A")).toBe(0xabcd)
    expect(vm.getRegister("B")).toBe(0x1111)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xffff)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xcccc)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(6)

    expect(vm.pc).toBe(4)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0xeeee)
    expect(vm.getRegister("C")).toBe(0xdddd)
    expect(vm.getRegister("D")).toBe(0xcccc)
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
    expect(result.cycles).toBe(6)

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
    expect(result.cycles).toBe(4)

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
    expect(result.cycles).toBe(6) // 絶対アドレス命令は高コスト

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
    expect(result.cycles).toBe(4)

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
    expect(result.cycles).toBe(5)

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
    expect(result.cycles).toBe(5)

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
    expect(result.cycles).toBe(5)

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
    expect(result.cycles).toBe(4) // ビット操作のため4サイクル

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
    expect(result.cycles).toBe(4)

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
    expect(result.cycles).toBe(4)

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
    expect(result.cycles).toBe(3)

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
    expect(result.cycles).toBe(3)

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
    expect(result.cycles).toBe(3)

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
    expect(result.cycles).toBe(3)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0xaaaa)
    expect(vm.getRegister("B")).toBe(0xbbbb)
    expect(vm.getRegister("C")).toBe(0xcccc)
    expect(vm.getRegister("D")).toBe(0xaaaa) // AからDへコピー
  })
})

describe("0xe0 LOAD_IMM", () => {
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0xeeee)
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0x0000)
    expect(vm.getRegister("D")).toBe(0x1111)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(5)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x1234)
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0x0000)
    expect(vm.getRegister("D")).toBe(0x1111)
  })
})

describe("0xe1 LOAD_IMM_B", () => {
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0xffff)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(5)

    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(0x1111)
    expect(vm.getRegister("B")).toBe(0x5678)
    expect(vm.getRegister("C")).toBe(0x2222)
    expect(vm.getRegister("D")).toBe(0x3333)
  })
})

describe("0xf0 NOP5", () => {
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

    expect(vm.pc).toBe(0)
    expect(vm.getRegister("A")).toBe(0x4444)
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)

    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.cycles).toBe(5)

    expect(vm.pc).toBe(5) // PCが5バイト進む
    expect(vm.getRegister("A")).toBe(0x4444) // レジスタは変更されない
    expect(vm.getRegister("B")).toBe(0x5555)
    expect(vm.getRegister("C")).toBe(0x6666)
    expect(vm.getRegister("D")).toBe(0x7777)
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
