/**
 * Synthetica Script VM 命令デコーダ
 */

import { VMState } from "./vm-state"
import { getInstruction, getInstructionLength, isUndefinedInstruction } from "./vm-instructions"
import type { Instruction } from "./vm-instructions"

/** デコード結果 */
export type DecodedInstruction = {
  /** 命令情報 */
  readonly instruction: Instruction | null
  /** オペコード */
  readonly opcode: number
  /** 命令のアドレス */
  readonly address: number
  /** 命令長 */
  readonly length: number
  /** オペランド（命令によって異なる） */
  readonly operands: {
    /** 16bit符号付きオフセット（3バイト命令） */
    offset16?: number
    /** 16bit即値（3バイト命令） */
    immediate16?: number
    /** 16bitアドレス（4バイト命令） */
    address16?: number
    /** レジスタインデックス（0-3） */
    register?: number
    /** ユニット識別子 */
    unitId?: number
    /** ユニットメモリアドレス */
    unitMemAddr?: number
  }
  /** 未定義命令フラグ */
  readonly isUndefined: boolean
  /** 生のバイト列 */
  readonly bytes: Uint8Array
}

/** 命令デコーダ */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InstructionDecoder {
  /**
   * 現在のPCから命令をデコード
   * @param vm VM状態
   * @returns デコード結果
   */
  public static decode(vm: VMState): DecodedInstruction {
    const address = vm.pc
    const opcode = vm.readMemory8(address)
    const instruction = getInstruction(opcode)
    const length = getInstructionLength(opcode)
    const isUndefined = isUndefinedInstruction(opcode)

    // 生のバイト列を読み取り
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = vm.readMemory8(address + i)
    }

    // オペランドをデコード
    const operands: DecodedInstruction["operands"] = {}

    if (length >= 3) {
      // 3バイト以上の命令はオペランドを持つ
      const byte2 = vm.readMemory8(address + 1)
      const byte3 = vm.readMemory8(address + 2)

      if (instruction != null) {
        switch (instruction.mnemonic) {
          // メモリアクセス命令（PC相対）
          case "LOAD_A":
          case "STORE_A":
          case "LOAD_A_W":
          case "STORE_A_W":
          case "LOAD_IND":
          case "STORE_IND":
            // 符号付き16bitオフセット（リトルエンディアン）
            operands.offset16 = this.toSigned16(byte2 | (byte3 << 8))
            break

          // レジスタベースメモリアクセス
          case "LOAD_REG":
          case "STORE_REG":
            operands.register = byte2 & 0x03 // 下位2bit
            break

          // 間接アドレスメモリアクセス
          case "LOAD_IND_REG":
          case "STORE_IND_REG":
            // 第2,3バイトが16bitアドレス（リトルエンディアン）
            operands.address16 = byte2 | (byte3 << 8)
            break

          // ジャンプ命令（相対）
          case "JMP":
          case "JZ":
          case "JNZ":
          case "JC":
          case "JNC":
          case "CALL":
          case "JG":
          case "JGE":
          case "JL":
          case "JLE":
          case "JUL":
          case "JUGE":
            operands.offset16 = this.toSigned16(byte2 | (byte3 << 8))
            break

          // 即値命令（旧3バイト形式 - 削除済み）
          // case "MOV_A_IMM"等は仕様から削除済み

          // RET命令は特殊（オペランド無視）
          case "RET":
            break
        }
      }
    }

    if (length >= 4) {
      // 4バイト命令

      if (instruction != null) {
        switch (instruction.mnemonic) {
          // 絶対アドレス命令
          case "LOAD_ABS":
          case "STORE_ABS":
          case "LOAD_ABS_W":
          case "STORE_ABS_W":
          case "JMP_ABS":
          case "CALL_ABS":
            // 仕様: 第2,3バイトが16bitアドレス（リトルエンディアン）
            // bytes[0]=opcode, bytes[1]=第2バイト(low), bytes[2]=第3バイト(high)
            operands.address16 = (bytes[1] ?? 0) | ((bytes[2] ?? 0) << 8)
            break

          // ユニット制御命令
          case "UNIT_MEM_READ":
          case "UNIT_MEM_WRITE":
            // 仕様: 第2バイト: ユニット種別とインデックス
            //       第3,4バイト: ユニット内メモリアドレス（16bit）
            operands.unitId = bytes[1] ?? 0
            operands.unitMemAddr = (bytes[2] ?? 0) | ((bytes[3] ?? 0) << 8)
            break
          
          // 動的ユニット操作命令
          case "UNIT_MEM_WRITE_DYN":
            // 仕様: 第2バイト: ユニット種別とインデックス
            //       第3バイト: アドレス指定レジスタ
            operands.unitId = bytes[1] ?? 0
            operands.unitMemAddr = bytes[2] ?? 0  // レジスタインデックス
            break
        }
      }
    }

    if (length >= 5) {
      // 5バイト命令
      if (instruction != null) {
        switch (instruction.mnemonic) {
          // 即値ロード命令（5バイト）
          case "LOAD_IMM":
          case "LOAD_IMM_B":
            // 仕様: 第2,3バイトが16bit即値（リトルエンディアン）
            // bytesは0-indexed: bytes[0]=opcode, bytes[1]=第2バイト, bytes[2]=第3バイト
            operands.immediate16 = (bytes[1] ?? 0) | ((bytes[2] ?? 0) << 8)
            break

          // その他の5バイト命令（MUL_AB, DIV_AB, SHL, SHR等）
          // これらの命令は特別なオペランドを持たない
          default:
            break
        }
      }
    }

    return {
      instruction,
      opcode,
      address,
      length,
      operands,
      isUndefined,
      bytes,
    }
  }

  /**
   * 指定アドレスから命令をデコード
   * @param vm VM状態
   * @param address デコードするアドレス
   * @returns デコード結果
   */
  public static decodeAt(vm: VMState, address: number): DecodedInstruction {
    const savedPC = vm.pc
    vm.pc = address
    const result = this.decode(vm)
    vm.pc = savedPC
    return result
  }

  /**
   * 命令のフォーマット済み文字列を生成
   * @param decoded デコード結果
   * @returns フォーマット済み文字列
   */
  public static format(decoded: DecodedInstruction): string {
    const addr = `0x${decoded.address.toString(16).padStart(4, "0")}`
    const hex = Array.from(decoded.bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(15)

    if (decoded.isUndefined) {
      return `${addr}: ${hex} <undefined 0x${decoded.opcode.toString(16).padStart(2, "0")}>`
    }

    if (decoded.instruction == null) {
      return `${addr}: ${hex} ???`
    }

    let operandStr = ""
    const ops = decoded.operands

    switch (decoded.instruction.type) {
      case "MEMORY":
        if (ops.offset16 !== undefined) {
          const sign = ops.offset16 >= 0 ? "+" : ""
          operandStr = ` ${sign}${ops.offset16}`
        } else if (ops.address16 !== undefined) {
          operandStr = ` 0x${ops.address16.toString(16).padStart(4, "0")}`
        } else if (ops.register !== undefined) {
          const regNames = ["A", "B", "C", "D"]
          operandStr = ` [${regNames[ops.register] ?? "?"}]`
        }
        break

      case "JUMP":
        if (ops.offset16 !== undefined) {
          const sign = ops.offset16 >= 0 ? "+" : ""
          const target = (decoded.address + decoded.length + ops.offset16) & 0xffff
          operandStr = ` ${sign}${ops.offset16} (0x${target.toString(16).padStart(4, "0")})`
        } else if (ops.address16 !== undefined) {
          operandStr = ` 0x${ops.address16.toString(16).padStart(4, "0")}`
        }
        break

      case "DATA_MOVE":
      case "ARITHMETIC":
        if (ops.immediate16 !== undefined) {
          operandStr = ` #0x${ops.immediate16.toString(16).padStart(4, "0")}`
        }
        break

      case "UNIT":
        if (ops.unitId !== undefined && ops.unitMemAddr !== undefined) {
          operandStr = ` unit:0x${ops.unitId.toString(16).padStart(2, "0")}, addr:0x${ops.unitMemAddr.toString(16).padStart(2, "0")}`
        }
        break
    }

    return `${addr}: ${hex} ${decoded.instruction.mnemonic}${operandStr}`
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
}
