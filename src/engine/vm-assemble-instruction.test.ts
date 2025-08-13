/**
 * ASSEMBLE命令のテスト
 */

import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import { InstructionExecutor } from "./vm-executor"
import type { Computer, Assembler, Hull, ObjectId } from "@/types/game"

describe("ASSEMBLE命令", () => {
  let vm: VMState
  let computer: Computer
  let assembler: Assembler
  let hull: Hull

  beforeEach(() => {
    vm = new VMState(256)

    // モックユニット作成
    hull = {
      id: "hull-1" as ObjectId,
      type: "HULL",
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 10,
      energy: 100,
      mass: 100,
      buildEnergy: 100,
      currentEnergy: 100,
      capacity: 200,
      storedEnergy: 50,
      attachedUnitIds: [],
    }

    assembler = {
      id: "assembler-1" as ObjectId,
      type: "ASSEMBLER",
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 7,
      energy: 100,
      mass: 100,
      buildEnergy: 100,
      currentEnergy: 100,
      parentHullId: "hull-1" as ObjectId,
      assemblePower: 5,
      isAssembling: false,
      progress: 0,
    }

    computer = {
      id: "computer-1" as ObjectId,
      type: "COMPUTER",
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
      energy: 50,
      mass: 50,
      buildEnergy: 50,
      currentEnergy: 50,
      parentHullId: "hull-1" as ObjectId,
      processingPower: 10,
      memorySize: 256,
      memory: new Uint8Array(256),
      programCounter: 0,
      registers: new Uint16Array(4),
      stackPointer: 0xffff,
      zeroFlag: false,
      carryFlag: false,
      isRunning: true,
      vmCyclesExecuted: 0,
    }

    // findUnitByIdモック
    InstructionExecutor.findUnitById = jest.fn((_currentUnit, unitId) => {
      if (unitId === 0x40) {
        // ASSEMBLER[0]
        return assembler
      } else if (unitId === 0x80) {
        // COMPUTER[0]
        return computer
      } else if (unitId === 0x00) {
        // HULL[0]
        return hull
      }
      return null
    })
  })

  describe("生産開始コマンド（コマンド0）", () => {
    test("HULL生産を開始できる", () => {
      const memory = vm.getMemoryArray()

      // 生産パラメータをメモリに設定
      assembler.memory = new Uint8Array(256)
      const memInterface = {
        readMemory: jest.fn((addr: number) => {
          if (addr === 0x01) {
            return 1
          } // unitType = HULL
          if (addr === 0x03) {
            return 200
          } // capacity = 200
          return 0
        }),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x00 // コマンド（生産開始）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 成功
      expect(assembler.isAssembling).toBe(true)
      expect(assembler.targetSpec).toEqual({ type: "HULL", capacity: 200 })
      expect(assembler.progress).toBe(0)
      expect(memInterface.writeMemory).toHaveBeenCalledWith(0x0f, 1) // 生産開始トリガー
      expect(memInterface.writeMemory).toHaveBeenCalledWith(0x09, 1) // productionState = 生産中
    })

    test("ASSEMBLER生産を開始できる", () => {
      const memory = vm.getMemoryArray()

      // 生産パラメータをメモリに設定
      assembler.memory = new Uint8Array(256)
      const memInterface = {
        readMemory: jest.fn((addr: number) => {
          if (addr === 0x01) {
            return 2
          } // unitType = ASSEMBLER
          if (addr === 0x03) {
            return 10
          } // assemblePower = 10
          return 0
        }),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x00 // コマンド（生産開始）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 成功
      expect(assembler.isAssembling).toBe(true)
      expect(assembler.targetSpec).toEqual({ type: "ASSEMBLER", assemblePower: 10 })
    })

    test("COMPUTER生産を開始できる", () => {
      const memory = vm.getMemoryArray()

      // 生産パラメータをメモリに設定
      assembler.memory = new Uint8Array(256)
      const memInterface = {
        readMemory: jest.fn((addr: number) => {
          if (addr === 0x01) {
            return 3
          } // unitType = COMPUTER
          if (addr === 0x03) {
            return 20
          } // processingPower = 20
          if (addr === 0x04) {
            return 128
          } // memorySize = 128
          return 0
        }),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x00 // コマンド（生産開始）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 成功
      expect(assembler.isAssembling).toBe(true)
      expect(assembler.targetSpec).toEqual({
        type: "COMPUTER",
        processingPower: 20,
        memorySize: 128,
      })
    })

    test("既に生産中の場合は失敗する", () => {
      const memory = vm.getMemoryArray()

      // 既に生産中に設定
      assembler.isAssembling = true
      assembler.targetSpec = { type: "HULL", capacity: 100 }
      assembler.progress = 0.5

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x00 // コマンド（生産開始）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0) // 失敗
      expect(assembler.isAssembling).toBe(true) // 変更されない
      expect(assembler.progress).toBe(0.5) // 変更されない
    })

    test("無効なユニットタイプの場合は失敗する", () => {
      const memory = vm.getMemoryArray()

      // 生産パラメータをメモリに設定
      assembler.memory = new Uint8Array(256)
      const memInterface = {
        readMemory: jest.fn((addr: number) => {
          if (addr === 0x01) {
            return 99
          } // 無効なunitType
          return 0
        }),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x00 // コマンド（生産開始）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0) // 失敗
      expect(assembler.isAssembling).toBe(false)
      expect(assembler.targetSpec).toBeUndefined()
    })
  })

  describe("生産停止コマンド（コマンド1）", () => {
    test("生産を停止できる", () => {
      const memory = vm.getMemoryArray()

      // 生産中に設定
      assembler.isAssembling = true
      assembler.targetSpec = { type: "HULL", capacity: 100 }
      assembler.progress = 0.5

      const memInterface = {
        readMemory: jest.fn(() => 0),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x01 // コマンド（生産停止）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 成功
      expect(assembler.isAssembling).toBe(false)
      expect(assembler.targetSpec).toBeUndefined()
      expect(assembler.progress).toBe(0)
      expect(memInterface.writeMemory).toHaveBeenCalledWith(0x0f, 0) // 生産停止トリガー
      expect(memInterface.writeMemory).toHaveBeenCalledWith(0x09, 0) // productionState = 停止
    })

    test("生産していない状態でも停止コマンドは成功する", () => {
      const memory = vm.getMemoryArray()

      // 生産していない状態
      assembler.isAssembling = false
      assembler.targetSpec = undefined
      assembler.progress = 0

      const memInterface = {
        readMemory: jest.fn(() => 0),
        writeMemory: jest.fn(() => true),
      }
      const { createMemoryInterface } = jest.requireMock("./unit-memory-interface")
      createMemoryInterface.mockReturnValue(memInterface)

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x01 // コマンド（生産停止）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 成功
      expect(assembler.isAssembling).toBe(false)
    })
  })

  describe("状態確認コマンド（コマンド2）", () => {
    test("停止状態を確認できる", () => {
      const memory = vm.getMemoryArray()

      // 停止状態
      assembler.isAssembling = false
      assembler.progress = 0

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x02 // コマンド（状態確認）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0) // 停止
    })

    test("生産中状態を確認できる", () => {
      const memory = vm.getMemoryArray()

      // 生産中状態
      assembler.isAssembling = true
      assembler.progress = 0.5

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x02 // コマンド（状態確認）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(1) // 生産中
    })

    test("完了状態を確認できる", () => {
      const memory = vm.getMemoryArray()

      // 完了状態
      assembler.isAssembling = true
      assembler.progress = 1.0

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0x02 // コマンド（状態確認）
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(2) // 完了
    })
  })

  describe("エラーケース", () => {
    test("ユニットコンテキストなしでエラー", () => {
      const memory = vm.getMemoryArray()

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID
      memory[2] = 0x00 // コマンド
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行（ユニットコンテキストなし）
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(false)
      expect(result.error).toContain("ASSEMBLE instruction requires unit context")
    })

    test("対象ユニットが見つからない場合エラー", () => {
      const memory = vm.getMemoryArray()

      // 存在しないユニットIDを指定
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0xff // 存在しないユニットID
      memory[2] = 0x00 // コマンド
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Unit not found: 0xff")
    })

    test("対象ユニットがASSEMBLERでない場合エラー", () => {
      const memory = vm.getMemoryArray()

      // COMPUTERを対象に指定
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x80 // COMPUTER[0]
      memory[2] = 0x00 // コマンド
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Target unit is not an ASSEMBLER")
    })

    test("無効なコマンドでエラー", () => {
      const memory = vm.getMemoryArray()

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
      memory[2] = 0xff // 無効なコマンド
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid ASSEMBLE command: 255")
    })

    test("異なるHULL上のユニットにはアクセスできない", () => {
      const memory = vm.getMemoryArray()

      // 異なるHULL上のASSEMBLER
      const otherAssembler: Assembler = {
        ...assembler,
        id: "assembler-2" as ObjectId,
        parentHullId: "hull-2" as ObjectId, // 異なるHULL
      }

      // findUnitByIdモックを更新
      InstructionExecutor.findUnitById = jest.fn((_currentUnit, unitId) => {
        if (unitId === 0x41) {
          return otherAssembler
        }
        return null
      })

      // ASSEMBLE命令を配置
      memory[0] = 0xc3 // ASSEMBLE
      memory[1] = 0x41 // 異なるHULL上のASSEMBLER
      memory[2] = 0x00 // コマンド
      memory[3] = 0x00 // 予約
      memory[4] = 0x00 // 予約

      // 実行
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded, computer)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Access denied: units not on same hull")
    })
  })
})
