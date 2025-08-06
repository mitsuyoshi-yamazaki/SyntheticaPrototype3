/**
 * Synthetica Script VM 命令セット定義
 */

/** 命令タイプ */
export type InstructionType =
  | "NOP"
  | "DATA_MOVE"
  | "ARITHMETIC"
  | "STACK"
  | "MEMORY"
  | "JUMP"
  | "UNIT"
  | "SPECIAL"

/** 命令情報 */
export type Instruction = {
  readonly opcode: number
  readonly mnemonic: string
  readonly length: number
  readonly type: InstructionType
  readonly description: string
}

/** 1バイト命令（0x00-0x3F） */
export const ONE_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // テンプレート用NOP
  0x00: {
    opcode: 0x00,
    mnemonic: "NOP0",
    length: 1,
    type: "NOP",
    description: "テンプレート用NOP（値0）",
  },
  0x01: {
    opcode: 0x01,
    mnemonic: "NOP1",
    length: 1,
    type: "NOP",
    description: "テンプレート用NOP（値1）",
  },

  // データ移動命令
  0x02: {
    opcode: 0x02,
    mnemonic: "XCHG",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタAとBを交換",
  },
  0x03: {
    opcode: 0x03,
    mnemonic: "MOV_AB",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタAをBにコピー",
  },
  0x04: {
    opcode: 0x04,
    mnemonic: "MOV_AD",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタAをDにコピー",
  },
  0x05: {
    opcode: 0x05,
    mnemonic: "MOV_BA",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタBをAにコピー",
  },
  0x06: {
    opcode: 0x06,
    mnemonic: "MOV_DA",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタDをAにコピー",
  },
  0x07: {
    opcode: 0x07,
    mnemonic: "MOV_BC",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタBをCにコピー",
  },
  0x08: {
    opcode: 0x08,
    mnemonic: "MOV_CB",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタCをBにコピー",
  },
  0x09: {
    opcode: 0x09,
    mnemonic: "MOV_AC",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタAをCにコピー",
  },
  0x0a: {
    opcode: 0x0a,
    mnemonic: "MOV_CA",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタCをAにコピー",
  },
  0x0b: {
    opcode: 0x0b,
    mnemonic: "MOV_CD",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタCをDにコピー",
  },
  0x0c: {
    opcode: 0x0c,
    mnemonic: "MOV_DC",
    length: 1,
    type: "DATA_MOVE",
    description: "レジスタDをCにコピー",
  },
  0x0d: {
    opcode: 0x0d,
    mnemonic: "MOV_SP",
    length: 1,
    type: "DATA_MOVE",
    description: "スタックポインタをAレジスタにコピー",
  },
  0x0e: {
    opcode: 0x0e,
    mnemonic: "SET_SP",
    length: 1,
    type: "DATA_MOVE",
    description: "Aレジスタをスタックポインタにコピー",
  },

  // 算術演算命令（16bit演算）
  0x10: {
    opcode: 0x10,
    mnemonic: "INC_A",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタAをインクリメント",
  },
  0x11: {
    opcode: 0x11,
    mnemonic: "INC_B",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタBをインクリメント",
  },
  0x12: {
    opcode: 0x12,
    mnemonic: "INC_C",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタCをインクリメント",
  },
  0x13: {
    opcode: 0x13,
    mnemonic: "INC_D",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタDをインクリメント",
  },
  0x14: {
    opcode: 0x14,
    mnemonic: "DEC_A",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタAをデクリメント",
  },
  0x15: {
    opcode: 0x15,
    mnemonic: "DEC_B",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタBをデクリメント",
  },
  0x16: {
    opcode: 0x16,
    mnemonic: "DEC_C",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタCをデクリメント",
  },
  0x17: {
    opcode: 0x17,
    mnemonic: "DEC_D",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタDをデクリメント",
  },
  0x18: {
    opcode: 0x18,
    mnemonic: "ADD_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A + B",
  },
  0x19: {
    opcode: 0x19,
    mnemonic: "SUB_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A - B",
  },
  0x1a: {
    opcode: 0x1a,
    mnemonic: "XOR_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A XOR B",
  },
  0x1b: {
    opcode: 0x1b,
    mnemonic: "AND_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A AND B",
  },
  0x1c: {
    opcode: 0x1c,
    mnemonic: "OR_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A OR B",
  },
  0x1d: {
    opcode: 0x1d,
    mnemonic: "NOT_A",
    length: 1,
    type: "ARITHMETIC",
    description: "A = NOT A",
  },
  0x1e: {
    opcode: 0x1e,
    mnemonic: "CMP_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A - B（フラグのみ更新）",
  },

  // スタック操作
  0x1f: {
    opcode: 0x1f,
    mnemonic: "PUSH_A",
    length: 1,
    type: "STACK",
    description: "Aレジスタをスタックにプッシュ",
  },
  0x20: {
    opcode: 0x20,
    mnemonic: "PUSH_B",
    length: 1,
    type: "STACK",
    description: "Bレジスタをスタックにプッシュ",
  },
  0x21: {
    opcode: 0x21,
    mnemonic: "PUSH_C",
    length: 1,
    type: "STACK",
    description: "Cレジスタをスタックにプッシュ",
  },
  0x22: {
    opcode: 0x22,
    mnemonic: "PUSH_D",
    length: 1,
    type: "STACK",
    description: "Dレジスタをスタックにプッシュ",
  },
  0x2e: {
    opcode: 0x2e,
    mnemonic: "POP_A",
    length: 1,
    type: "STACK",
    description: "スタックからAレジスタにポップ",
  },
  0x2f: {
    opcode: 0x2f,
    mnemonic: "POP_B",
    length: 1,
    type: "STACK",
    description: "スタックからBレジスタにポップ",
  },
  0x30: {
    opcode: 0x30,
    mnemonic: "POP_C",
    length: 1,
    type: "STACK",
    description: "スタックからCレジスタにポップ",
  },
  0x31: {
    opcode: 0x31,
    mnemonic: "POP_D",
    length: 1,
    type: "STACK",
    description: "スタックからDレジスタにポップ",
  },
}

