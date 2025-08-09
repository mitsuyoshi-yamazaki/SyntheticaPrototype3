/**
 * デバッグ機能付きComputerVMSystem
 * 命令ごとの実行状態をトレース可能
 */

import type { Computer, Hull, ObjectId } from "@/types/game"
import { VMState } from "./vm-state"
import { InstructionExecutor } from "./vm-executor"
import { ComputerDebugger, type InstructionDebugInfo } from "./computer-debugger"
import { ALL_INSTRUCTIONS } from "./vm-instructions"

/**
 * デバッグ機能付きComputerVMSystemクラス
 */
export class ComputerVMSystemDebug {
  private readonly debugger: ComputerDebugger
  private readonly hullMap = new Map<ObjectId, Hull>()

  public constructor(computerDebugger?: ComputerDebugger) {
    this.debugger = computerDebugger ?? new ComputerDebugger()
  }

  /**
   * デバッガーを取得
   */
  public getDebugger(): ComputerDebugger {
    return this.debugger
  }

  /**
   * HULLマップを更新（親子関係を追跡するため）
   */
  public updateHullMap(hulls: Hull[]): void {
    this.hullMap.clear()
    for (const hull of hulls) {
      this.hullMap.set(hull.id, hull)
    }
  }

  /**
   * COMPUTERの親HULLを検索
   */
  private findParentHull(computer: Computer): Hull | null {
    if (computer.parentHull === undefined) {return null}
    return this.hullMap.get(computer.parentHull) ?? null
  }

  /**
   * VMを実行（インスタンスメソッド、デバッグ機能付き）
   */
  public executeVMWithDebug(computer: Computer, tick: number): void {
    // 実行前の初期化
    if (!computer.isRunning) {
      return
    }

    // 親HULLを検索
    const parentHull = this.findParentHull(computer)
    const isTarget = this.debugger.isTargetComputer(computer, parentHull)

    // デバッグ対象の場合、tick開始ログ
    if (isTarget) {
      this.debugger.logTickStart(computer, tick)
    }

    // VMStateを作成（Computerのメモリ配列を使用）
    const vmState = new VMState(computer.memorySize, computer.memory)
    
    // レジスタの復元
    vmState.setRegister("A", computer.registers[0] ?? 0)
    vmState.setRegister("B", computer.registers[1] ?? 0)
    vmState.setRegister("C", computer.registers[2] ?? 0)
    vmState.setRegister("D", computer.registers[3] ?? 0)
    
    // 状態の復元
    vmState.pc = computer.programCounter
    vmState.sp = computer.stackPointer
    vmState.zeroFlag = computer.zeroFlag
    vmState.carryFlag = computer.carryFlag

    // 実行前の状態を記録
    const startPC = computer.programCounter
    const startCycles = computer.vmCyclesExecuted

    // 命令実行ループ
    computer.vmCyclesExecuted = 0
    while (computer.vmCyclesExecuted < computer.processingPower && computer.isRunning) {
      const beforePC = vmState.pc
      
      // 現在の命令を取得
      const opcode = vmState.readMemory8(beforePC) ?? 0

      try {
        // 1命令実行
        const result = InstructionExecutor.step(vmState)
        
        // 実行サイクル数を更新
        computer.vmCyclesExecuted += result.cycles

        // デバッグ対象の場合、命令ごとのログ
        if (isTarget) {
          const debugInfo: InstructionDebugInfo = {
            pc: beforePC,
            opcode,
            instructionName: this.getInstructionName(opcode),
            registers: new Uint16Array([
              vmState.getRegister("A"),
              vmState.getRegister("B"),
              vmState.getRegister("C"),
              vmState.getRegister("D"),
            ]),
            cyclesExecuted: computer.vmCyclesExecuted,
            cyclesCost: result.cycles,
          }
          this.debugger.logInstruction(debugInfo)
        }

        // 実行停止
        if (!result.success || vmState.pc >= computer.memorySize) {
          computer.isRunning = false
          if (!result.success && result.error != null) {
            computer.vmError = result.error
            if (isTarget) {
              this.debugger.logError(computer, result.error)
            }
          }
          break
        }
      } catch (error) {
        // エラー処理
        computer.isRunning = false
        computer.vmError = error instanceof Error ? error.message : String(error)
        if (isTarget) {
          this.debugger.logError(computer, computer.vmError)
        }
        break
      }
    }

    // 状態を書き戻し（メモリは同じ配列を参照しているので不要）
    // レジスタの同期
    computer.registers[0] = vmState.getRegister("A")
    computer.registers[1] = vmState.getRegister("B")
    computer.registers[2] = vmState.getRegister("C")
    computer.registers[3] = vmState.getRegister("D")
    
    // 状態の同期
    computer.programCounter = vmState.pc
    computer.stackPointer = vmState.sp
    computer.zeroFlag = vmState.zeroFlag
    computer.carryFlag = vmState.carryFlag

    // デバッグ対象の場合、tick終了ログ
    if (isTarget) {
      const executedCycles = computer.vmCyclesExecuted - startCycles
      this.debugger.logTickEnd(computer, startPC, executedCycles)
    }
  }

  /**
   * オペコードから命令名を取得
   */
  private getInstructionName(opcode: number): string {
    const instruction = ALL_INSTRUCTIONS.get(opcode)
    if (instruction != null) {
      return instruction.mnemonic
    }
    return `UNKNOWN(0x${opcode.toString(16).padStart(2, '0')})`
  }
}