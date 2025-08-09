import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"
import { ObjectFactory } from "./object-factory"
import { SCAN_RESULT_ADDRESSES, UNIT_TYPE_CODES } from "./unit-self-scan"
import type { Computer, ObjectId } from "@/types/game"

describe("SCAN命令", () => {
  let factory: ObjectFactory
  let computer: Computer
  let vm: VMState

  beforeEach(() => {
    factory = new ObjectFactory(1000, 1000)
    computer = factory.createComputer(
      1 as ObjectId,
      { x: 100, y: 100 },
      10, // 処理能力
      256 // メモリサイズ
    )
    vm = new VMState(256, computer.memory)
  })

  test("SCAN命令の実行", () => {
    // SCAN命令をメモリに配置
    // SCAN destAddr=0x0080
    vm.writeMemory8(0, 0xc0) // SCAN
    vm.writeMemory8(1, 0x80) // destAddr low
    vm.writeMemory8(2, 0x00) // destAddr high
    vm.writeMemory8(3, 0x00) // 未使用
    vm.writeMemory8(4, 0x00) // 未使用

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)
    expect(result.cycles).toBe(5)
    expect(vm.pc).toBe(5)

    // 書き込まれた内容の確認
    expect(vm.readMemory8(0x80 + SCAN_RESULT_ADDRESSES.UNIT_TYPE)).toBe(UNIT_TYPE_CODES.COMPUTER)
    expect(vm.readMemory8(0x80 + SCAN_RESULT_ADDRESSES.PROCESSING_POWER)).toBe(10)
    expect(vm.readMemory8(0x80 + SCAN_RESULT_ADDRESSES.MEMORY_SIZE)).toBe(256 & 0xff)
    expect(vm.readMemory8(0x80 + SCAN_RESULT_ADDRESSES.IS_RUNNING)).toBe(1) // COMPUTERは常に実行中
    expect(vm.readMemory8(0x80 + SCAN_RESULT_ADDRESSES.HAS_ERROR)).toBe(0) // エラーなし
  })

  test("大きな処理能力のCOMPUTERのSCAN", () => {
    // processingPowerは読み取り専用なので、テスト用に新しいオブジェクトを作成
    const computerWith1234Power = {
      ...computer,
      processingPower: 1234, // 0x04D2
    }
    computer = computerWith1234Power

    vm.writeMemory8(0, 0xc0) // SCAN
    vm.writeMemory8(1, 0x00) // destAddr=0x0000
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)

    // 処理能力の16bit値確認
    expect(vm.readMemory8(SCAN_RESULT_ADDRESSES.PROCESSING_POWER)).toBe(0xd2) // 下位
    expect(vm.readMemory8(SCAN_RESULT_ADDRESSES.PROCESSING_POWER_H)).toBe(0x04) // 上位

    // 実行中フラグ
    expect(vm.readMemory8(SCAN_RESULT_ADDRESSES.IS_RUNNING)).toBe(1)
  })

  test("エラー状態のCOMPUTERのSCAN", () => {
    computer.vmError = "Stack overflow"

    vm.writeMemory8(0, 0xc0) // SCAN
    vm.writeMemory8(1, 0x40) // destAddr=0x0040
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)
    expect(vm.readMemory8(0x40 + SCAN_RESULT_ADDRESSES.HAS_ERROR)).toBe(1)
  })

  test("ユニットコンテキストなしでのSCAN", () => {
    vm.writeMemory8(0, 0xc0) // SCAN
    vm.writeMemory8(1, 0x00)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    // ユニットコンテキストなしで実行
    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(false)
    expect(result.error).toContain("SCAN instruction requires unit context")
    expect(result.cycles).toBe(1)
  })

  test("HULLユニットでのSCAN", () => {
    // HULLを作成
    const hull = factory.createHull(
      2 as ObjectId,
      { x: 50, y: 50 },
      2048 // 容量
    )

    // HULLに複数ユニットを接続
    hull.attachedUnitIds.push(1 as ObjectId, 3 as ObjectId, 4 as ObjectId)

    const hullMemory = new Uint8Array(256)
    const hullVm = new VMState(256, hullMemory)

    hullVm.writeMemory8(0, 0xc0) // SCAN
    hullVm.writeMemory8(1, 0x10) // destAddr=0x0010
    hullVm.writeMemory8(2, 0x00)
    hullVm.writeMemory8(3, 0x00)
    hullVm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(hullVm, hull)

    expect(result.success).toBe(true)

    // HULL固有情報の確認
    expect(hullVm.readMemory8(0x10 + SCAN_RESULT_ADDRESSES.UNIT_TYPE)).toBe(UNIT_TYPE_CODES.HULL)
    expect(hullVm.readMemory8(0x10 + SCAN_RESULT_ADDRESSES.HULL_CAPACITY)).toBe(2048 & 0xff)
    expect(hullVm.readMemory8(0x10 + SCAN_RESULT_ADDRESSES.HULL_CAPACITY_H)).toBe(
      (2048 >> 8) & 0xff
    )
    expect(hullVm.readMemory8(0x10 + SCAN_RESULT_ADDRESSES.ATTACHED_UNITS)).toBe(3)
  })

  test("メモリ末尾への書き込み", () => {
    vm.writeMemory8(0, 0xc0) // SCAN
    vm.writeMemory8(1, 0xfc) // destAddr=0x00FC（252）
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)

    // メモリ境界をまたいで書き込まれることを確認
    expect(vm.readMemory8(252)).toBe(UNIT_TYPE_CODES.COMPUTER)
    expect(vm.readMemory8(253)).toBeTruthy() // BUILD_ENERGY low
    expect(vm.readMemory8(254)).toBeTruthy() // BUILD_ENERGY high
    expect(vm.readMemory8(255)).toBeTruthy() // CURRENT_ENERGY low
    expect(vm.readMemory8(0)).toBeTruthy() // CURRENT_ENERGY high（循環）
  })
})