/** 3バイト命令（0x40-0x7F） */
export const THREE_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // メモリアクセス命令（相対アドレス）
  0x40: {
    opcode: 0x40,
    mnemonic: "LOAD_A",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[PC + offset]",
  },
  0x41: {
    opcode: 0x41,
    mnemonic: "STORE_A",
    length: 3,
    type: "MEMORY",
    description: "Memory[PC + offset] = A",
  },
  0x42: {
    opcode: 0x42,
    mnemonic: "LOAD_IND",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[B + offset]",
  },
  0x43: {
    opcode: 0x43,
    mnemonic: "STORE_IND",
    length: 3,
    type: "MEMORY",
    description: "Memory[B + offset] = A",
  },
  0x44: {
    opcode: 0x44,
    mnemonic: "LOAD_A_W",
    length: 3,
    type: "MEMORY",
    description: "A = Memory16[PC + offset]",
  },
  0x45: {
    opcode: 0x45,
    mnemonic: "STORE_A_W",
    length: 3,
    type: "MEMORY",
    description: "Memory16[PC + offset] = A",
  },

  // レジスタベースメモリアクセス命令
  0x50: {
    opcode: 0x50,
    mnemonic: "LOAD_REG",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[register]",
  },
  0x51: {
    opcode: 0x51,
    mnemonic: "STORE_REG",
    length: 3,
    type: "MEMORY",
    description: "Memory[register] = A",
  },

  // ジャンプ命令（相対）
  0x60: { opcode: 0x60, mnemonic: "JMP", length: 3, type: "JUMP", description: "PC = PC + offset" },
  0x61: {
    opcode: 0x61,
    mnemonic: "JZ",
    length: 3,
    type: "JUMP",
    description: "if Z then PC = PC + offset",
  },
  0x62: {
    opcode: 0x62,
    mnemonic: "JNZ",
    length: 3,
    type: "JUMP",
    description: "if !Z then PC = PC + offset",
  },
  0x63: {
    opcode: 0x63,
    mnemonic: "JC",
    length: 3,
    type: "JUMP",
    description: "if C then PC = PC + offset",
  },
  0x64: {
    opcode: 0x64,
    mnemonic: "JNC",
    length: 3,
    type: "JUMP",
    description: "if !C then PC = PC + offset",
  },
  0x65: {
    opcode: 0x65,
    mnemonic: "CALL",
    length: 3,
    type: "JUMP",
    description: "push PC+3; PC = PC + offset",
  },
  0x66: { opcode: 0x66, mnemonic: "RET", length: 3, type: "JUMP", description: "PC = pop()" },

  // 即値ロード命令（16bit）
  0x70: {
    opcode: 0x70,
    mnemonic: "MOV_A_IMM",
    length: 3,
    type: "DATA_MOVE",
    description: "A = immediate16",
  },
  0x71: {
    opcode: 0x71,
    mnemonic: "MOV_B_IMM",
    length: 3,
    type: "DATA_MOVE",
    description: "B = immediate16",
  },
  0x72: {
    opcode: 0x72,
    mnemonic: "MOV_C_IMM",
    length: 3,
    type: "DATA_MOVE",
    description: "C = immediate16",
  },
  0x73: {
    opcode: 0x73,
    mnemonic: "MOV_D_IMM",
    length: 3,
    type: "DATA_MOVE",
    description: "D = immediate16",
  },

  // 即値演算命令
  0x74: {
    opcode: 0x74,
    mnemonic: "ADD_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A = A + immediate16",
  },
  0x75: {
    opcode: 0x75,
    mnemonic: "SUB_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A = A - immediate16",
  },
  0x76: {
    opcode: 0x76,
    mnemonic: "AND_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A = A AND immediate16",
  },
  0x77: {
    opcode: 0x77,
    mnemonic: "OR_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A = A OR immediate16",
  },
  0x78: {
    opcode: 0x78,
    mnemonic: "XOR_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A = A XOR immediate16",
  },
  0x79: {
    opcode: 0x79,
    mnemonic: "CMP_A_IMM",
    length: 3,
    type: "ARITHMETIC",
    description: "A - immediate16（フラグのみ）",
  },
}

