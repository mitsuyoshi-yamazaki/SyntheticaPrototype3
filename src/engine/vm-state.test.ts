import { VMState } from "./vm-state"

// TODO: pcに新しい値をセットする際、メモリ外番地である場合のテスト

describe("VMState", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100) // 256バイトメモリ
  })

  describe("初期化", () => {
    test("正常な初期化", () => {
      expect(vm.programCounter).toBe(0)
      expect(vm.stackPointer).toBe(0x0ff)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.memorySize).toBe(256)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.getRegister("B")).toBe(0)
      expect(vm.getRegister("C")).toBe(0)
      expect(vm.getRegister("D")).toBe(0)
    })

    test("最大メモリサイズ", () => {
      const maxVM = new VMState(0x10000)
      expect(maxVM.memorySize).toBe(0x10000)
    })

    test("無効なメモリサイズ", () => {
      expect(() => new VMState(0)).toThrow("Invalid memory size")
      expect(() => new VMState(0x10001)).toThrow("Invalid memory size")
    })
  })

  describe("プログラムカウンタ", () => {
    test("PC読み書き", () => {
      vm.programCounter = 0x56
      expect(vm.programCounter).toBe(0x56)
    })

    test("メモリ領域を超えたPCは先頭に戻る", () => {
      vm.programCounter = 0x1234
      expect(vm.programCounter).toBe(0x34)
    })

    test("PC前進", () => {
      vm.programCounter = 0x10
      expect(vm.advancePC(3)).toBe(0x13)
      expect(vm.programCounter).toBe(0x13)
    })

    test("PCラップアラウンド", () => {
      vm.programCounter = 0xfe
      expect(vm.advancePC(3)).toBe(0x01)
    })
  })

  describe("レジスタ", () => {
    test("レジスタ名での読み書き", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)
      vm.setRegister("C", 0x9abc)
      vm.setRegister("D", 0xdef0)

      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.getRegister("B")).toBe(0x5678)
      expect(vm.getRegister("C")).toBe(0x9abc)
      expect(vm.getRegister("D")).toBe(0xdef0)
    })

    test("レジスタ16bitマスク", () => {
      vm.setRegister("A", 0x12345)
      expect(vm.getRegister("A")).toBe(0x2345)
    })
  })

  describe("メモリ", () => {
    test("8bitメモリ読み書き", () => {
      vm.writeMemory8(0x10, 0x42)
      expect(vm.readMemory8(0x10)).toBe(0x42)
    })

    test("8bitメモリマスク", () => {
      vm.writeMemory8(0x10, 0x142)
      expect(vm.readMemory8(0x10)).toBe(0x42)
    })

    test("メモリ循環バッファ", () => {
      // メモリサイズ256での循環
      vm.writeMemory8(0x100, 0x55) // アドレス0に書き込まれる
      expect(vm.readMemory8(0)).toBe(0x55)
      expect(vm.readMemory8(0x100)).toBe(0x55)
    })

    test("16bitメモリ読み書き（リトルエンディアン）", () => {
      vm.writeMemory16(0x10, 0x1234)
      expect(vm.readMemory8(0x10)).toBe(0x34) // 下位バイト
      expect(vm.readMemory8(0x11)).toBe(0x12) // 上位バイト
      expect(vm.readMemory16(0x10)).toBe(0x1234)
    })

    test("16bitメモリ境界", () => {
      // メモリサイズ256での境界テスト
      vm.writeMemory16(0xff, 0xabcd)
      expect(vm.readMemory8(0xff)).toBe(0xcd) // アドレス255
      expect(vm.readMemory8(0x00)).toBe(0xab) // アドレス0（循環）
      expect(vm.readMemory16(0xff)).toBe(0xabcd)
    })

    test("メモリブロック読み書き", () => {
      const data = new Uint8Array([0x11, 0x22, 0x33, 0x44])
      vm.writeMemoryBlock(0x20, data)

      const read = vm.readMemoryBlock(0x20, 4)
      expect(Array.from(read)).toEqual([0x11, 0x22, 0x33, 0x44])
    })
  })

  describe("スタック操作", () => {
    test("スタックポインタ読み書き", () => {
      vm.stackPointer = 0x80
      expect(vm.stackPointer).toBe(0x80)
    })

    test("メモリ領域を超えたPCは先頭に戻る", () => {
      vm.stackPointer = 0x2345
      expect(vm.stackPointer).toBe(0x45)
    })

    test("スタックプッシュ", () => {
      vm.stackPointer = 0xfe
      expect(vm.readMemory16(0xfc)).toBe(0x0000)

      vm.push16(0x1234)

      expect(vm.stackPointer).toBe(0xfc)
      expect(vm.readMemory16(0xfc)).toBe(0x1234)
    })

    test("スタックアンダーフロー", () => {
      vm.stackPointer = 0x00
      expect(vm.readMemory16(0xfe)).toBe(0x0000)

      vm.push16(0x1234)

      expect(vm.stackPointer).toBe(0xfe)
      expect(vm.readMemory16(0xfe)).toBe(0x1234)
    })

    test("スタックポップ", () => {
      vm.stackPointer = 0xfc
      vm.writeMemory16(0xfc, 0x5678)
      const value = vm.pop16()
      expect(value).toBe(0x5678)
      expect(vm.stackPointer).toBe(0xfe)
    })

    test("スタックオーバーフロー", () => {
      vm.stackPointer = 0x100
      vm.writeMemory16(0x00, 0x6789)
      const value = vm.pop16()
      expect(value).toBe(0x6789)
      expect(vm.stackPointer).toBe(0x02)
    })

    test("スタック操作の連続", () => {
      vm.push16(0x1111)
      vm.push16(0x2222)
      vm.push16(0x3333)

      expect(vm.pop16()).toBe(0x3333)
      expect(vm.pop16()).toBe(0x2222)
      expect(vm.pop16()).toBe(0x1111)
    })
  })

  describe("フラグ", () => {
    test("ゼロフラグ更新", () => {
      vm.updateZeroFlag(0)
      expect(vm.zeroFlag).toBe(true)

      vm.updateZeroFlag(1)
      expect(vm.zeroFlag).toBe(false)

      vm.updateZeroFlag(0x10000) // 16bitマスク後は0
      expect(vm.zeroFlag).toBe(true)
    })

    test("キャリーフラグ（加算）", () => {
      vm.updateCarryFlagAdd(0xffff)
      expect(vm.carryFlag).toBe(false)

      vm.updateCarryFlagAdd(0x10000)
      expect(vm.carryFlag).toBe(true)
    })

    test("キャリーフラグ（減算）", () => {
      vm.updateCarryFlagSub(10, 5)
      expect(vm.carryFlag).toBe(false)

      vm.updateCarryFlagSub(5, 10)
      expect(vm.carryFlag).toBe(true)
    })
  })

  describe("クローンとリセット", () => {
    test("VM状態のクローン", () => {
      // 状態を設定
      vm.programCounter = 0x12
      vm.stackPointer = 0x80
      vm.zeroFlag = true
      vm.carryFlag = true
      vm.setRegister("A", 0xaaaa)
      vm.setRegister("B", 0xbbbb)
      vm.writeMemory8(0x10, 0x42)
      vm.writeMemory8(0x20, 0x84)

      // クローン作成
      const cloned = vm.clone()

      // 同じ状態か確認
      expect(cloned.programCounter).toBe(0x12)
      expect(cloned.stackPointer).toBe(0x80)
      expect(cloned.zeroFlag).toBe(true)
      expect(cloned.carryFlag).toBe(true)
      expect(cloned.getRegister("A")).toBe(0xaaaa)
      expect(cloned.getRegister("B")).toBe(0xbbbb)
      expect(cloned.readMemory8(0x10)).toBe(0x42)
      expect(cloned.readMemory8(0x20)).toBe(0x84)

      // 独立性確認
      cloned.programCounter = 0x5678
      cloned.setRegister("A", 0x1111)
      expect(vm.programCounter).toBe(0x12)
      expect(vm.getRegister("A")).toBe(0xaaaa)
    })

    test("VM状態のリセット", () => {
      // 状態を変更
      vm.programCounter = 0x1234
      vm.stackPointer = 0x8000
      vm.zeroFlag = true
      vm.carryFlag = true
      vm.setRegister("A", 0xaaaa)
      vm.writeMemory8(0x10, 0x42)

      // リセット
      vm.reset()

      // 初期状態に戻る
      expect(vm.programCounter).toBe(0)
      expect(vm.stackPointer).toBe(0xffff)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.readMemory8(0x10)).toBe(0)
    })
  })

  describe("デバッグ表示", () => {
    test("文字列表現", () => {
      vm.programCounter = 0x1234
      vm.stackPointer = 0x8000
      vm.zeroFlag = true
      vm.carryFlag = false
      vm.setRegister("A", 0x1111)
      vm.setRegister("B", 0x2222)
      vm.setRegister("C", 0x3333)
      vm.setRegister("D", 0x4444)

      // TODO:
      // const str = vm.toString()
      // expect(str).toContain("PC: 0x1234")
      // expect(str).toContain("SP: 0x8000")
      // expect(str).toContain("Flags: Z-")
      // expect(str).toContain("A: 0x1111")
      // expect(str).toContain("B: 0x2222")
      // expect(str).toContain("C: 0x3333")
      // expect(str).toContain("D: 0x4444")
    })
  })
})
