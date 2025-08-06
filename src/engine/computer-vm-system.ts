/**
 * COMPUTERユニットのVM実行を管理するシステム
 */

import type { Computer } from "@/types/game"
import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"

/** VM実行システム */
export const ComputerVMSystem = {
  /**
   * COMPUTERユニットのVM状態を作成
   * @param computer COMPUTERユニット
   * @returns VMState
   */
  createVMState(computer: Computer): VMState {
    // COMPUTERユニットの既存メモリ配列を使用してVMStateを作成
    const vm = new VMState(computer.memorySize, computer.memory)

    // レジスタの復元
    vm.setRegister("A", computer.registers[0])
    vm.setRegister("B", computer.registers[1])
    vm.setRegister("C", computer.registers[2])
    vm.setRegister("D", computer.registers[3])

    // 状態の復元
    vm.pc = computer.programCounter
    vm.sp = computer.stackPointer
    vm.zeroFlag = computer.zeroFlag
    vm.carryFlag = computer.carryFlag

    return vm
  },

  /**
   * VM状態をCOMPUTERユニットに同期
   * @param vm VMState
   * @param computer COMPUTERユニット
   */
  syncVMState(vm: VMState, computer: Computer): void {
    // メモリの同期（VMStateとComputerは同じ配列を参照しているので不要）

    // レジスタの同期
    computer.registers[0] = vm.getRegister("A")
    computer.registers[1] = vm.getRegister("B")
    computer.registers[2] = vm.getRegister("C")
    computer.registers[3] = vm.getRegister("D")

    // 状態の同期
    computer.programCounter = vm.pc
    computer.stackPointer = vm.sp
    computer.zeroFlag = vm.zeroFlag
    computer.carryFlag = vm.carryFlag
  },

  /**
   * COMPUTERユニットのVMを実行
   * @param computer COMPUTERユニット
   */
  executeVM(computer: Computer): void {
    // 実行中でない場合はスキップ
    if (!computer.isRunning) {
      return
    }

    // エラーが発生している場合はスキップ
    if (computer.vmError != null) {
      return
    }

    // VMState作成
    const vm = this.createVMState(computer)

    // このtickで実行可能な残りサイクル数
    const remainingCycles = computer.processingPower - computer.vmCyclesExecuted

    if (remainingCycles <= 0) {
      return
    }

    let cyclesUsed = 0
    let errorOccurred = false

    // 残りサイクル分だけ実行
    while (cyclesUsed < remainingCycles) {
      const result = InstructionExecutor.step(vm, computer)

      cyclesUsed += result.cycles

      if (!result.success) {
        // エラー発生
        computer.vmError = result.error
        computer.isRunning = false
        errorOccurred = true
        break
      }

      if (result.halted === true) {
        // HALT命令で停止
        computer.isRunning = false
        break
      }
    }

    // VM状態をユニットに同期
    if (!errorOccurred) {
      this.syncVMState(vm, computer)
    }

    // 実行済みサイクル数を更新
    computer.vmCyclesExecuted += cyclesUsed
  },

  /**
   * 次のtickに向けてサイクルカウンタをリセット
   * @param computer COMPUTERユニット
   */
  resetCycleCounter(computer: Computer): void {
    computer.vmCyclesExecuted = 0
  },

  /**
   * プログラムを開始
   * @param computer COMPUTERユニット
   * @param startAddress 開始アドレス（省略時は0）
   */
  startProgram(computer: Computer, startAddress = 0): void {
    computer.programCounter = startAddress
    computer.isRunning = true
    computer.vmError = undefined
    computer.vmCyclesExecuted = 0
  },

  /**
   * プログラムを停止
   * @param computer COMPUTERユニット
   */
  stopProgram(computer: Computer): void {
    computer.isRunning = false
  },

  /**
   * プログラムをロード
   * @param computer COMPUTERユニット
   * @param program プログラムバイト列
   * @param startAddress ロード開始アドレス（省略時は0）
   */
  loadProgram(computer: Computer, program: Uint8Array, startAddress = 0): void {
    const maxLength = Math.min(program.length, computer.memorySize - startAddress)
    computer.memory.set(program.slice(0, maxLength), startAddress)
  },
}
