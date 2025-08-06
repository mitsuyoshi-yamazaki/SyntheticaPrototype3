import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"
import { ObjectFactory } from "./object-factory"
import { ENERGY_SUBCOMMANDS } from "./unit-energy-control"
import type { Computer, ObjectId } from "@/types/game"

describe("ENERGY命令", () => {
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
    computer.currentEnergy = 2500
    computer.buildEnergy = 3000
    vm = new VMState(256, computer.memory)
  })

  test("GET_UNIT_ENERGY命令の実行", () => {
    // ENERGY GET_UNIT_ENERGY
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY)
    vm.writeMemory8(2, 0x00) // 未使用
    vm.writeMemory8(3, 0x00) // 未使用
    vm.writeMemory8(4, 0x00) // 未使用

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)
    expect(result.cycles).toBe(5)
    expect(vm.pc).toBe(5)
    expect(vm.getRegister("A")).toBe(2500) // currentEnergy
  })

  test("GET_BUILD_ENERGY命令の実行", () => {
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_BUILD_ENERGY)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)
    expect(vm.getRegister("A")).toBe(3000) // buildEnergy
  })

  test("GET_HULL_ENERGY（HULLなし）", () => {
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_HULL_ENERGY)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(false)
    expect(result.error).toContain("not attached to a HULL")
    expect(result.cycles).toBe(1)
  })

  test("不明なサブコマンド", () => {
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, 0xFF) // 不明なサブコマンド
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Unknown energy subcommand")
  })

  test("ユニットコンテキストなしでのENERGY", () => {
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    // ユニットコンテキストなしで実行
    const result = InstructionExecutor.step(vm)

    expect(result.success).toBe(false)
    expect(result.error).toContain("ENERGY instruction requires unit context")
    expect(result.cycles).toBe(1)
  })

  test("不正なサブコマンド0x00", () => {
    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, 0x00) // 0x00は定義されていないサブコマンド

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Unknown energy subcommand: 0x00")
  })

  test("16bit値の切り捨て", () => {
    // 大きな値を設定
    computer.currentEnergy = 0x12345 // 16bitを超える

    vm.writeMemory8(0, 0xc1) // ENERGY
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    const result = InstructionExecutor.step(vm, computer)

    expect(result.success).toBe(true)
    expect(vm.getRegister("A")).toBe(0x2345) // 下位16bitのみ
  })

  test("連続したENERGY命令の実行", () => {
    // 1つ目: GET_UNIT_ENERGY
    vm.writeMemory8(0, 0xc1)
    vm.writeMemory8(1, ENERGY_SUBCOMMANDS.GET_UNIT_ENERGY)
    vm.writeMemory8(2, 0x00)
    vm.writeMemory8(3, 0x00)
    vm.writeMemory8(4, 0x00)

    // 2つ目: GET_BUILD_ENERGY
    vm.writeMemory8(5, 0xc1)
    vm.writeMemory8(6, ENERGY_SUBCOMMANDS.GET_BUILD_ENERGY)
    vm.writeMemory8(7, 0x00)
    vm.writeMemory8(8, 0x00)
    vm.writeMemory8(9, 0x00)

    // 1つ目実行
    let result = InstructionExecutor.step(vm, computer)
    expect(result.success).toBe(true)
    expect(vm.getRegister("A")).toBe(2500)
    expect(vm.pc).toBe(5)

    // 2つ目実行
    result = InstructionExecutor.step(vm, computer)
    expect(result.success).toBe(true)
    expect(vm.getRegister("A")).toBe(3000)
    expect(vm.pc).toBe(10)
  })
})