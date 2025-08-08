import {
  HullMemoryInterface,
  AssemblerMemoryInterface,
  ComputerMemoryInterface,
  createMemoryInterface,
  HULL_MEMORY_MAP,
  ASSEMBLER_MEMORY_MAP,
  COMPUTER_MEMORY_MAP,
} from "./unit-memory-interface"
import type { ObjectId, Hull, Assembler, Computer } from "@/types/game"
import { Vec2 } from "@/utils/vec2"

describe("HullMemoryInterface", () => {
  let hull: Hull
  let memInterface: HullMemoryInterface

  beforeEach(() => {
    hull = {
      id: 1 as ObjectId,
      type: "HULL",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 20,
      energy: 400,
      mass: 400,
      buildEnergy: 400,
      currentEnergy: 400,
      capacity: 200,
      storedEnergy: 150,
      attachedUnitIds: [],
    }
    memInterface = new HullMemoryInterface(hull)
  })

  test("メモリマップの取得", () => {
    const map = memInterface.getMemoryMap()
    expect(map).toBe(HULL_MEMORY_MAP)
    expect(map[0x00].name).toBe("capacity")
    expect(map[0x00].access).toBe("R")
  })

  test("読み取り専用メモリの読み取り", () => {
    expect(memInterface.readMemory(0x00)).toBe(200) // capacity
    expect(memInterface.readMemory(0x02)).toBe(150) // storedEnergy
  })

  test("読み書き可能メモリの読み取り", () => {
    expect(memInterface.readMemory(0x03)).toBe(0) // collectingEnergy (未実装)
    expect(memInterface.readMemory(0x07)).toBe(0) // separateExecute
  })

  test("無効なアドレスの読み取り", () => {
    expect(memInterface.readMemory(0x10)).toBeNull()
    expect(memInterface.readMemory(-1)).toBeNull()
  })

  test("読み取り専用メモリへの書き込み失敗", () => {
    expect(memInterface.writeMemory(0x00, 300)).toBe(false) // capacity
    expect(memInterface.writeMemory(0x02, 200)).toBe(false) // storedEnergy
  })

  test("読み書き可能メモリへの書き込み", () => {
    expect(memInterface.writeMemory(0x03, 1)).toBe(true) // collectingEnergy
    expect(memInterface.writeMemory(0x07, 1)).toBe(true) // separateExecute
  })

  test("無効なアドレスへの書き込み失敗", () => {
    expect(memInterface.writeMemory(0x10, 0)).toBe(false)
  })
})

describe("AssemblerMemoryInterface", () => {
  let assembler: Assembler
  let memInterface: AssemblerMemoryInterface

  beforeEach(() => {
    assembler = {
      id: 2 as ObjectId,
      type: "ASSEMBLER",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 15,
      energy: 1800,
      mass: 1800,
      buildEnergy: 1800,
      currentEnergy: 1800,
      assemblePower: 5,
      isAssembling: false,
      progress: 0,
      parentHull: 1 as ObjectId,
    }
    memInterface = new AssemblerMemoryInterface(assembler)
  })

  test("メモリマップの取得", () => {
    const map = memInterface.getMemoryMap()
    expect(map).toBe(ASSEMBLER_MEMORY_MAP)
    expect(map[0x00].name).toBe("assemblePower")
    expect(map[0x01].name).toBe("productionUnitType")
  })

  test("読み取り専用メモリの読み取り", () => {
    expect(memInterface.readMemory(0x00)).toBe(5) // assemblePower
  })

  test("生産パラメータの読み書き", () => {
    // 初期値は0
    expect(memInterface.readMemory(0x01)).toBe(0) // productionUnitType
    expect(memInterface.readMemory(0x03)).toBe(0) // productionParam1

    // 書き込み
    expect(memInterface.writeMemory(0x01, 0x40)).toBe(true) // ASSEMBLER
    expect(memInterface.writeMemory(0x03, 100)).toBe(true) // capacity = 100

    // 確認
    expect(memInterface.readMemory(0x01)).toBe(0x40)
    expect(memInterface.readMemory(0x03)).toBe(100)
  })

  test("生産状態の読み取り", () => {
    expect(memInterface.readMemory(0x09)).toBe(0) // 生産していない
    assembler.isAssembling = true
    expect(memInterface.readMemory(0x09)).toBe(1) // 生産中
  })

  test("最後に生産したユニット情報", () => {
    // 初期値
    expect(memInterface.readMemory(0x0d)).toBe(0) // lastProducedType
    expect(memInterface.readMemory(0x0e)).toBe(0) // lastProducedIndex

    // システム内部メソッドで設定
    memInterface.setLastProduced(0x00, 3) // HULL[3]
    expect(memInterface.readMemory(0x0d)).toBe(0x00)
    expect(memInterface.readMemory(0x0e)).toBe(3)

    // リセット
    expect(memInterface.writeMemory(0x0f, 1)).toBe(true)
    expect(memInterface.readMemory(0x0d)).toBe(0)
    expect(memInterface.readMemory(0x0e)).toBe(0)
  })

  test("読み取り専用メモリへの書き込み失敗", () => {
    expect(memInterface.writeMemory(0x00, 10)).toBe(false) // assemblePower
    expect(memInterface.writeMemory(0x0d, 1)).toBe(false) // lastProducedType
  })

  test("値のマスキング", () => {
    // 8bitマスク
    expect(memInterface.writeMemory(0x01, 0x1ff)).toBe(true)
    expect(memInterface.readMemory(0x01)).toBe(0xff)

    // 16bitマスク
    expect(memInterface.writeMemory(0x03, 0x1ffff)).toBe(true)
    expect(memInterface.readMemory(0x03)).toBe(0xffff)
  })
})

