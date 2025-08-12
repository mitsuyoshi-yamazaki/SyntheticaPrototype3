/**
 * Synthetica Script VM 命令セット定義
 * docs/spec-v3/synthetica-script.md 仕様準拠
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
  | "TEMPLATE"
  | "ENERGY"

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
    description: "レジスタAをインクリメント（16bit）",
  },
  0x11: {
    opcode: 0x11,
    mnemonic: "INC_B",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタBをインクリメント（16bit）",
  },
  0x12: {
    opcode: 0x12,
    mnemonic: "INC_C",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタCをインクリメント（16bit）",
  },
  0x13: {
    opcode: 0x13,
    mnemonic: "INC_D",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタDをインクリメント（16bit）",
  },
  0x14: {
    opcode: 0x14,
    mnemonic: "DEC_A",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタAをデクリメント（16bit）",
  },
  0x15: {
    opcode: 0x15,
    mnemonic: "DEC_B",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタBをデクリメント（16bit）",
  },
  0x16: {
    opcode: 0x16,
    mnemonic: "DEC_C",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタCをデクリメント（16bit）",
  },
  0x17: {
    opcode: 0x17,
    mnemonic: "DEC_D",
    length: 1,
    type: "ARITHMETIC",
    description: "レジスタDをデクリメント（16bit）",
  },
  0x18: {
    opcode: 0x18,
    mnemonic: "ADD_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A + B（16bit加算、キャリーフラグ更新）",
  },
  0x19: {
    opcode: 0x19,
    mnemonic: "SUB_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A - B（16bit減算、キャリーフラグ更新）",
  },
  0x1a: {
    opcode: 0x1a,
    mnemonic: "XOR_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A XOR B（16bit XOR、ゼロフラグ更新）",
  },
  0x1b: {
    opcode: 0x1b,
    mnemonic: "AND_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A AND B（16bit AND、ゼロフラグ更新）",
  },
  0x1c: {
    opcode: 0x1c,
    mnemonic: "OR_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A = A OR B（16bit OR、ゼロフラグ更新）",
  },
  0x1d: {
    opcode: 0x1d,
    mnemonic: "NOT_A",
    length: 1,
    type: "ARITHMETIC",
    description: "A = NOT A（16bit NOT、ゼロフラグ更新）",
  },
  0x1e: {
    opcode: 0x1e,
    mnemonic: "CMP_AB",
    length: 1,
    type: "ARITHMETIC",
    description: "A - B（16bit比較、フラグのみ更新、Aは変更なし）",
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
    description: "A = Memory[PC + 符号付き16bitオフセット]",
  },
  0x41: {
    opcode: 0x41,
    mnemonic: "STORE_A",
    length: 3,
    type: "MEMORY",
    description: "Memory[PC + 符号付き16bitオフセット] = A & 0xFF",
  },
  0x42: {
    opcode: 0x42,
    mnemonic: "LOAD_IND",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[B + 符号付き16bitオフセット]",
  },
  0x43: {
    opcode: 0x43,
    mnemonic: "STORE_IND",
    length: 3,
    type: "MEMORY",
    description: "Memory[B + 符号付き16bitオフセット] = A & 0xFF",
  },
  0x44: {
    opcode: 0x44,
    mnemonic: "LOAD_A_W",
    length: 3,
    type: "MEMORY",
    description: "A = Memory16[PC + 符号付き16bitオフセット]",
  },
  0x45: {
    opcode: 0x45,
    mnemonic: "STORE_A_W",
    length: 3,
    type: "MEMORY",
    description: "Memory16[PC + 符号付き16bitオフセット] = A",
  },

  // レジスタベースメモリアクセス命令
  0x50: {
    opcode: 0x50,
    mnemonic: "LOAD_REG",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[レジスタ値]",
  },
  0x51: {
    opcode: 0x51,
    mnemonic: "STORE_REG",
    length: 3,
    type: "MEMORY",
    description: "Memory[レジスタ値] = A & 0xFF",
  },
  0x52: {
    opcode: 0x52,
    mnemonic: "LOAD_IND_REG",
    length: 3,
    type: "MEMORY",
    description: "A = Memory[Memory16[アドレス]]（間接）",
  },
  0x53: {
    opcode: 0x53,
    mnemonic: "STORE_IND_REG",
    length: 3,
    type: "MEMORY",
    description: "Memory[Memory16[アドレス]] = A & 0xFF（間接）",
  },

  // 制御命令
  0x60: {
    opcode: 0x60,
    mnemonic: "JMP",
    length: 3,
    type: "JUMP",
    description: "PC = PC + 符号付き16bitオフセット",
  },
  0x61: {
    opcode: 0x61,
    mnemonic: "JZ",
    length: 3,
    type: "JUMP",
    description: "ゼロフラグがセットならジャンプ",
  },
  0x62: {
    opcode: 0x62,
    mnemonic: "JNZ",
    length: 3,
    type: "JUMP",
    description: "ゼロフラグがクリアならジャンプ",
  },
  0x63: {
    opcode: 0x63,
    mnemonic: "JC",
    length: 3,
    type: "JUMP",
    description: "キャリーフラグがセットならジャンプ（unsigned <）",
  },
  0x64: {
    opcode: 0x64,
    mnemonic: "JNC",
    length: 3,
    type: "JUMP",
    description: "キャリーフラグがクリアならジャンプ（unsigned >=）",
  },
  0x65: {
    opcode: 0x65,
    mnemonic: "CALL",
    length: 3,
    type: "JUMP",
    description: "Cレジスタに戻り先を保存してジャンプ",
  },
  0x66: {
    opcode: 0x66,
    mnemonic: "JG",
    length: 3,
    type: "JUMP",
    description: "符号付き大なり（A > B after CMP_AB）",
  },
  0x67: {
    opcode: 0x67,
    mnemonic: "JLE",
    length: 3,
    type: "JUMP",
    description: "符号付き以下（A <= B after CMP_AB）",
  },
  0x68: {
    opcode: 0x68,
    mnemonic: "JGE",
    length: 3,
    type: "JUMP",
    description: "符号付き以上（A >= B after CMP_AB）",
  },
  0x69: {
    opcode: 0x69,
    mnemonic: "JL",
    length: 3,
    type: "JUMP",
    description: "符号付き小なり（A < B after CMP_AB）",
  },
}

/** 4バイト命令（0x80-0xBF） */
export const FOUR_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // パターンマッチング命令
  0x80: {
    opcode: 0x80,
    mnemonic: "SEARCH_F",
    length: 4,
    type: "TEMPLATE",
    description: "前方検索（可変長テンプレート）",
  },
  0x81: {
    opcode: 0x81,
    mnemonic: "SEARCH_B",
    length: 4,
    type: "TEMPLATE",
    description: "後方検索",
  },
  0x82: {
    opcode: 0x82,
    mnemonic: "SEARCH_F_MAX",
    length: 4,
    type: "TEMPLATE",
    description: "前方検索（最大距離指定）",
  },
  0x83: {
    opcode: 0x83,
    mnemonic: "SEARCH_B_MAX",
    length: 4,
    type: "TEMPLATE",
    description: "後方検索（最大距離指定）",
  },

  // ユニット操作命令（メモリマップドI/O）
  0x90: {
    opcode: 0x90,
    mnemonic: "UNIT_MEM_READ",
    length: 4,
    type: "UNIT",
    description: "外部ユニットメモリ読み取り",
  },
  0x91: {
    opcode: 0x91,
    mnemonic: "UNIT_MEM_WRITE",
    length: 4,
    type: "UNIT",
    description: "外部ユニットメモリ書き込み",
  },
  0x92: {
    opcode: 0x92,
    mnemonic: "UNIT_MEM_READ_REG",
    length: 4,
    type: "UNIT",
    description: "レジスタ指定で外部ユニットメモリ読み取り",
  },
  0x93: {
    opcode: 0x93,
    mnemonic: "UNIT_MEM_WRITE_REG",
    length: 4,
    type: "UNIT",
    description: "レジスタ指定で外部ユニットメモリ書き込み",
  },
  0x94: {
    opcode: 0x94,
    mnemonic: "UNIT_EXISTS",
    length: 4,
    type: "UNIT",
    description: "ユニット存在確認",
  },

  // エネルギー計算命令（1024進法32bit演算）
  0x95: {
    opcode: 0x95,
    mnemonic: "ADD_E32",
    length: 4,
    type: "ENERGY",
    description: "32bitエネルギー加算",
  },
  0x96: {
    opcode: 0x96,
    mnemonic: "SUB_E32",
    length: 4,
    type: "ENERGY",
    description: "32bitエネルギー減算",
  },
  0x97: {
    opcode: 0x97,
    mnemonic: "CMP_E32",
    length: 4,
    type: "ENERGY",
    description: "32bitエネルギー比較",
  },
  0x98: {
    opcode: 0x98,
    mnemonic: "SHR_E10",
    length: 4,
    type: "ENERGY",
    description: "エネルギー値を1024で除算",
  },
  0x99: {
    opcode: 0x99,
    mnemonic: "SHL_E10",
    length: 4,
    type: "ENERGY",
    description: "エネルギー値を1024倍",
  },

  // 動的ユニット操作命令
  0x9b: {
    opcode: 0x9b,
    mnemonic: "UNIT_MEM_WRITE_DYN",
    length: 4,
    type: "UNIT",
    description:
      "レジスタ指定アドレスへのユニットメモリ書き込み（第3バイト: アドレス指定レジスタ 0=A, 1=B, 2=C, 3=D）",
  },

  // メモリアクセス命令（絶対アドレス）
  0xa0: {
    opcode: 0xa0,
    mnemonic: "LOAD_ABS",
    length: 4,
    type: "MEMORY",
    description: "A = Memory[16bitアドレス]",
  },
  0xa1: {
    opcode: 0xa1,
    mnemonic: "STORE_ABS",
    length: 4,
    type: "MEMORY",
    description: "Memory[16bitアドレス] = A & 0xFF",
  },
  0xa2: {
    opcode: 0xa2,
    mnemonic: "LOAD_ABS_W",
    length: 4,
    type: "MEMORY",
    description: "A = Memory16[16bitアドレス]",
  },
  0xa3: {
    opcode: 0xa3,
    mnemonic: "STORE_ABS_W",
    length: 4,
    type: "MEMORY",
    description: "Memory16[16bitアドレス] = A",
  },

  // 間接ジャンプ命令
  0xb0: {
    opcode: 0xb0,
    mnemonic: "JMP_IND",
    length: 4,
    type: "JUMP",
    description: "PC = レジスタの値",
  },
  0xb1: {
    opcode: 0xb1,
    mnemonic: "JMP_ABS",
    length: 4,
    type: "JUMP",
    description: "PC = 16bitアドレス",
  },
  0xb2: {
    opcode: 0xb2,
    mnemonic: "RET",
    length: 4,
    type: "JUMP",
    description: "PC = C（CALLからの復帰専用）",
  },
}

