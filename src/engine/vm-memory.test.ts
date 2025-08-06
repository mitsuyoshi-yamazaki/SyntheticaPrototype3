import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

describe("メモリ操作命令", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(256)
  })

  describe("相対アドレスメモリアクセス", () => {
    test("LOAD_A: PC相対読み込み（バイト）", () => {
      vm.writeMemory8(10, 0x42) // 読み込むデータ

      vm.writeMemory8(0, 0x40) // LOAD_A
      vm.writeMemory8(1, 0x07) // offset: +7
      vm.writeMemory8(2, 0x00)
      // 読み込みアドレス: PC(0) + 3(命令長) + 7 = 10

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2) // メモリアクセスは2サイクル
      expect(vm.getRegister("A")).toBe(0x42)
      expect(vm.pc).toBe(3)
    })

    test("STORE_A: PC相対書き込み（バイト）", () => {
      vm.setRegister("A", 0x7f)

      vm.writeMemory8(0, 0x41) // STORE_A
      vm.writeMemory8(1, 0x05) // offset: +5
      vm.writeMemory8(2, 0x00)
      // 書き込みアドレス: PC(0) + 3(命令長) + 5 = 8

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2)
      expect(vm.readMemory8(8)).toBe(0x7f)
      expect(vm.pc).toBe(3)
    })

    test("LOAD_A_W: PC相対読み込み（ワード）", () => {
      vm.writeMemory16(20, 0x1234)

      vm.writeMemory8(0, 0x44) // LOAD_A_W
      vm.writeMemory8(1, 0x11) // offset: +17
      vm.writeMemory8(2, 0x00)
      // 読み込みアドレス: PC(0) + 3(命令長) + 17 = 20

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1234)
    })

    test("STORE_A_W: PC相対書き込み（ワード）", () => {
      vm.setRegister("A", 0xabcd)

      vm.writeMemory8(0, 0x45) // STORE_A_W
      vm.writeMemory8(1, 0x0a) // offset: +10
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory16(13)).toBe(0xabcd)
    })
  })

  describe("インデックスアドレスメモリアクセス", () => {
    test("LOAD_IND: Bレジスタ + オフセット読み込み", () => {
      vm.setRegister("B", 0x50)
      vm.writeMemory8(0x58, 0x99) // B(0x50) + offset(8) = 0x58

      vm.writeMemory8(0, 0x42) // LOAD_IND
      vm.writeMemory8(1, 0x08) // offset: +8
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x99)
    })

    test("STORE_IND: Bレジスタ + オフセット書き込み", () => {
      vm.setRegister("A", 0x55)
      vm.setRegister("B", 0x40)

      vm.writeMemory8(0, 0x43) // STORE_IND
      vm.writeMemory8(1, 0x10) // offset: +16
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory8(0x50)).toBe(0x55) // B(0x40) + 16 = 0x50
    })
  })

  describe("レジスタベースメモリアクセス", () => {
    test("LOAD_REG: レジスタ値をアドレスとして読み込み", () => {
      vm.setRegister("A", 0x30)
      vm.setRegister("B", 0x40)
      vm.setRegister("C", 0x50)
      vm.setRegister("D", 0x60)

      vm.writeMemory8(0x40, 0xaa) // Bレジスタが指すアドレス

      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x01) // register index: 1 (B)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xaa)
    })

    test("STORE_REG: レジスタ値をアドレスとして書き込み", () => {
      vm.setRegister("A", 0x77)
      vm.setRegister("C", 0x80)

      vm.writeMemory8(0, 0x51) // STORE_REG
      vm.writeMemory8(1, 0x02) // register index: 2 (C)
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory8(0x80)).toBe(0x77)
    })
  })

  describe("絶対アドレスメモリアクセス", () => {
    test("LOAD_ABS: 絶対アドレス読み込み（バイト）", () => {
      vm.writeMemory8(0x34, 0xef)

      vm.writeMemory8(0, 0x80) // LOAD_ABS
      vm.writeMemory8(1, 0x00) // 未使用
      vm.writeMemory8(2, 0x34) // address: 0x0034
      vm.writeMemory8(3, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2)
      expect(vm.getRegister("A")).toBe(0xef)
      expect(vm.pc).toBe(4)
    })

    test("STORE_ABS: 絶対アドレス書き込み（バイト）", () => {
      vm.setRegister("A", 0xcd)

      vm.writeMemory8(0, 0x81) // STORE_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x50) // address: 0x0050
      vm.writeMemory8(3, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory8(0x50)).toBe(0xcd)
    })

    test("LOAD_ABS_W: 絶対アドレス読み込み（ワード）", () => {
      // メモリサイズを大きくして0x2000を確保
      vm = new VMState(0x3000)
      vm.writeMemory16(0x2000, 0xfeed)

      vm.writeMemory8(0, 0x82) // LOAD_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00) // address: 0x2000（リトルエンディアン）
      vm.writeMemory8(3, 0x20)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0xfeed)
    })

    test("STORE_ABS_W: 絶対アドレス書き込み（ワード）", () => {
      vm.setRegister("A", 0xbeef)

      vm.writeMemory8(0, 0x83) // STORE_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x30) // address: 0x0030
      vm.writeMemory8(3, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory16(0x30)).toBe(0xbeef)
    })
  })

  describe("メモリアクセスの実用例", () => {
    test("配列要素アクセス", () => {
      // 配列データを準備（アドレス0x100から）
      const arrayBase = 0x100
      vm.writeMemory8(arrayBase + 0, 10)
      vm.writeMemory8(arrayBase + 1, 20)
      vm.writeMemory8(arrayBase + 2, 30)
      vm.writeMemory8(arrayBase + 3, 40)

      // インデックス3の要素を読み込み
      vm.setRegister("B", arrayBase)
      vm.writeMemory8(0, 0x42) // LOAD_IND
      vm.writeMemory8(1, 0x03) // offset: +3
      vm.writeMemory8(2, 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(40)
    })

    test("構造体フィールドアクセス", () => {
      // 構造体データ（x: word, y: word）
      vm = new VMState(0x300) // メモリサイズを拡張
      const structAddr = 0x200
      vm.writeMemory16(structAddr + 0, 100) // x
      vm.writeMemory16(structAddr + 2, 200) // y

      // yフィールドの下位バイトを読み込み
      vm.setRegister("B", structAddr)
      vm.writeMemory8(0, 0x42) // LOAD_IND
      vm.writeMemory8(1, 0x02) // offset: +2 (yフィールド)
      vm.writeMemory8(2, 0x00)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(200 & 0xff) // 下位バイトのみ（リトルエンディアン）

      // ワード読み込みの場合
      vm.pc = 10
      vm.writeMemory8(10, 0x44) // LOAD_A_W
      vm.writeMemory8(11, 0xf2) // offset: -14 (10 + 3 + (-14) = -1 → 0xffff → ラップして 0x1ff)
      vm.writeMemory8(12, 0xff)

      // ワード読み込みで構造体のyフィールドを読む
      vm.pc = 0
      vm.writeMemory8(0, 0x82) // LOAD_ABS_W（絶対アドレスで直接指定）
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x02) // address: 0x0202 (structAddr + 2)
      vm.writeMemory8(3, 0x02)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(200)
    })

    test("スタック経由のデータ受け渡し", () => {
      vm.sp = 0x80

      // データをスタックに保存
      vm.setRegister("A", 0x1234)
      vm.writeMemory8(0, 0x1f) // PUSH_A

      InstructionExecutor.step(vm)
      expect(vm.sp).toBe(0x7e)

      // 別の値をAに設定
      vm.setRegister("A", 0xffff)

      // スタックから復元（直接メモリ読み込み）
      vm.writeMemory8(1, 0x82) // LOAD_ABS_W
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x7e) // スタックトップアドレス
      vm.writeMemory8(4, 0x00)

      InstructionExecutor.step(vm)
      expect(vm.getRegister("A")).toBe(0x1234)
    })
  })

  describe("境界条件テスト", () => {
    test("メモリ境界でのワード読み込み", () => {
      // メモリ最後尾にワードデータを配置
      vm.writeMemory8(0xfffe, 0x34)
      vm.writeMemory8(0xffff, 0x12)

      vm.writeMemory8(0, 0x82) // LOAD_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0xfe) // address: 0xfffe
      vm.writeMemory8(3, 0xff)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1234)
    })

    test("メモリ境界でのワード書き込み", () => {
      vm.setRegister("A", 0xabcd)

      vm.writeMemory8(0, 0x83) // STORE_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0xff) // address: 0xffff
      vm.writeMemory8(3, 0xff)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.readMemory8(0xffff)).toBe(0xcd)
      expect(vm.readMemory8(0x0000)).toBe(0xab) // ラップアラウンド
    })

    test("負のオフセット", () => {
      vm.pc = 100
      vm.writeMemory8(90, 0x42) // 読み込むデータ

      vm.writeMemory8(100, 0x40) // LOAD_A
      vm.writeMemory8(101, 0xf3) // offset: -13
      vm.writeMemory8(102, 0xff)
      // 読み込みアドレス: PC(100) + 3(命令長) + (-13) = 90

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x42)
    })
  })
})
