/**
 * Synthetica Script VM 命令実行エンジン
 */

import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import type { DecodedInstruction } from "./vm-decoder"
import type { Unit } from "@/types/game"
import { CircuitConnectionSystem } from "./circuit-connection-system"
import { createMemoryInterface } from "./unit-memory-interface"
import { UnitSelfScanSystem } from "./unit-self-scan"
import { UnitEnergyControlSystem } from "./unit-energy-control"

/** 実行結果 */
export type ExecutionResult = {
  /** 実行成功フラグ */
  readonly success: boolean
  /** エラーメッセージ（失敗時） */
  readonly error?: string
  /** 実行停止フラグ */
  readonly halted?: boolean
  /** 消費サイクル数 */
  readonly cycles: number
}

/** 命令実行エンジン */
export const InstructionExecutor = {
  /**
   * 命令を実行
   * @param vm VM状態
   * @param decoded デコード済み命令
   * @param unit 実行ユニット（ユニット制御命令で必要）
   * @returns 実行結果
   */
  execute(
    vm: VMState,
    decoded: DecodedInstruction,
    unit?: Unit
  ): ExecutionResult {
    // 未定義命令
    if (decoded.isUndefined || decoded.instruction == null) {
      return {
        success: false,
        error: `Undefined instruction: 0x${decoded.opcode.toString(16).padStart(2, "0")}`,
        cycles: 1,
      }
    }

    try {
      switch (decoded.instruction.type) {
        case "NOP":
          return this.executeNOP(vm, decoded)
        case "DATA_MOVE":
          return this.executeDataMove(vm, decoded)
        case "ARITHMETIC":
          return this.executeArithmetic(vm, decoded)
        case "STACK":
          return this.executeStack(vm, decoded)
        case "MEMORY":
          return this.executeMemory(vm, decoded)
        case "JUMP":
          return this.executeJump(vm, decoded)
        case "UNIT":
          return this.executeUnit(vm, decoded, unit)
        case "SPECIAL":
          return this.executeSpecial(vm, decoded, unit)
        default: {
          const exhaustiveCheck: never = decoded.instruction.type
          return {
            success: false,
            error: `Unknown instruction type: ${exhaustiveCheck as string}`,
            cycles: 1,
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        cycles: 1,
      }
    }
  },

  /** NOP命令実行 */
  executeNOP(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    vm.advancePC(decoded.length)
    return { success: true, cycles: 1 }
  },

  /** データ移動命令実行 */
  executeDataMove(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    switch (decoded.instruction.mnemonic) {
      case "XCHG": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B")
        vm.setRegister("A", b)
        vm.setRegister("B", a)
        break
      }
      case "MOV_AB":
        vm.setRegister("B", vm.getRegister("A"))
        break
      case "MOV_AD":
        vm.setRegister("D", vm.getRegister("A"))
        break
      case "MOV_BA":
        vm.setRegister("A", vm.getRegister("B"))
        break
      case "MOV_DA":
        vm.setRegister("A", vm.getRegister("D"))
        break
      case "MOV_BC":
        vm.setRegister("C", vm.getRegister("B"))
        break
      case "MOV_CB":
        vm.setRegister("B", vm.getRegister("C"))
        break
      case "MOV_AC":
        vm.setRegister("C", vm.getRegister("A"))
        break
      case "MOV_CA":
        vm.setRegister("A", vm.getRegister("C"))
        break
      case "MOV_CD":
        vm.setRegister("D", vm.getRegister("C"))
        break
      case "MOV_DC":
        vm.setRegister("C", vm.getRegister("D"))
        break
      case "MOV_SP":
        vm.setRegister("A", vm.sp)
        break
      case "SET_SP":
        vm.sp = vm.getRegister("A")
        break
      
      // 即値ロード
      case "MOV_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("A", decoded.operands.immediate16)
        }
        break
      case "MOV_B_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("B", decoded.operands.immediate16)
        }
        break
      case "MOV_C_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("C", decoded.operands.immediate16)
        }
        break
      case "MOV_D_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("D", decoded.operands.immediate16)
        }
        break
      
      default:
        return {
          success: false,
          error: `Unknown data move instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 1 }
  },

  /** 算術演算命令実行 */
  executeArithmetic(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    let result: number

    switch (decoded.instruction.mnemonic) {
      // インクリメント
      case "INC_A":
        result = vm.getRegister("A") + 1
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagAdd(result)
        break
      case "INC_B":
        result = vm.getRegister("B") + 1
        vm.setRegister("B", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagAdd(result)
        break
      case "INC_C":
        result = vm.getRegister("C") + 1
        vm.setRegister("C", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagAdd(result)
        break
      case "INC_D":
        result = vm.getRegister("D") + 1
        vm.setRegister("D", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagAdd(result)
        break

      // デクリメント
      case "DEC_A":
        result = vm.getRegister("A") - 1
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(vm.getRegister("A") + 1, 1)
        break
      case "DEC_B":
        result = vm.getRegister("B") - 1
        vm.setRegister("B", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(vm.getRegister("B") + 1, 1)
        break
      case "DEC_C":
        result = vm.getRegister("C") - 1
        vm.setRegister("C", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(vm.getRegister("C") + 1, 1)
        break
      case "DEC_D":
        result = vm.getRegister("D") - 1
        vm.setRegister("D", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(vm.getRegister("D") + 1, 1)
        break

      // レジスタ間演算
      case "ADD_AB":
        result = vm.getRegister("A") + vm.getRegister("B")
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagAdd(result)
        break
      case "SUB_AB": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B")
        result = a - b
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(a, b)
        break
      }
      case "XOR_AB":
        result = vm.getRegister("A") ^ vm.getRegister("B")
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.carryFlag = false
        break
      case "AND_AB":
        result = vm.getRegister("A") & vm.getRegister("B")
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.carryFlag = false
        break
      case "OR_AB":
        result = vm.getRegister("A") | vm.getRegister("B")
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.carryFlag = false
        break
      case "NOT_A":
        result = ~vm.getRegister("A")
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.carryFlag = false
        break
      case "CMP_AB": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B")
        result = a - b
        vm.updateZeroFlag(result)
        vm.updateCarryFlagSub(a, b)
        break
      }

      // 即値演算
      case "ADD_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          result = vm.getRegister("A") + decoded.operands.immediate16
          vm.setRegister("A", result)
          vm.updateZeroFlag(result)
          vm.updateCarryFlagAdd(result)
        }
        break
      case "SUB_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          const a = vm.getRegister("A")
          result = a - decoded.operands.immediate16
          vm.setRegister("A", result)
          vm.updateZeroFlag(result)
          vm.updateCarryFlagSub(a, decoded.operands.immediate16)
        }
        break
      case "AND_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          result = vm.getRegister("A") & decoded.operands.immediate16
          vm.setRegister("A", result)
          vm.updateZeroFlag(result)
          vm.carryFlag = false
        }
        break
      case "OR_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          result = vm.getRegister("A") | decoded.operands.immediate16
          vm.setRegister("A", result)
          vm.updateZeroFlag(result)
          vm.carryFlag = false
        }
        break
      case "XOR_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          result = vm.getRegister("A") ^ decoded.operands.immediate16
          vm.setRegister("A", result)
          vm.updateZeroFlag(result)
          vm.carryFlag = false
        }
        break
      case "CMP_A_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          const a = vm.getRegister("A")
          result = a - decoded.operands.immediate16
          vm.updateZeroFlag(result)
          vm.updateCarryFlagSub(a, decoded.operands.immediate16)
        }
        break

      default:
        return {
          success: false,
          error: `Unknown arithmetic instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 1 }
  },

  /** スタック操作命令実行 */
  executeStack(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    switch (decoded.instruction.mnemonic) {
      case "PUSH_A":
        vm.push16(vm.getRegister("A"))
        break
      case "PUSH_B":
        vm.push16(vm.getRegister("B"))
        break
      case "PUSH_C":
        vm.push16(vm.getRegister("C"))
        break
      case "PUSH_D":
        vm.push16(vm.getRegister("D"))
        break
      case "POP_A":
        vm.setRegister("A", vm.pop16())
        break
      case "POP_B":
        vm.setRegister("B", vm.pop16())
        break
      case "POP_C":
        vm.setRegister("C", vm.pop16())
        break
      case "POP_D":
        vm.setRegister("D", vm.pop16())
        break
      default:
        return {
          success: false,
          error: `Unknown stack instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 2 } // スタック操作は2サイクル
  },

  /** メモリアクセス命令実行 */
  executeMemory(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    let address: number

    switch (decoded.instruction.mnemonic) {
      // 相対アドレス
      case "LOAD_A":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
          vm.setRegister("A", vm.readMemory8(address))
        }
        break
      case "STORE_A":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
          vm.writeMemory8(address, vm.getRegister("A") & 0xff)
        }
        break
      case "LOAD_A_W":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
          vm.setRegister("A", vm.readMemory16(address))
        }
        break
      case "STORE_A_W":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
          vm.writeMemory16(address, vm.getRegister("A"))
        }
        break

      // インデックスアドレス
      case "LOAD_IND":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.getRegister("B") + decoded.operands.offset16) & 0xffff
          vm.setRegister("A", vm.readMemory8(address))
        }
        break
      case "STORE_IND":
        if (decoded.operands.offset16 !== undefined) {
          address = (vm.getRegister("B") + decoded.operands.offset16) & 0xffff
          vm.writeMemory8(address, vm.getRegister("A") & 0xff)
        }
        break

      // レジスタベース
      case "LOAD_REG":
        if (decoded.operands.register !== undefined) {
          address = vm.getRegisterByIndex(decoded.operands.register)
          vm.setRegister("A", vm.readMemory8(address))
        }
        break
      case "STORE_REG":
        if (decoded.operands.register !== undefined) {
          address = vm.getRegisterByIndex(decoded.operands.register)
          vm.writeMemory8(address, vm.getRegister("A") & 0xff)
        }
        break

      // 絶対アドレス
      case "LOAD_ABS":
        if (decoded.operands.address16 !== undefined) {
          vm.setRegister("A", vm.readMemory8(decoded.operands.address16))
        }
        break
      case "STORE_ABS":
        if (decoded.operands.address16 !== undefined) {
          vm.writeMemory8(decoded.operands.address16, vm.getRegister("A") & 0xff)
        }
        break
      case "LOAD_ABS_W":
        if (decoded.operands.address16 !== undefined) {
          vm.setRegister("A", vm.readMemory16(decoded.operands.address16))
        }
        break
      case "STORE_ABS_W":
        if (decoded.operands.address16 !== undefined) {
          vm.writeMemory16(decoded.operands.address16, vm.getRegister("A"))
        }
        break

      default:
        return {
          success: false,
          error: `Unknown memory instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 2 } // メモリアクセスは2サイクル
  },

  /** ジャンプ命令実行 */
  executeJump(vm: VMState, decoded: DecodedInstruction): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    let shouldJump = false
    let newPC: number | undefined

    switch (decoded.instruction.mnemonic) {
      // 無条件ジャンプ
      case "JMP":
        shouldJump = true
        if (decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JMP_ABS":
        shouldJump = true
        newPC = decoded.operands.address16
        break

      // 条件ジャンプ
      case "JZ":
        shouldJump = vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JNZ":
        shouldJump = !vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JC":
        shouldJump = vm.carryFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JNC":
        shouldJump = !vm.carryFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break

      // サブルーチン呼び出し
      case "CALL":
        shouldJump = true
        vm.push16(vm.pc + decoded.length) // リターンアドレスをプッシュ
        if (decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "CALL_ABS":
        shouldJump = true
        vm.push16(vm.pc + decoded.length) // リターンアドレスをプッシュ
        newPC = decoded.operands.address16
        break

      // リターン
      case "RET":
        newPC = vm.pop16()
        shouldJump = true
        break

      default:
        return {
          success: false,
          error: `Unknown jump instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    if (shouldJump && newPC !== undefined) {
      vm.pc = newPC
    } else if (!shouldJump) {
      vm.advancePC(decoded.length)
    }

    // ジャンプは条件により異なるサイクル数
    return { success: true, cycles: shouldJump ? 3 : 1 }
  },

  /** ユニット制御命令実行 */
  executeUnit(
    vm: VMState,
    decoded: DecodedInstruction,
    unit?: Unit
  ): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    if (unit == null) {
      return {
        success: false,
        error: "Unit control instruction requires unit context",
        cycles: 1,
      }
    }

    const unitId = decoded.operands.unitId
    const memAddr = decoded.operands.unitMemAddr

    if (unitId === undefined || memAddr === undefined) {
      return {
        success: false,
        error: "Missing unit control operands",
        cycles: 1,
      }
    }

    // ターゲットユニットを識別子から取得
    const targetUnit = this.findUnitById(unit, unitId)
    if (targetUnit == null) {
      return {
        success: false,
        error: `Unit not found: 0x${unitId.toString(16).padStart(2, "0")}`,
        cycles: 1,
      }
    }

    // アクセス権限チェック
    if (!CircuitConnectionSystem.canAccess(unit, targetUnit)) {
      return {
        success: false,
        error: "Access denied: units not on same hull",
        cycles: 1,
      }
    }

    // メモリインターフェース取得
    const memInterface = createMemoryInterface(targetUnit)
    if (memInterface == null) {
      return {
        success: false,
        error: "Target unit has no memory interface",
        cycles: 1,
      }
    }

    switch (decoded.instruction.mnemonic) {
      case "UNIT_MEM_READ": {
        const value = memInterface.read(memAddr)
        if (value == null) {
          return {
            success: false,
            error: `Cannot read from address 0x${memAddr.toString(16).padStart(2, "0")}`,
            cycles: 1,
          }
        }
        vm.setRegister("B", value)
        break
      }
      case "UNIT_MEM_WRITE": {
        const value = vm.getRegister("C") & 0xff
        const success = memInterface.write(memAddr, value)
        if (!success) {
          return {
            success: false,
            error: `Cannot write to address 0x${memAddr.toString(16).padStart(2, "0")}`,
            cycles: 1,
          }
        }
        break
      }
      default:
        return {
          success: false,
          error: `Unknown unit instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 3 } // ユニット制御は3サイクル
  },

  /** 特殊命令実行 */
  executeSpecial(
    vm: VMState,
    decoded: DecodedInstruction,
    unit?: Unit
  ): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    switch (decoded.instruction.mnemonic) {
      case "SCAN":
        if (unit == null) {
          return {
            success: false,
            error: "SCAN instruction requires unit context",
            cycles: 1,
          }
        }
        
        // オペランドから書き込み先アドレスを取得（バイト1-2）
        if (!decoded.bytes || decoded.bytes.length < 3) {
          return {
            success: false,
            error: "Invalid SCAN instruction: insufficient bytes",
            cycles: 1,
          }
        }
        const destAddr = (decoded.bytes[1] | (decoded.bytes[2] << 8)) & 0xffff
        
        // 自身のスペックをメモリに書き込み
        UnitSelfScanSystem.executeScan(unit, vm.getMemoryArray(), destAddr)
        
        vm.advancePC(decoded.length)
        return { success: true, cycles: 5 }

      case "ENERGY": {
        if (unit == null) {
          return {
            success: false,
            error: "ENERGY instruction requires unit context",
            cycles: 1,
          }
        }
        
        // オペランドからサブコマンドを取得（バイト1）
        if (!decoded.bytes || decoded.bytes.length < 2) {
          return {
            success: false,
            error: "Invalid ENERGY instruction: insufficient bytes",
            cycles: 1,
          }
        }
        const subcommand = decoded.bytes[1]
        
        // エネルギー操作を実行
        const result = UnitEnergyControlSystem.executeEnergyCommand(unit, subcommand)
        
        if (!result.success) {
          return {
            success: false,
            error: result.error ?? "Energy operation failed",
            cycles: 1,
          }
        }
        
        // 結果をレジスタAに格納
        if (result.value !== undefined) {
          vm.setRegister("A", result.value & 0xffff)
        }
        
        vm.advancePC(decoded.length)
        return { success: true, cycles: 5 }
      }

      case "HALT":
        // 実行停止
        return { success: true, halted: true, cycles: 1 }

      default:
        return {
          success: false,
          error: `Unknown special instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }
  },

  /**
   * ユニット識別子からユニットを検索
   * @param _currentUnit 現在のユニット
   * @param _unitId ユニット識別子
   * @returns 見つかったユニット、またはnull
   */
  findUnitById(_currentUnit: Unit, _unitId: number): Unit | null {
    // TODO: 実際の実装では、同じHULL上のユニットリストから検索
    // 現在は仮実装としてnullを返す
    return null
  },

  /**
   * 単一ステップ実行
   * @param vm VM状態
   * @param unit 実行ユニット
   * @returns 実行結果
   */
  step(vm: VMState, unit?: Unit): ExecutionResult {
    const decoded = InstructionDecoder.decode(vm)
    return this.execute(vm, decoded, unit)
  },

  /**
   * 指定サイクル数まで実行
   * @param vm VM状態
   * @param maxCycles 最大サイクル数
   * @param unit 実行ユニット
   * @returns 総実行サイクル数
   */
  run(vm: VMState, maxCycles: number, unit?: Unit): number {
    let totalCycles = 0

    while (totalCycles < maxCycles) {
      const result = this.step(vm, unit)
      totalCycles += result.cycles

      if (!result.success || result.halted) {
        break
      }
    }

    return totalCycles
  },
}