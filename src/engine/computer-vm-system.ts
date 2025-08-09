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
    vm.setRegister("A", computer.registers[0] ?? 0)
    vm.setRegister("B", computer.registers[1] ?? 0)
    vm.setRegister("C", computer.registers[2] ?? 0)
    vm.setRegister("D", computer.registers[3] ?? 0)

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
    // エラーがあってもPCをリセットして実行を継続
    if (computer.vmError != null) {
      // PCが範囲外の場合は0にリセット
      if (computer.programCounter >= computer.memorySize) {
        computer.programCounter = 0
      }
      // エラーをクリア
      delete computer.vmError
    }

    // VMState作成
    const vm = this.createVMState(computer)

    // このtickで実行可能な残りサイクル数
    const remainingCycles = computer.processingPower - computer.vmCyclesExecuted

    if (remainingCycles <= 0) {
      return
    }

    let cyclesUsed = 0

    // 残りサイクル分だけ実行
    while (cyclesUsed < remainingCycles) {
      const result = InstructionExecutor.step(vm, computer)

      cyclesUsed += result.cycles

      if (!result.success) {
        // エラー発生（無効な命令をスキップして継続）
        // PCを次の命令に進める（無効な命令をスキップ）
        vm.pc = (vm.pc + 1) % computer.memorySize
        // 最小サイクル消費
        if (result.cycles === 0) {
          cyclesUsed += 1
        }
        continue
      }

    }

    // VM状態をユニットに同期（エラーがあっても同期）
    this.syncVMState(vm, computer)

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
    delete computer.vmError
    computer.vmCyclesExecuted = 0
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
