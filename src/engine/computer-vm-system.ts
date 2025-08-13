/**
 * COMPUTERユニットのVM実行を管理するシステム
 */

import type { Computer, ObjectId, Unit } from "@/types/game"
import { InstructionExecutor } from "./vm-executor"
import { VMPhysicalUnitPort, VMUnitPort } from "./vm-unit-port"

export class ComputerVMSystem {
  public executeVM(computer: Computer, getUnitById: (unitId: ObjectId) => Unit | null): void {
    if (computer.computingState.skippingTicks > 0) {
      computer.computingState.skippingTicks -= 1

      if (computer.computingState.skippingTicks > 0) {
        // 分数周波数を持つ場合
        return
      }
    }

    let cycles: number

    if (computer.processingPower > 0) {
      // 正の整数の場合: 命令実行数/tick
      cycles = computer.processingPower
      computer.computingState.skippingTicks = 0
    } else {
      // 負の整数の場合: -n は 1命令実行/n tick
      cycles = 1
      computer.computingState.skippingTicks = -(computer.processingPower - 1)
    }

    // 持ち越したcycleの消費
    if (cycles > computer.computingState.cycleOverflow) {
      cycles -= computer.computingState.cycleOverflow
    } else {
      computer.computingState.cycleOverflow -= cycles
      return
    }

    const unitPort: VMUnitPort = new VMPhysicalUnitPort(computer, getUnitById)
    const { cyclesUsed } = this.run(cycles, computer, unitPort)

    computer.computingState.cycleOverflow = cyclesUsed - cycles
  }

  protected run(cycles: number, computer: Computer, unitPort: VMUnitPort): { cyclesUsed: number } {
    let cyclesUsed = 0

    while (cyclesUsed < cycles) {
      const result = InstructionExecutor.step(computer.vm, unitPort)
      cyclesUsed += result.cycles
    }

    return { cyclesUsed }
  }
}

export class DebugComputerVMSystem extends ComputerVMSystem {
  public selectedHullId: ObjectId | null = null

  protected override run(
    cycles: number,
    computer: Computer,
    unitPort: VMUnitPort
  ): { cyclesUsed: number } {
    if (computer.parentHullId !== this.selectedHullId) {
      return super.run(cycles, computer, unitPort)
    }

    let cyclesUsed = 0
    const debugMessages: string[] = []

    while (cyclesUsed < cycles) {
      const programCounter = computer.vm.programCounter
      const result = InstructionExecutor.step(computer.vm, unitPort)
      cyclesUsed += result.cycles

      debugMessages.push(
        `${programCounter.toString(16)}: ${result.executed.mnemonic} ${result.cycles} cycles, ${result.case}`
      )
    }

    console.log(debugMessages.join("\n"))

    return { cyclesUsed }
  }
}
