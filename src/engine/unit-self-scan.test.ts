import { UnitSelfScanSystem, SCAN_RESULT_ADDRESSES, UNIT_TYPE_CODES } from "./unit-self-scan"
import { ObjectFactory } from "./object-factory"
import type { ObjectId } from "@/types/game"

describe("UnitSelfScanSystem", () => {
  let factory: ObjectFactory
  let memory: Uint8Array

  beforeEach(() => {
    factory = new ObjectFactory(1000, 1000)
    memory = new Uint8Array(256)
  })

  describe("executeScan", () => {
    test("HULL情報の読み取り", () => {
      const hull = factory.createHull(
        1 as ObjectId,
        { x: 100, y: 100 },
        1024 // 容量
      )

      // ユニットを2つ接続
      hull.attachedUnitIds.push(2 as ObjectId, 3 as ObjectId)

      const bytesWritten = UnitSelfScanSystem.executeScan(hull, memory, 0)

      // 共通情報
      expect(memory[SCAN_RESULT_ADDRESSES.UNIT_TYPE]).toBe(UNIT_TYPE_CODES.HULL)
      expect(memory[SCAN_RESULT_ADDRESSES.BUILD_ENERGY]).toBe(hull.buildEnergy & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.BUILD_ENERGY_H]).toBe((hull.buildEnergy >> 8) & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.CURRENT_ENERGY]).toBe(hull.currentEnergy & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.CURRENT_ENERGY_H]).toBe((hull.currentEnergy >> 8) & 0xff)

      // HULL固有情報
      expect(memory[SCAN_RESULT_ADDRESSES.HULL_CAPACITY]).toBe(1024 & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.HULL_CAPACITY_H]).toBe((1024 >> 8) & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.ATTACHED_UNITS]).toBe(2)

      expect(bytesWritten).toBe(8) // 共通5 + HULL固有3
    })

    test("ASSEMBLER情報の読み取り", () => {
      const assembler = factory.createAssembler(
        1 as ObjectId,
        { x: 100, y: 100 },
        5, // 組立能力
        2 as ObjectId // parentHull
      )

      // 組立状態を設定
      assembler.isAssembling = true
      assembler.progress = 0.75

      const bytesWritten = UnitSelfScanSystem.executeScan(assembler, memory, 0)

      // 共通情報
      expect(memory[SCAN_RESULT_ADDRESSES.UNIT_TYPE]).toBe(UNIT_TYPE_CODES.ASSEMBLER)

      // ASSEMBLER固有情報
      expect(memory[SCAN_RESULT_ADDRESSES.ASSEMBLE_POWER]).toBe(5)
      expect(memory[SCAN_RESULT_ADDRESSES.ASSEMBLE_POWER_H]).toBe(0)
      expect(memory[SCAN_RESULT_ADDRESSES.IS_ASSEMBLING]).toBe(1)
      expect(memory[SCAN_RESULT_ADDRESSES.PROGRESS]).toBe(Math.floor(0.75 * 255))

      expect(bytesWritten).toBe(9) // 共通5 + ASSEMBLER固有4
    })

    test("COMPUTER情報の読み取り", () => {
      const computer = factory.createComputer(
        1 as ObjectId,
        { x: 100, y: 100 },
        100, // 処理能力
        512, // メモリサイズ
        2 as ObjectId // parentHull
      )

      // 実行状態を設定
      computer.isRunning = true
      computer.vmError = "Test error"

      const bytesWritten = UnitSelfScanSystem.executeScan(computer, memory, 0)

      // 共通情報
      expect(memory[SCAN_RESULT_ADDRESSES.UNIT_TYPE]).toBe(UNIT_TYPE_CODES.COMPUTER)

      // COMPUTER固有情報
      expect(memory[SCAN_RESULT_ADDRESSES.PROCESSING_POWER]).toBe(100)
      expect(memory[SCAN_RESULT_ADDRESSES.PROCESSING_POWER_H]).toBe(0)
      expect(memory[SCAN_RESULT_ADDRESSES.MEMORY_SIZE]).toBe(512 & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.MEMORY_SIZE_H]).toBe((512 >> 8) & 0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.IS_RUNNING]).toBe(1)
      expect(memory[SCAN_RESULT_ADDRESSES.HAS_ERROR]).toBe(1)

      expect(bytesWritten).toBe(11) // 共通5 + COMPUTER固有6
    })

    test("メモリ境界での書き込み", () => {
      const hull = factory.createHull(1 as ObjectId, { x: 100, y: 100 }, 1024)

      // メモリ末尾付近から書き込み
      const startAddr = 254
      UnitSelfScanSystem.executeScan(hull, memory, startAddr)

      // 循環して書き込まれることを確認
      expect(memory[254]).toBe(UNIT_TYPE_CODES.HULL) // アドレス254
      expect(memory[255]).toBe(hull.buildEnergy & 0xff) // アドレス255
      expect(memory[0]).toBe((hull.buildEnergy >> 8) & 0xff) // アドレス0（循環）
      expect(memory[1]).toBe(hull.currentEnergy & 0xff) // アドレス1
    })
  })

  describe("16bit値の書き込み", () => {
    test("大きな値の正しい分割", () => {
      const computer = factory.createComputer(
        1 as ObjectId,
        { x: 100, y: 100 },
        12345, // 処理能力（0x3039）
        65535 // メモリサイズ（0xFFFF）
      )

      UnitSelfScanSystem.executeScan(computer, memory, 0)

      // 処理能力: 12345 = 0x3039
      expect(memory[SCAN_RESULT_ADDRESSES.PROCESSING_POWER]).toBe(0x39) // 下位バイト
      expect(memory[SCAN_RESULT_ADDRESSES.PROCESSING_POWER_H]).toBe(0x30) // 上位バイト

      // メモリサイズ: 65535 = 0xFFFF
      expect(memory[SCAN_RESULT_ADDRESSES.MEMORY_SIZE]).toBe(0xff)
      expect(memory[SCAN_RESULT_ADDRESSES.MEMORY_SIZE_H]).toBe(0xff)
    })
  })

  describe("フラグの書き込み", () => {
    test("false/undefined値の正しい変換", () => {
      const assembler = factory.createAssembler(1 as ObjectId, { x: 100, y: 100 }, 1)

      // デフォルト状態（false）
      assembler.isAssembling = false
      assembler.progress = 0

      UnitSelfScanSystem.executeScan(assembler, memory, 0)

      expect(memory[SCAN_RESULT_ADDRESSES.IS_ASSEMBLING]).toBe(0)
      expect(memory[SCAN_RESULT_ADDRESSES.PROGRESS]).toBe(0)
    })

    test("エラーなしの場合", () => {
      const computer = factory.createComputer(1 as ObjectId, { x: 100, y: 100 }, 1, 256)

      // エラーなし
      computer.vmError = undefined

      UnitSelfScanSystem.executeScan(computer, memory, 0)

      expect(memory[SCAN_RESULT_ADDRESSES.HAS_ERROR]).toBe(0)
    })
  })
})
