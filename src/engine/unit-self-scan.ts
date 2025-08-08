/**
 * ユニット自身のスペックを読み取るシステム
 */

import type { Unit, Hull, Assembler, Computer } from "@/types/game"

/** SCAN命令の結果格納先アドレス定義 */
export const SCAN_RESULT_ADDRESSES = {
  // 共通（0x00-0x0F）
  UNIT_TYPE: 0x00, // ユニット種別（1:HULL, 2:ASSEMBLER, 3:COMPUTER）
  BUILD_ENERGY: 0x01, // 構築エネルギー（下位バイト）
  BUILD_ENERGY_H: 0x02, // 構築エネルギー（上位バイト）
  CURRENT_ENERGY: 0x03, // 現在エネルギー（下位バイト）
  CURRENT_ENERGY_H: 0x04, // 現在エネルギー（上位バイト）

  // HULL固有（0x10-0x1F）
  HULL_CAPACITY: 0x10, // HULL容量（下位バイト）
  HULL_CAPACITY_H: 0x11, // HULL容量（上位バイト）
  ATTACHED_UNITS: 0x12, // 接続ユニット数

  // ASSEMBLER固有（0x20-0x2F）
  ASSEMBLE_POWER: 0x20, // 組立能力（下位バイト）
  ASSEMBLE_POWER_H: 0x21, // 組立能力（上位バイト）
  IS_ASSEMBLING: 0x22, // 組立中フラグ（0:停止, 1:組立中）
  PROGRESS: 0x23, // 組立進捗（0-255）

  // COMPUTER固有（0x30-0x3F）
  PROCESSING_POWER: 0x30, // 処理能力（下位バイト）
  PROCESSING_POWER_H: 0x31, // 処理能力（上位バイト）
  MEMORY_SIZE: 0x32, // メモリサイズ（下位バイト）
  MEMORY_SIZE_H: 0x33, // メモリサイズ（上位バイト）
  IS_RUNNING: 0x34, // 実行中フラグ（0:停止, 1:実行中）
  HAS_ERROR: 0x35, // エラーフラグ（0:正常, 1:エラー）
} as const

/** ユニット種別コード */
export const UNIT_TYPE_CODES = {
  HULL: 1,
  ASSEMBLER: 2,
  COMPUTER: 3,
} as const

/** ユニット自身のスペック読み取りシステム */
export const UnitSelfScanSystem = {
  /**
   * SCAN命令を実行
   * @param unit 実行ユニット
   * @param memory 書き込み先メモリ
   * @param startAddress 書き込み開始アドレス
   * @returns 書き込んだバイト数
   */
  executeScan(unit: Unit, memory: Uint8Array, startAddress: number): number {
    let bytesWritten = 0

    // 共通情報の書き込み
    bytesWritten += this.writeCommonInfo(unit, memory, startAddress)

    // ユニット種別に応じた固有情報の書き込み
    switch (unit.type) {
      case "HULL":
        bytesWritten += this.writeHullInfo(unit, memory, startAddress)
        break
      case "ASSEMBLER":
        bytesWritten += this.writeAssemblerInfo(unit, memory, startAddress)
        break
      case "COMPUTER":
        bytesWritten += this.writeComputerInfo(unit, memory, startAddress)
        break
    }

    return bytesWritten
  },

  /**
   * 共通情報を書き込み
   */
  writeCommonInfo(unit: Unit, memory: Uint8Array, startAddress: number): number {
    const addr = (offset: number) => (startAddress + offset) % memory.length

    // ユニット種別
    const unitType = UNIT_TYPE_CODES[unit.type]
    memory[addr(SCAN_RESULT_ADDRESSES.UNIT_TYPE)] = unitType ?? 0

    // 構築エネルギー（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.BUILD_ENERGY)] = unit.buildEnergy & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.BUILD_ENERGY_H)] = (unit.buildEnergy >> 8) & 0xff

    // 現在エネルギー（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.CURRENT_ENERGY)] = unit.currentEnergy & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.CURRENT_ENERGY_H)] = (unit.currentEnergy >> 8) & 0xff

    return 5 // 書き込んだバイト数
  },

  /**
   * HULL固有情報を書き込み
   */
  writeHullInfo(hull: Hull, memory: Uint8Array, startAddress: number): number {
    const addr = (offset: number) => (startAddress + offset) % memory.length

    // HULL容量（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.HULL_CAPACITY)] = hull.capacity & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.HULL_CAPACITY_H)] = (hull.capacity >> 8) & 0xff

    // 接続ユニット数
    const attachedCount = hull.attachedUnits.hulls.length + 
                          hull.attachedUnits.assemblers.length + 
                          hull.attachedUnits.computers.length
    memory[addr(SCAN_RESULT_ADDRESSES.ATTACHED_UNITS)] = attachedCount & 0xff

    return 3 // 書き込んだバイト数
  },

  /**
   * ASSEMBLER固有情報を書き込み
   */
  writeAssemblerInfo(assembler: Assembler, memory: Uint8Array, startAddress: number): number {
    const addr = (offset: number) => (startAddress + offset) % memory.length

    // 組立能力（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.ASSEMBLE_POWER)] = assembler.assemblePower & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.ASSEMBLE_POWER_H)] = (assembler.assemblePower >> 8) & 0xff

    // 組立中フラグ
    memory[addr(SCAN_RESULT_ADDRESSES.IS_ASSEMBLING)] = assembler.isAssembling ? 1 : 0

    // 組立進捗（0-255にスケール）
    memory[addr(SCAN_RESULT_ADDRESSES.PROGRESS)] = Math.floor(assembler.progress * 255) & 0xff

    return 4 // 書き込んだバイト数
  },

  /**
   * COMPUTER固有情報を書き込み
   */
  writeComputerInfo(computer: Computer, memory: Uint8Array, startAddress: number): number {
    const addr = (offset: number) => (startAddress + offset) % memory.length

    // 処理能力（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.PROCESSING_POWER)] = computer.processingPower & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.PROCESSING_POWER_H)] = (computer.processingPower >> 8) & 0xff

    // メモリサイズ（16bit）
    memory[addr(SCAN_RESULT_ADDRESSES.MEMORY_SIZE)] = computer.memorySize & 0xff
    memory[addr(SCAN_RESULT_ADDRESSES.MEMORY_SIZE_H)] = (computer.memorySize >> 8) & 0xff

    // 実行中フラグ
    memory[addr(SCAN_RESULT_ADDRESSES.IS_RUNNING)] = computer.isRunning ? 1 : 0

    // エラーフラグ
    memory[addr(SCAN_RESULT_ADDRESSES.HAS_ERROR)] = computer.vmError != null ? 1 : 0

    return 6 // 書き込んだバイト数
  },
}
