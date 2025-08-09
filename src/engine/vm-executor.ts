/**
 * Synthetica Script VM 命令実行エンジン
 */

import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import type { DecodedInstruction } from "./vm-decoder"
import type { Unit, UnitSpec } from "@/types/game"
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
  execute(vm: VMState, decoded: DecodedInstruction, unit?: Unit): ExecutionResult {
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
        case "TEMPLATE":
          return this.executeTemplate(vm, decoded, unit)
        case "ENERGY":
          return this.executeEnergy(vm, decoded, unit)
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
      case "LOAD_IMM":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("A", decoded.operands.immediate16)
        }
        break
      case "LOAD_IMM_B":
        if (decoded.operands.immediate16 !== undefined) {
          vm.setRegister("B", decoded.operands.immediate16)
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

      // 拡張演算命令（5バイト命令）
      case "MUL_AB": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B")
        result = (a * b) & 0xffff
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        vm.carryFlag = false
        break
      }
      case "DIV_AB": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B")
        if (b === 0) {
          return {
            success: false,
            error: "Division by zero",
            cycles: 1,
          }
        }
        const quotient = Math.floor(a / b) & 0xffff
        const remainder = a % b
        vm.setRegister("A", quotient)
        vm.setRegister("B", remainder)
        vm.updateZeroFlag(quotient)
        vm.carryFlag = false
        break
      }
      case "SHL": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B") & 0x1f // 下位5ビット使用（0-31）
        if (b >= 16) {
          // 16ビット以上のシフトは0
          result = 0
          vm.carryFlag = a !== 0
        } else {
          const shifted = a << b
          result = shifted & 0xffff
          // キャリーフラグ: 16ビットを超えた場合にtrue
          vm.carryFlag = (shifted & 0x10000) !== 0
        }
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        break
      }
      case "SHR": {
        const a = vm.getRegister("A")
        const b = vm.getRegister("B") & 0x1f // 下位5ビット使用（0-31）
        if (b >= 16) {
          // 16ビット以上のシフトは0
          result = 0
          vm.carryFlag = a !== 0
        } else {
          result = (a >>> b) & 0xffff // 論理右シフト
          // キャリーフラグ: シフトで失われたビットがある場合
          vm.carryFlag = b > 0 && ((a & ((1 << b) - 1)) !== 0)
        }
        vm.setRegister("A", result)
        vm.updateZeroFlag(result)
        break
      }

      default:
        return {
          success: false,
          error: `Unknown arithmetic instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    // 命令長に基づいてサイクル数を決定
    let cycles = 1
    if (decoded.length === 3) {
      cycles = 2
    } // 3バイト命令は2サイクル
    return { success: true, cycles }
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

      // 符号付き比較ジャンプ（直前のCMP_AB結果に基づく）
      case "JGE":
        // A >= B（符号付き）：キャリーフラグで符号付き比較結果を判定
        shouldJump = !vm.carryFlag || vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JL":
        // A < B（符号付き）：キャリーフラグがセットかつゼロフラグがクリア
        shouldJump = vm.carryFlag && !vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JLE":
        // A <= B（符号付き）：キャリーフラグがセットまたはゼロフラグがセット
        shouldJump = vm.carryFlag || vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JG":
        // A > B（符号付き）：キャリーフラグがクリアかつゼロフラグがクリア
        shouldJump = !vm.carryFlag && !vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break

      // 符号なし比較ジャンプ（直前のCMP_AB結果に基づく）
      case "JUL":
        // A < B（符号なし）：キャリーフラグで符号なし比較結果を判定
        shouldJump = vm.carryFlag && !vm.zeroFlag
        if (shouldJump && decoded.operands.offset16 !== undefined) {
          newPC = (vm.pc + decoded.length + decoded.operands.offset16) & 0xffff
        }
        break
      case "JUGE":
        // A >= B（符号なし）：キャリーフラグがクリアまたはゼロフラグがセット
        shouldJump = !vm.carryFlag || vm.zeroFlag
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

      // リターン（Cレジスタから）
      case "RET":
        newPC = vm.getRegister("C")
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
  executeUnit(vm: VMState, decoded: DecodedInstruction, unit?: Unit): ExecutionResult {
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

    // UNIT_MEM_WRITE_DYNは特別な処理が必要
    if (decoded.instruction.mnemonic === "UNIT_MEM_WRITE_DYN") {
      return this.executeUnitMemWriteDyn(vm, decoded, unit)
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
        const value = memInterface.readMemory(memAddr)
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
        const success = memInterface.writeMemory(memAddr, value)
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
  executeSpecial(vm: VMState, decoded: DecodedInstruction, unit?: Unit): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    switch (decoded.instruction.mnemonic) {
      case "SCAN": {
        if (unit == null) {
          return {
            success: false,
            error: "SCAN instruction requires unit context",
            cycles: 1,
          }
        }

        // オペランドから書き込み先アドレスを取得（バイト1-2）
        if (decoded.bytes == null || decoded.bytes.length < 3) {
          return {
            success: false,
            error: "Invalid SCAN instruction: insufficient bytes",
            cycles: 1,
          }
        }
        const destAddr = ((decoded.bytes[1] ?? 0) | ((decoded.bytes[2] ?? 0) << 8)) & 0xffff

        // 自身のスペックをメモリに書き込み
        UnitSelfScanSystem.executeScan(unit, vm.getMemoryArray(), destAddr)

        vm.advancePC(decoded.length)
        return { success: true, cycles: 5 }
      }

      case "ENERGY": {
        if (unit == null) {
          return {
            success: false,
            error: "ENERGY instruction requires unit context",
            cycles: 1,
          }
        }

        // オペランドからサブコマンドを取得（バイト1）
        if (decoded.bytes == null || decoded.bytes.length < 2) {
          return {
            success: false,
            error: "Invalid ENERGY instruction: insufficient bytes",
            cycles: 1,
          }
        }
        const subcommand = decoded.bytes[1] ?? 0

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

      case "SCANM": {
        // オペランドから読み取り元アドレスと長さを取得
        // バイト1-2: 読み取り元アドレス（16bit）
        // バイト3-4: 書き込み先アドレス（16bit）
        if (decoded.bytes == null || decoded.bytes.length < 5) {
          return {
            success: false,
            error: "Invalid SCANM instruction: insufficient bytes",
            cycles: 1,
          }
        }

        const srcAddr = ((decoded.bytes[1] ?? 0) | ((decoded.bytes[2] ?? 0) << 8)) & 0xffff
        const destAddr = ((decoded.bytes[3] ?? 0) | ((decoded.bytes[4] ?? 0) << 8)) & 0xffff

        // レジスタCから読み取りバイト数を取得（0の場合は256バイト）
        const lengthRaw = vm.getRegister("C") & 0xff
        const length = lengthRaw === 0 ? 256 : lengthRaw

        // メモリブロックをコピー

        const memoryArray = vm.getMemoryArray()
        const memorySize = memoryArray.length
        for (let i = 0; i < length; i++) {
          const srcIndex = (srcAddr + i) % memorySize
          const destIndex = (destAddr + i) % memorySize
          const value = memoryArray[srcIndex] ?? 0
          memoryArray[destIndex] = value
        }

        vm.advancePC(decoded.length)
        return { success: true, cycles: 5 + length } // 基本5サイクル + バイト数
      }

      case "ASSEMBLE": {
        if (unit == null) {
          return {
            success: false,
            error: "ASSEMBLE instruction requires unit context",
            cycles: 1,
          }
        }

        // オペランドから対象ASSEMBLERのIDを取得
        // バイト1: ユニット識別子
        // バイト2: コマンド（0=開始, 1=停止, 2=状態確認）
        // バイト3-4: 予約
        if (decoded.bytes == null || decoded.bytes.length < 5) {
          return {
            success: false,
            error: "Invalid ASSEMBLE instruction: insufficient bytes",
            cycles: 1,
          }
        }

        const unitId = decoded.bytes[1] ?? 0
        const command = decoded.bytes[2] ?? 0

        // ターゲットユニットを識別子から取得
        const targetUnit = this.findUnitById(unit, unitId)
        if (targetUnit == null) {
          return {
            success: false,
            error: `Unit not found: 0x${unitId.toString(16).padStart(2, "0")}`,
            cycles: 1,
          }
        }

        // ASSEMBLERであることを確認
        if (targetUnit.type !== "ASSEMBLER") {
          return {
            success: false,
            error: "Target unit is not an ASSEMBLER",
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

        const assembler = targetUnit
        const memInterface = createMemoryInterface(assembler)

        switch (command) {
          case 0: {
            // 生産開始
            // ASSEMBLERが既に生産中でないか確認
            if (assembler.isAssembling) {
              vm.setRegister("A", 0) // 失敗
              vm.advancePC(decoded.length)
              return { success: true, cycles: 1 }
            }

            // メモリから生産パラメータを読み取る
            const unitType = memInterface?.readMemory(0x01) ?? 0 // productionUnitType
            const param1 = memInterface?.readMemory(0x03) ?? 0 // productionParam1 (capacity/power)
            const param2 = memInterface?.readMemory(0x04) ?? 0 // productionParam2 (memSize for COMPUTER)

            // ユニット仕様を作成
            let targetSpec: UnitSpec | null = null
            switch (unitType) {
              case 1: // HULL
                targetSpec = { type: "HULL", capacity: param1 !== 0 ? param1 : 100 }
                break
              case 2: // ASSEMBLER
                targetSpec = { type: "ASSEMBLER", assemblePower: param1 !== 0 ? param1 : 1 }
                break
              case 3: // COMPUTER
                targetSpec = {
                  type: "COMPUTER",
                  processingPower: param1 !== 0 ? param1 : 1,
                  memorySize: param2 !== 0 ? param2 : 64,
                }
                break
            }

            if (targetSpec == null) {
              vm.setRegister("A", 0) // 失敗
              vm.advancePC(decoded.length)
              return { success: true, cycles: 1 }
            }

            // 生産開始
            assembler.isAssembling = true
            assembler.targetSpec = targetSpec
            assembler.progress = 0

            // 生産開始フラグを設定
            const success = memInterface?.writeMemory(0x0f, 1) ?? false // 生産開始トリガー
            if (success) {
              memInterface?.writeMemory(0x09, 1) // productionState = 生産中
            }

            // 結果をレジスタAに格納（1=成功）
            vm.setRegister("A", success ? 1 : 0)
            break
          }

          case 1: {
            // 生産停止
            assembler.isAssembling = false
            delete assembler.targetSpec
            assembler.progress = 0

            // 生産状態をクリア
            memInterface?.writeMemory(0x0f, 0) // 生産停止トリガー
            memInterface?.writeMemory(0x09, 0) // productionState = 停止

            vm.setRegister("A", 1) // 成功
            break
          }

          case 2: {
            // 状態確認
            // 状態コード: 0=停止, 1=生産中, 2=完了
            let state = 0
            if (assembler.isAssembling) {
              state = assembler.progress >= 1.0 ? 2 : 1
            }
            vm.setRegister("A", state)
            break
          }

          default:
            return {
              success: false,
              error: `Invalid ASSEMBLE command: ${command}`,
              cycles: 1,
            }
        }

        vm.advancePC(decoded.length)
        return { success: true, cycles: 5 }
      }

      default:
        return {
          success: false,
          error: `Unknown special instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }
  },

  /** テンプレートマッチング命令実行 */
  executeTemplate(vm: VMState, decoded: DecodedInstruction, _unit?: Unit): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    // TODO: テンプレートマッチング命令の実装
    // 現在は仮実装として成功を返す
    switch (decoded.instruction.mnemonic) {
      case "SEARCH_F":
      case "SEARCH_B":
      case "SEARCH_F_MAX":
      case "SEARCH_B_MAX":
        // 検索結果をレジスタAに格納（仮: 見つからない場合は0xFFFF）
        vm.setRegister("A", 0xffff)
        break
      default:
        return {
          success: false,
          error: `Unknown template instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 5 } // テンプレート命令は5サイクル
  },

  /** エネルギー計算命令実行 */
  executeEnergy(vm: VMState, decoded: DecodedInstruction, _unit?: Unit): ExecutionResult {
    if (decoded.instruction == null) {
      return { success: false, error: "No instruction", cycles: 1 }
    }

    // TODO: エネルギー計算命令の実装
    // 現在は仮実装として成功を返す
    switch (decoded.instruction.mnemonic) {
      case "ADD_E32":
      case "SUB_E32":
      case "CMP_E32":
      case "SHR_E10":
      case "SHL_E10":
        // エネルギー演算結果をレジスタAに格納（仮実装）
        vm.setRegister("A", 0)
        break
      default:
        return {
          success: false,
          error: `Unknown energy instruction: ${decoded.instruction.mnemonic}`,
          cycles: 1,
        }
    }

    vm.advancePC(decoded.length)
    return { success: true, cycles: 4 } // エネルギー命令は4サイクル
  },

  /**
   * UNIT_MEM_WRITE_DYN命令の実行
   * @param vm VM状態
   * @param decoded デコード済み命令
   * @param unit 実行コンテキストのユニット
   * @returns 実行結果
   */
  executeUnitMemWriteDyn(vm: VMState, decoded: DecodedInstruction, unit: Unit): ExecutionResult {
    // 動的アドレス指定によるユニットメモリ書き込み
    // 第2バイト: ユニット種別とインデックス（上位4bit:種別、下位4bit:インデックス）
    // 第3バイト: アドレス指定レジスタ（0=A, 1=B, 2=C, 3=D）
    const unitByte = decoded.operands.unitId
    const regIndex = decoded.operands.unitMemAddr // 第3バイトがレジスタインデックスとして使用される
    
    if (unitByte === undefined || regIndex === undefined) {
      return {
        success: false,
        error: "Invalid UNIT_MEM_WRITE_DYN operands",
        cycles: 1,
      }
    }
    
    // レジスタから動的アドレスを取得
    const dynamicAddr = vm.getRegisterByIndex(regIndex & 0x03) & 0xff
    
    // ユニット種別とインデックスを分離
    const unitType = (unitByte >> 4) & 0x0f
    const unitIndex = unitByte & 0x0f
    
    // 対象ユニットの特定
    const targetUnit = this.findUnit(unit, unitType, unitIndex)
    if (targetUnit == null) {
      // 仕様: 失敗してもエネルギー消費、副作用なし
      // エラーを返すが、サイクル数は消費される
      return {
        success: false,
        error: `Unit ${unitType}:${unitIndex} not found`,
        cycles: 3, // ユニット操作は3サイクル消費
      }
    }
    
    const memInterface = createMemoryInterface(targetUnit)
    if (memInterface == null) {
      // 仕様: 失敗してもエネルギー消費、副作用なし
      return {
        success: false,
        error: "Target unit has no memory interface",
        cycles: 3, // ユニット操作は3サイクル消費
      }
    }
    
    // Aレジスタの下位8bitを書き込み
    const value = vm.getRegister("A") & 0xff
    const success = memInterface.writeMemory(dynamicAddr, value)
    
    // 仕様: 失敗してもエネルギー消費、副作用なし
    if (!success) {
      return {
        success: false,
        error: `Cannot write to address 0x${dynamicAddr.toString(16).padStart(2, "0")}`,
        cycles: 3, // ユニット操作は3サイクル消費
      }
    }
    
    // 成功時はPCを進める
    vm.advancePC(decoded.length)
    return { success: true, cycles: 3 }
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
   * ユニット種別とインデックスからユニットを検索
   * @param currentUnit 現在のユニット
   * @param unitType ユニット種別（0=HULL, 1=ASSEMBLER, 2=COMPUTER）
   * @param unitIndex ユニットインデックス
   * @returns 対象ユニット（見つからない場合はnull）
   */
  findUnit(_currentUnit: Unit, _unitType: number, _unitIndex: number): Unit | null {
    // TODO: 実際の実装では、同じHULL上のユニットリストから検索
    // unitTypeとunitIndexから対象ユニットを特定
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
      
      // エラーが発生した場合は実行を停止
      if (!result.success) {
        break
      }
    }

    return totalCycles
  },
}