/** 4バイト命令（0x80-0xBF） */
export const FOUR_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // 絶対アドレスメモリアクセス
  0x80: {
    opcode: 0x80,
    mnemonic: "LOAD_ABS",
    length: 4,
    type: "MEMORY",
    description: "A = Memory[address16]",
  },
  0x81: {
    opcode: 0x81,
    mnemonic: "STORE_ABS",
    length: 4,
    type: "MEMORY",
    description: "Memory[address16] = A",
  },
  0x82: {
    opcode: 0x82,
    mnemonic: "LOAD_ABS_W",
    length: 4,
    type: "MEMORY",
    description: "A = Memory16[address16]",
  },
  0x83: {
    opcode: 0x83,
    mnemonic: "STORE_ABS_W",
    length: 4,
    type: "MEMORY",
    description: "Memory16[address16] = A",
  },

  // 絶対ジャンプ
  0x90: {
    opcode: 0x90,
    mnemonic: "JMP_ABS",
    length: 4,
    type: "JUMP",
    description: "PC = address16",
  },
  0x91: {
    opcode: 0x91,
    mnemonic: "CALL_ABS",
    length: 4,
    type: "JUMP",
    description: "push PC+4; PC = address16",
  },

  // ユニット制御命令（3バイト目: ユニット識別子、4バイト目: アドレス）
  0xa0: {
    opcode: 0xa0,
    mnemonic: "UNIT_MEM_READ",
    length: 4,
    type: "UNIT",
    description: "B = Unit[A].Memory[addr]",
  },
  0xa1: {
    opcode: 0xa1,
    mnemonic: "UNIT_MEM_WRITE",
    length: 4,
    type: "UNIT",
    description: "Unit[A].Memory[addr] = C",
  },
}

/** 5バイト命令（0xC0-0xFF） */
export const FIVE_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // 特殊命令
  0xc0: {
    opcode: 0xc0,
    mnemonic: "SCAN",
    length: 5,
    type: "SPECIAL",
    description: "自身のスペック読み取り",
  },
  0xc1: {
    opcode: 0xc1,
    mnemonic: "ENERGY",
    length: 5,
    type: "SPECIAL",
    description: "エネルギー操作",
  },
  0xc2: {
    opcode: 0xc2,
    mnemonic: "SCANM",
    length: 5,
    type: "SPECIAL",
    description: "メモリブロック読み取り",
  },
  0xc3: {
    opcode: 0xc3,
    mnemonic: "ASSEMBLE",
    length: 5,
    type: "SPECIAL",
    description: "ユニット構築命令",
  },
  // 拡張演算命令
  0xd0: {
    opcode: 0xd0,
    mnemonic: "MUL_AB",
    length: 5,
    type: "ARITHMETIC",
    description: "A = (A * B) & 0xFFFF",
  },
  0xd1: {
    opcode: 0xd1,
    mnemonic: "DIV_AB",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A / B, B = A % B",
  },
  0xd2: {
    opcode: 0xd2,
    mnemonic: "SHL",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A << B（論理左シフト）",
  },
  0xd3: {
    opcode: 0xd3,
    mnemonic: "SHR",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A >> B（論理右シフト）",
  },

  // 特殊命令
  0xff: { opcode: 0xff, mnemonic: "HALT", length: 5, type: "SPECIAL", description: "実行停止" },
}

/** 全命令マップ */
export const ALL_INSTRUCTIONS = new Map<number, Instruction>([
  ...Object.entries(ONE_BYTE_INSTRUCTIONS).map(([k, v]) => [Number(k), v] as [number, Instruction]),
  ...Object.entries(THREE_BYTE_INSTRUCTIONS).map(
    ([k, v]) => [Number(k), v] as [number, Instruction]
  ),
  ...Object.entries(FOUR_BYTE_INSTRUCTIONS).map(
    ([k, v]) => [Number(k), v] as [number, Instruction]
  ),
  ...Object.entries(FIVE_BYTE_INSTRUCTIONS).map(
    ([k, v]) => [Number(k), v] as [number, Instruction]
  ),
])

/** 命令長判定 */
export function getInstructionLength(opcode: number): number {
  if (opcode >= 0x00 && opcode <= 0x3f) {
    return 1
  }
  if (opcode >= 0x40 && opcode <= 0x7f) {
    return 3
  }
  if (opcode >= 0x80 && opcode <= 0xbf) {
    return 4
  }
  if (opcode >= 0xc0 && opcode <= 0xff) {
    return 5
  }
  return 1 // 未定義命令も1バイトとして扱う
}

/** 命令取得 */
export function getInstruction(opcode: number): Instruction | null {
  return ALL_INSTRUCTIONS.get(opcode) ?? null
}

/** 未定義命令チェック */
export function isUndefinedInstruction(opcode: number): boolean {
  return !ALL_INSTRUCTIONS.has(opcode)
}