/** 5バイト命令（0xC0-0xFF） */
export const FIVE_BYTE_INSTRUCTIONS: Record<number, Instruction> = {
  // 拡張演算命令
  0xc0: {
    opcode: 0xc0,
    mnemonic: "MUL_AB",
    length: 5,
    type: "ARITHMETIC",
    description: "A = (A * B) & 0xFFFF",
  },
  0xc1: {
    opcode: 0xc1,
    mnemonic: "DIV_AB",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A / B, B = A % B",
  },
  0xc2: {
    opcode: 0xc2,
    mnemonic: "SHL",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A << B（論理左シフト）",
  },
  0xc3: {
    opcode: 0xc3,
    mnemonic: "SHR",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A >> B（論理右シフト）",
  },
  0xc4: {
    opcode: 0xc4,
    mnemonic: "SAR",
    length: 5,
    type: "ARITHMETIC",
    description: "A = A >>> B（算術右シフト）",
  },

  // 条件付き移動命令
  0xc5: {
    opcode: 0xc5,
    mnemonic: "CMOV_Z",
    length: 5,
    type: "DATA_MOVE",
    description: "ゼロフラグがセットされている場合のみレジスタ移動",
  },
  0xc6: {
    opcode: 0xc6,
    mnemonic: "CMOV_NZ",
    length: 5,
    type: "DATA_MOVE",
    description: "ゼロフラグがクリアされている場合のみレジスタ移動",
  },
  0xc7: {
    opcode: 0xc7,
    mnemonic: "CMOV_C",
    length: 5,
    type: "DATA_MOVE",
    description: "キャリーフラグがセットされている場合のみレジスタ移動",
  },
  0xc8: {
    opcode: 0xc8,
    mnemonic: "CMOV_NC",
    length: 5,
    type: "DATA_MOVE",
    description: "キャリーフラグがクリアされている場合のみレジスタ移動",
  },

  // 即値ロード命令
  0xe0: {
    opcode: 0xe0,
    mnemonic: "LOAD_IMM",
    length: 5,
    type: "DATA_MOVE",
    description: "A = 16bit即値（第2,3バイト: リトルエンディアン、第4,5バイト: 未使用）",
  },
  0xe1: {
    opcode: 0xe1,
    mnemonic: "LOAD_IMM_B",
    length: 5,
    type: "DATA_MOVE",
    description: "B = 16bit即値（第2,3バイト: リトルエンディアン、第4,5バイト: 未使用）",
  },

  // NOP命令
  0xf0: {
    opcode: 0xf0,
    mnemonic: "NOP5",
    length: 5,
    type: "NOP",
    description: "5バイトNOP（パディング用）",
  },
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
export const getInstructionLength = (opcode: number): number => {
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
export const getInstruction = (opcode: number): Instruction | null => {
  return ALL_INSTRUCTIONS.get(opcode) ?? null
}

/** 未定義命令チェック */
export const isUndefinedInstruction = (opcode: number): boolean => {
  return !ALL_INSTRUCTIONS.has(opcode)
}
