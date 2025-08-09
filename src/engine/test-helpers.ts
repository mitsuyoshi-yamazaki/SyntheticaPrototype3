/**
 * テスト用ヘルパー関数
 * テストケースで使用する共通のモックオブジェクト生成
 */

import type { ObjectId, Assembler, Computer, Hull } from "@/types/game"

/**
 * テスト用のAssemblerを作成
 */
export const createTestAssembler = (overrides: Partial<Assembler> = {}): Assembler => {
  return {
    id: 1 as ObjectId,
    type: "ASSEMBLER",
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 10,
    energy: 0,
    mass: 1000,
    buildEnergy: 1000,
    currentEnergy: 1000,
    assemblePower: 1,
    isAssembling: false,
    progress: 0,
    ...overrides,
  }
}

/**
 * テスト用のComputerを作成
 */
export const createTestComputer = (overrides: Partial<Computer> = {}): Computer => {
  return {
    id: 1 as ObjectId,
    type: "COMPUTER",
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 10,
    energy: 0,
    mass: 600,
    buildEnergy: 600,
    currentEnergy: 600,
    processingPower: 1,
    memorySize: 256,
    memory: new Uint8Array(256),
    programCounter: 0,
    registers: new Uint16Array(8),
    stackPointer: 255,
    zeroFlag: false,
    carryFlag: false,
    vmCyclesExecuted: 0,
    ...overrides,
  }
}

/**
 * テスト用のHullを作成
 */
export const createTestHull = (overrides: Partial<Hull> = {}): Hull => {
  return {
    id: 1 as ObjectId,
    type: "HULL",
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 20,
    energy: 0,
    mass: 200,
    buildEnergy: 200,
    currentEnergy: 200,
    capacity: 100,
    storedEnergy: 0,
    attachedUnitIds: [],
    ...overrides,
  }
}
