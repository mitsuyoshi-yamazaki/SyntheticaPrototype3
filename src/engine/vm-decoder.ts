/**
 * Synthetica Script VM 命令デコーダ
 */

import { RegisterName, VMState } from "./vm-state"
import { getInstruction } from "./vm-instructions"
import {
  DecodedInstruction,
  InstructionInvalid,
  InstructionUndefined,
} from "./vm-decoded-instructions"
import { UnitType } from "../types/game"

/** 命令デコーダ */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InstructionDecoder {
  /**
   * 現在のPCから命令をデコード
   * @param vm VM状態
   * @returns デコード結果
   */
  public static decode(vm: VMState): DecodedInstruction {
    const address = vm.programCounter
    const opcode = vm.readMemory8(address)
    const instruction = getInstruction(opcode)

    if (instruction == null) {
      return {
        address,
        opcode,
        mnemonic: "NOP",
        length: 1,
        description: "未定義",
        cycles: 1,
        conditionalCycles: 1,
      } satisfies InstructionUndefined
    }

    try {
      switch (instruction.mnemonic) {
        case "NOP0":
        case "NOP1":
        case "NOP5":
        case "XCHG":
        case "MOV_AB":
        case "MOV_AD":
        case "MOV_BA":
        case "MOV_DA":
        case "MOV_BC":
        case "MOV_CB":
        case "MOV_AC":
        case "MOV_CA":
        case "MOV_CD":
        case "MOV_DC":
        case "MOV_SP":
        case "SET_SP":
        case "INC_A":
        case "INC_B":
        case "INC_C":
        case "INC_D":
        case "DEC_A":
        case "DEC_B":
        case "DEC_C":
        case "DEC_D":
          return { address, ...instruction, mnemonic: instruction.mnemonic } // case が多すぎると（？）型エラーとなるため適当なところでreturnする

        case "ADD_AB":
        case "SUB_AB":
        case "XOR_AB":
        case "AND_AB":
        case "OR_AB":
        case "NOT_A":
        case "CMP_AB":
        case "PUSH_A":
        case "PUSH_B":
        case "PUSH_C":
        case "PUSH_D":
        case "POP_A":
        case "POP_B":
        case "POP_C":
        case "POP_D":
        case "SEARCH_F":
        case "SEARCH_B":
        case "SEARCH_F_MAX":
        case "SEARCH_B_MAX":
        case "ADD_E32":
        case "SUB_E32":
        case "CMP_E32":
        case "SHR_E10":
        case "SHL_E10":
          return { address, ...instruction, mnemonic: instruction.mnemonic } // case が多すぎると（？）型エラーとなるため適当なところでreturnする

        case "RET":
        case "MUL_AB":
        case "DIV_AB":
        case "SHL":
        case "SHR":
        case "SAR":
          return { address, ...instruction, mnemonic: instruction.mnemonic }

        case "LOAD_A":
        case "STORE_A":
        case "LOAD_IND":
        case "STORE_IND":
        case "LOAD_A_W":
        case "STORE_A_W":
        case "JMP":
        case "JZ":
        case "JNZ":
        case "JC":
        case "JNC":
        case "CALL":
        case "JG":
        case "JLE":
        case "JGE":
        case "JL":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              offset16: this.toSigned16(
                vm.readMemory8(address + 1) | (vm.readMemory8(address + 2) << 8)
              ),
            },
          }

        case "LOAD_ABS":
        case "STORE_ABS":
        case "LOAD_ABS_W":
        case "STORE_ABS_W":
        case "LOAD_IND_REG":
        case "STORE_IND_REG":
        case "JMP_ABS":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              address16: vm.readMemory8(address + 1) | (vm.readMemory8(address + 2) << 8),
            },
          }

        case "LOAD_REG":
        case "STORE_REG":
        case "JMP_IND":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              register: this.decodeRegisterName(vm.readMemory8(address + 1)),
            },
          }

        case "UNIT_MEM_READ":
        case "UNIT_MEM_WRITE":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              ...this.decodeUnitSpecifier(vm.readMemory8(address + 1)),
              unitMemoryAddress: vm.readMemory8(address + 2),
            },
          }

        case "UNIT_EXISTS":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: this.decodeUnitSpecifier(vm.readMemory8(address + 1)),
          }

        case "UNIT_MEM_READ_REG":
        case "UNIT_MEM_WRITE_REG":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              ...this.decodeUnitSpecifier(vm.readMemory8(address + 1)),
              register: this.decodeRegisterName(vm.readMemory8(address + 2)),
            },
          }

        case "CMOV_Z":
        case "CMOV_NZ":
        case "CMOV_C":
        case "CMOV_NC":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              sourceRegister: this.decodeRegisterName(vm.readMemory8(address + 1)),
              destinationRegister: this.decodeRegisterName(vm.readMemory8(address + 2)),
            },
          }

        case "LOAD_IMM":
        case "LOAD_IMM_B":
          return {
            address,
            ...instruction,
            mnemonic: instruction.mnemonic,
            operand: {
              immediate16: vm.readMemory8(address + 1) | (vm.readMemory8(address + 2) << 8),
            },
          }
        default:
          throw new Error(`Invalid mnemonic: ${instruction.mnemonic}`)
      }
    } catch (error) {
      return {
        address,
        ...instruction,
        mnemonic: "INVALID",
        cycles: 1,
        conditionalCycles: 1,
        invalidReason: `${error as string | Error}`,
      } satisfies InstructionInvalid
    }
  }

  /**
   * 命令のフォーマット済み文字列を生成
   * @param _decoded デコード結果
   * @returns フォーマット済み文字列
   */
  public static format(_decoded: DecodedInstruction): string {
    return "NOT IMPLEMENTED"
    // const addr = `0x${decoded.address.toString(16).padStart(4, "0")}`
    // const hex = Array.from(decoded.bytes)
    //   .map(b => b.toString(16).padStart(2, "0"))
    //   .join(" ")
    //   .padEnd(15)

    // if (decoded.isUndefined) {
    //   return `${addr}: ${hex} <undefined 0x${decoded.opcode.toString(16).padStart(2, "0")}>`
    // }

    // if (decoded.instruction == null) {
    //   return `${addr}: ${hex} ???`
    // }

    // let operandStr = ""
    // const ops = decoded.operands

    // switch (decoded.instruction.type) {
    //   case "MEMORY":
    //     if (ops.offset16 !== undefined) {
    //       const sign = ops.offset16 >= 0 ? "+" : ""
    //       operandStr = ` ${sign}${ops.offset16}`
    //     } else if (ops.address16 !== undefined) {
    //       operandStr = ` 0x${ops.address16.toString(16).padStart(4, "0")}`
    //     } else if (ops.register !== undefined) {
    //       const regNames = ["A", "B", "C", "D"]
    //       operandStr = ` [${regNames[ops.register] ?? "?"}]`
    //     }
    //     break

    //   case "JUMP":
    //     if (ops.offset16 !== undefined) {
    //       const sign = ops.offset16 >= 0 ? "+" : ""
    //       const target = (decoded.address + decoded.length + ops.offset16) & 0xffff
    //       operandStr = ` ${sign}${ops.offset16} (0x${target.toString(16).padStart(4, "0")})`
    //     } else if (ops.address16 !== undefined) {
    //       operandStr = ` 0x${ops.address16.toString(16).padStart(4, "0")}`
    //     }
    //     break

    //   case "DATA_MOVE":
    //   case "ARITHMETIC":
    //     if (ops.immediate16 !== undefined) {
    //       operandStr = ` #0x${ops.immediate16.toString(16).padStart(4, "0")}`
    //     }
    //     break

    //   case "UNIT":
    //     if (ops.unitId !== undefined && ops.unitMemAddr !== undefined) {
    //       operandStr = ` unit:0x${ops.unitId.toString(16).padStart(2, "0")}, addr:0x${ops.unitMemAddr.toString(16).padStart(2, "0")}`
    //     }
    //     break
    // }

    // return `${addr}: ${hex} ${decoded.instruction.mnemonic}${operandStr}`
  }

  /**
   * 16bit値を符号付き整数に変換
   * @param value 16bit値
   * @returns 符号付き整数（-32768～32767）
   */
  private static toSigned16(value: number): number {
    if (value > 0x7fff) {
      return value - 0x10000
    }
    return value
  }

  private static decodeRegisterName(index: number): RegisterName {
    switch (index) {
      case 0:
        return "A"
      case 1:
        return "B"
      case 2:
        return "C"
      case 3:
        return "D"
      default:
        throw new Error(`Invalid register index: ${index}`)
    }
  }

  private static decodeUnitSpecifier(value: number): { unitType: UnitType; unitIndex: number } {
    const unitType = ((): UnitType => {
      const unitTypeIndex = (value & 0xf0) >> 4
      switch (unitTypeIndex) {
        case 0:
          return "HULL"
        case 1:
          return "ASSEMBLER"
        case 2:
          return "COMPUTER"
        default:
          throw new Error(`Invalid unit type index: ${unitTypeIndex}`)
      }
    })()

    return {
      unitType,
      unitIndex: value & 0x0f,
    }
  }
}