describe("ComputerMemoryInterface", () => {
  let computer: Computer
  let memInterface: ComputerMemoryInterface

  beforeEach(() => {
    computer = {
      id: 3 as ObjectId,
      type: "COMPUTER",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 20,
      energy: 3700,
      mass: 3700,
      buildEnergy: 3700,
      currentEnergy: 3700,
      processingPower: 10,
      memorySize: 256,
      memory: new Uint8Array(256),
      programCounter: 0,
      registers: new Uint16Array(8),
      parentHull: 1 as ObjectId,
    }
    computer.registers[0] = 0x1234 // A
    computer.registers[1] = 0x5678 // B
    computer.registers[2] = 0x9abc // C
    computer.registers[3] = 0xdef0 // D

    memInterface = new ComputerMemoryInterface(computer)
  })

  test("メモリマップの取得", () => {
    const map = memInterface.getMemoryMap()
    expect(map).toBe(COMPUTER_MEMORY_MAP)
    expect(map[0x00].name).toBe("processingPower")
    expect(map[0x04].name).toBe("registerA")
  })

  test("スペックの読み取り", () => {
    expect(memInterface.readMemory(0x00)).toBe(10) // processingPower
    expect(memInterface.readMemory(0x01)).toBe(256) // memorySize
  })

  test("レジスタの読み取り", () => {
    expect(memInterface.readMemory(0x04)).toBe(0x1234) // registerA
    expect(memInterface.readMemory(0x05)).toBe(0x5678) // registerB
    expect(memInterface.readMemory(0x06)).toBe(0x9abc) // registerC
    expect(memInterface.readMemory(0x07)).toBe(0xdef0) // registerD
  })

  test("メモリ書き換え許可状態", () => {
    expect(memInterface.readMemory(0x02)).toBe(0) // 初期値false

    expect(memInterface.writeMemory(0x02, 1)).toBe(true)
    expect(memInterface.readMemory(0x02)).toBe(1)

    expect(memInterface.writeMemory(0x02, 0)).toBe(true)
    expect(memInterface.readMemory(0x02)).toBe(0)
  })

  test("プログラムカウンタの読み書き", () => {
    expect(memInterface.readMemory(0x03)).toBe(0) // 初期値

    // 有効な範囲内
    expect(memInterface.writeMemory(0x03, 100)).toBe(true)
    expect(computer.programCounter).toBe(100)
    expect(memInterface.readMemory(0x03)).toBe(100)

    // 無効な値
    expect(memInterface.writeMemory(0x03, 256)).toBe(false) // メモリサイズ以上
    expect(computer.programCounter).toBe(100) // 変更されない
  })

  test("読み取り専用メモリへの書き込み失敗", () => {
    expect(memInterface.writeMemory(0x00, 20)).toBe(false) // processingPower
    expect(memInterface.writeMemory(0x04, 0)).toBe(false) // registerA
  })
})

describe("createMemoryInterface", () => {
  test("HULL用インターフェース生成", () => {
    const hull: Hull = {
      id: 1 as ObjectId,
      type: "HULL",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 10,
      energy: 200,
      mass: 200,
      buildEnergy: 200,
      currentEnergy: 200,
      capacity: 100,
      storedEnergy: 0,
      attachedUnitIds: [],
    }

    const memInterface = createMemoryInterface(hull)
    expect(memInterface).toBeInstanceOf(HullMemoryInterface)
  })

  test("ASSEMBLER用インターフェース生成", () => {
    const assembler: Assembler = {
      id: 2 as ObjectId,
      type: "ASSEMBLER",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 10,
      energy: 1000,
      mass: 1000,
      buildEnergy: 1000,
      currentEnergy: 1000,
      assemblePower: 1,
      isAssembling: false,
      progress: 0,
    }

    const memInterface = createMemoryInterface(assembler)
    expect(memInterface).toBeInstanceOf(AssemblerMemoryInterface)
  })

  test("COMPUTER用インターフェース生成", () => {
    const computer: Computer = {
      id: 3 as ObjectId,
      type: "COMPUTER",
      position: Vec2.zero,
      velocity: Vec2.zero,
      radius: 10,
      energy: 3700,
      mass: 3700,
      buildEnergy: 3700,
      currentEnergy: 3700,
      processingPower: 1,
      memorySize: 64,
      memory: new Uint8Array(64),
      programCounter: 0,
      registers: new Uint16Array(8),
    }

    const memInterface = createMemoryInterface(computer)
    expect(memInterface).toBeInstanceOf(ComputerMemoryInterface)
  })
})
