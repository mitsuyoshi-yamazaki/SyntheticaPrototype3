/**
 * COMPUTERデバッグシステム
 * 選択中のHULLに接続されたCOMPUTERの実行状態をログ出力
 */

import type { Computer, Hull, ObjectId } from "@/types/game"
import { ALL_INSTRUCTIONS } from "./vm-instructions"

/** 命令実行情報 */
export type InstructionDebugInfo = {
  /** 実行前のプログラムカウンタ */
  pc: number
  /** 実行した命令のオペコード */
  opcode: number
  /** 命令名 */
  instructionName: string
  /** 実行後のレジスタ状態 */
  registers: Uint16Array
  /** 累積実行サイクル数 */
  cyclesExecuted: number
  /** この命令の消費サイクル数 */
  cyclesCost: number
}

/** デバッグレベル */
export enum DebugLevel {
  /** ログ出力なし */
  NONE = 0,
  /** エラーのみ */
  ERROR = 1,
  /** tickごとのサマリー */
  SUMMARY = 2,
  /** 命令ごとの詳細 */
  DETAILED = 3,
}

export class ComputerDebugger {
  private selectedHullId: ObjectId | null = null
  private debugLevel: DebugLevel = DebugLevel.SUMMARY
  private _lastTickLogged = -1

  /**
   * 選択中のHULLを設定
   */
  public setSelectedHull(hullId: ObjectId | null): void {
    this.selectedHullId = hullId
    if (hullId != null) {
      console.log(`[ComputerDebugger] HULLを選択: #${hullId}`)
    }
  }

  /**
   * デバッグレベルを設定
   */
  public setDebugLevel(level: DebugLevel): void {
    this.debugLevel = level
    console.log(`[ComputerDebugger] デバッグレベル: ${DebugLevel[level]}`)
  }

  /**
   * 選択中のHULLのCOMPUTERかどうかを判定
   */
  public isTargetComputer(_computer: Computer, parentHull: Hull | null): boolean {
    if (this.debugLevel === DebugLevel.NONE) {return false}
    if (this.selectedHullId == null) {return false}
    if (parentHull == null) {return false}
    return parentHull.id === this.selectedHullId
  }

  /**
   * tick開始時のログ
   */
  public logTickStart(computer: Computer, tick: number): void {
    if (this.debugLevel < DebugLevel.SUMMARY) {return}
    
    // 同じtickで複数回ログ出力しない
    if (this._lastTickLogged === tick) {return}
    this._lastTickLogged = tick

    console.group(`[COMPUTER #${computer.id}] Tick ${tick} 開始`)
    
    // 初期状態を出力
    this.logComputerState(computer, "開始時の状態")
    
    // 実行予定
    console.log("実行予定:", {
      最大サイクル数: computer.processingPower,
      実行中: computer.isRunning,
    })
  }

  /**
   * tick終了時のログ
   */
  public logTickEnd(computer: Computer, startPC: number, executedCycles: number): void {
    if (this.debugLevel < DebugLevel.SUMMARY) {return}

    console.log("実行結果:", {
      実行サイクル数: executedCycles,
      PC変化: `${startPC} → ${computer.programCounter}`,
    })

    // 終了時の状態を出力
    this.logComputerState(computer, "終了時の状態")
    
    console.groupEnd()
  }

  /**
   * 命令実行ごとのログ（詳細モード）
   */
  public logInstruction(info: InstructionDebugInfo): void {
    if (this.debugLevel < DebugLevel.DETAILED) {return}

    console.log(
      `[${info.cyclesExecuted}] PC:${info.pc.toString().padStart(3, '0')} ` +
      `Op:0x${info.opcode.toString(16).padStart(2, '0')} ` +
      `${info.instructionName.padEnd(12)} ` +
      `(${info.cyclesCost}cyc) ` +
      `A:${info.registers[0]} B:${info.registers[1]} ` +
      `C:${info.registers[2]} D:${info.registers[3]}`
    )
  }

  /**
   * エラーログ
   */
  public logError(computer: Computer, error: string): void {
    if (this.debugLevel < DebugLevel.ERROR) {return}
    
    console.error(`[COMPUTER #${computer.id}] VMエラー:`, error)
  }

  /**
   * COMPUTERの状態をログ出力
   */
  private logComputerState(computer: Computer, label: string): void {
    console.log(label, {
      レジスタ: {
        A: computer.registers[0],
        B: computer.registers[1],
        C: computer.registers[2],
        D: computer.registers[3],
        E: computer.registers[4],
        F: computer.registers[5],
        G: computer.registers[6],
        H: computer.registers[7],
      },
      PC: computer.programCounter,
      SP: computer.stackPointer,
      フラグ: {
        Zero: computer.zeroFlag,
        Carry: computer.carryFlag,
      },
      実行状態: computer.isRunning ? "実行中" : "停止",
    })

    // 現在の命令を表示
    if (computer.isRunning && computer.programCounter < computer.memorySize) {
      const opcode = computer.memory[computer.programCounter]
      if (opcode !== undefined) {
        const instructionName = this.getInstructionName(opcode)
        console.log("次の命令:", {
          アドレス: computer.programCounter,
          オペコード: `0x${opcode.toString(16).padStart(2, '0')}`,
          命令: instructionName,
        })
      }
    }

    // エラーがあれば表示
    if (computer.vmError != null) {
      console.error("VMエラー:", computer.vmError)
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