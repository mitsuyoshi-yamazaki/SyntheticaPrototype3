import { VMState } from "./vm-state"

// TODO: pcに新しい値をセットする際、メモリ外番地である場合のテスト

describe("VMState", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(0x100) // 256バイトメモリ
  })

  describe("初期化", () => {
    test("正常な初期化", () => {
      expect(vm.pc).toBe(0)
      expect(vm.sp).toBe(0x0ff)
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
      vm.pc = 0x1234
      expect(vm.pc).toBe(0x1234)
    })

    test("PC 16bitマスク", () => {
      vm.pc = 0x12345
      expect(vm.pc).toBe(0x2345)
    })

    test("PC前進", () => {
      vm.pc = 0x1000
      expect(vm.advancePC(3)).toBe(0x1003)
      expect(vm.pc).toBe(0x1003)
    })

    test("PCラップアラウンド", () => {
      vm.pc = 0xfffe
      expect(vm.advancePC(3)).toBe(0x0001)
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

    test("レジスタインデックスでの読み書き", () => {
      vm.setRegisterByIndex(0, 0x1111) // A
      vm.setRegisterByIndex(1, 0x2222) // B
      vm.setRegisterByIndex(2, 0x3333) // C
      vm.setRegisterByIndex(3, 0x4444) // D

      expect(vm.getRegisterByIndex(0)).toBe(0x1111)
      expect(vm.getRegisterByIndex(1)).toBe(0x2222)
      expect(vm.getRegisterByIndex(2)).toBe(0x3333)
      expect(vm.getRegisterByIndex(3)).toBe(0x4444)
    })

    test("無効なレジスタインデックス", () => {
      expect(() => vm.getRegisterByIndex(-1)).toThrow("Invalid register index")
      expect(() => vm.getRegisterByIndex(4)).toThrow("Invalid register index")
      expect(() => vm.setRegisterByIndex(-1, 0)).toThrow("Invalid register index")
      expect(() => vm.setRegisterByIndex(4, 0)).toThrow("Invalid register index")
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
      vm.sp = 0x8000
      expect(vm.sp).toBe(0x8000)
    })

    test("スタックプッシュ", () => {
      vm.sp = 0xfffe
      vm.push16(0x1234)
      expect(vm.sp).toBe(0xfffc)
      expect(vm.readMemory16(0xfffc)).toBe(0x1234)
    })

    test("スタックポップ", () => {
      vm.sp = 0xfffc
      vm.writeMemory16(0xfffc, 0x5678)
      const value = vm.pop16()
      expect(value).toBe(0x5678)
      expect(vm.sp).toBe(0xfffe)
    })

    test("スタック操作の連続", () => {
      vm.push16(0x1111)
      vm.push16(0x2222)
      vm.push16(0x3333)

      expect(vm.pop16()).toBe(0x3333)
      expect(vm.pop16()).toBe(0x2222)
      expect(vm.pop16()).toBe(0x1111)
    })

    test("スタックアンダーフロー（循環）", () => {
      vm.sp = 0x0001
      vm.push16(0xabcd)
      expect(vm.sp).toBe(0xffff)
      expect(vm.readMemory16(0xffff)).toBe(0xabcd)
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
      vm.pc = 0x1234
      vm.sp = 0x8000
      vm.zeroFlag = true
      vm.carryFlag = true
      vm.setRegister("A", 0xaaaa)
      vm.setRegister("B", 0xbbbb)
      vm.writeMemory8(0x10, 0x42)
      vm.writeMemory8(0x20, 0x84)

      // クローン作成
      const cloned = vm.clone()

      // 同じ状態か確認
      expect(cloned.pc).toBe(0x1234)
      expect(cloned.sp).toBe(0x8000)
      expect(cloned.zeroFlag).toBe(true)
      expect(cloned.carryFlag).toBe(true)
      expect(cloned.getRegister("A")).toBe(0xaaaa)
      expect(cloned.getRegister("B")).toBe(0xbbbb)
      expect(cloned.readMemory8(0x10)).toBe(0x42)
      expect(cloned.readMemory8(0x20)).toBe(0x84)

      // 独立性確認
      cloned.pc = 0x5678
      cloned.setRegister("A", 0x1111)
      expect(vm.pc).toBe(0x1234)
      expect(vm.getRegister("A")).toBe(0xaaaa)
    })

    test("VM状態のリセット", () => {
      // 状態を変更
      vm.pc = 0x1234
      vm.sp = 0x8000
      vm.zeroFlag = true
      vm.carryFlag = true
      vm.setRegister("A", 0xaaaa)
      vm.writeMemory8(0x10, 0x42)

      // リセット
      vm.reset()

      // 初期状態に戻る
      expect(vm.pc).toBe(0)
      expect(vm.sp).toBe(0xffff)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
      expect(vm.getRegister("A")).toBe(0)
      expect(vm.readMemory8(0x10)).toBe(0)
    })
  })

  describe("デバッグ表示", () => {
    test("文字列表現", () => {
      vm.pc = 0x1234
      vm.sp = 0x8000
      vm.zeroFlag = true
      vm.carryFlag = false
      vm.setRegister("A", 0x1111)
      vm.setRegister("B", 0x2222)
      vm.setRegister("C", 0x3333)
      vm.setRegister("D", 0x4444)

      const str = vm.toString()
      expect(str).toContain("PC: 0x1234")
      expect(str).toContain("SP: 0x8000")
      expect(str).toContain("Flags: Z-")
      expect(str).toContain("A: 0x1111")
      expect(str).toContain("B: 0x2222")
      expect(str).toContain("C: 0x3333")
      expect(str).toContain("D: 0x4444")
    })
  })
})
