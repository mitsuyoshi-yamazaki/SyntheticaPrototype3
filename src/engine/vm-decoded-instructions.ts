import { UnitType } from "../types/game"
import { Instruction } from "./vm-instructions"
import { RegisterName } from "./vm-state"

type OperandOffset16 = { readonly offset16: number } /** 16bit符号付きオフセット */
type OperandAddress16 = { readonly address16: number } /** 16bit絶対アドレス */
type OperandImmediate16 = { readonly immediate16: number } /** 16bit即値 */
type OperandRegister = { readonly register: RegisterName } /** レジスタ名 */
type OperandRegisters = {
  readonly sourceRegister: RegisterName
  readonly destinationRegister: RegisterName
}
type OperandUnit = {
  readonly unitType: UnitType
  readonly unitIndex: number
}


// 1バイト命令
// テンプレート用NOP
export type InstructionNop0 = Instruction & { readonly mnemonic: "NOP0" }
export type InstructionNop1 = Instruction & { readonly mnemonic: "NOP1" }

// データ移動命令
export type InstructionXchg = Instruction & { readonly mnemonic: "XCHG" }
export type InstructionMovAb = Instruction & { readonly mnemonic: "MOV_AB" }
export type InstructionMovAd = Instruction & { readonly mnemonic: "MOV_AD" }
export type InstructionMovBa = Instruction & { readonly mnemonic: "MOV_BA" }
export type InstructionMovDa = Instruction & { readonly mnemonic: "MOV_DA" }
export type InstructionMovBc = Instruction & { readonly mnemonic: "MOV_BC" }
export type InstructionMovCb = Instruction & { readonly mnemonic: "MOV_CB" }
export type InstructionMovAc = Instruction & { readonly mnemonic: "MOV_AC" }
export type InstructionMovCa = Instruction & { readonly mnemonic: "MOV_CA" }
export type InstructionMovCd = Instruction & { readonly mnemonic: "MOV_CD" }
export type InstructionMovDc = Instruction & { readonly mnemonic: "MOV_DC" }
export type InstructionMovSp = Instruction & { readonly mnemonic: "MOV_SP" }
export type InstructionSetSp = Instruction & { readonly mnemonic: "SET_SP" }

// 算術演算命令（16bit演算）
export type InstructionIncA = Instruction & { readonly mnemonic: "INC_A" }
export type InstructionIncB = Instruction & { readonly mnemonic: "INC_B" }
export type InstructionIncC = Instruction & { readonly mnemonic: "INC_C" }
export type InstructionIncD = Instruction & { readonly mnemonic: "INC_D" }
export type InstructionDecA = Instruction & { readonly mnemonic: "DEC_A" }
export type InstructionDecB = Instruction & { readonly mnemonic: "DEC_B" }
export type InstructionDecC = Instruction & { readonly mnemonic: "DEC_C" }
export type InstructionDecD = Instruction & { readonly mnemonic: "DEC_D" }
export type InstructionAddAb = Instruction & { readonly mnemonic: "ADD_AB" }
export type InstructionSubAb = Instruction & { readonly mnemonic: "SUB_AB" }
export type InstructionXorAb = Instruction & { readonly mnemonic: "XOR_AB" }
export type InstructionAndAb = Instruction & { readonly mnemonic: "AND_AB" }
export type InstructionOrAb = Instruction & { readonly mnemonic: "OR_AB" }
export type InstructionNotA = Instruction & { readonly mnemonic: "NOT_A" }
export type InstructionCmpAb = Instruction & { readonly mnemonic: "CMP_AB" }

// スタック操作
export type InstructionPushA = Instruction & { readonly mnemonic: "PUSH_A" }
export type InstructionPushB = Instruction & { readonly mnemonic: "PUSH_B" }
export type InstructionPushC = Instruction & { readonly mnemonic: "PUSH_C" }
export type InstructionPushD = Instruction & { readonly mnemonic: "PUSH_D" }
export type InstructionPopA = Instruction & { readonly mnemonic: "POP_A" }
export type InstructionPopB = Instruction & { readonly mnemonic: "POP_B" }
export type InstructionPopC = Instruction & { readonly mnemonic: "POP_C" }
export type InstructionPopD = Instruction & { readonly mnemonic: "POP_D" }


// 3バイト命令
// メモリアクセス命令（相対アドレス）
export type InstructionLoadA = Instruction & { readonly mnemonic: "LOAD_A", readonly operand: OperandOffset16 }
export type InstructionStoreA = Instruction & { readonly mnemonic: "STORE_A", readonly operand: OperandOffset16 }
export type InstructionLoadInd = Instruction & { readonly mnemonic: "LOAD_IND", readonly operand: OperandOffset16 }
export type InstructionStoreInd = Instruction & { readonly mnemonic: "STORE_IND", readonly operand: OperandOffset16 }
export type InstructionLoadAW = Instruction & { readonly mnemonic: "LOAD_A_W", readonly operand: OperandOffset16 }
export type InstructionStoreAW = Instruction & { readonly mnemonic: "STORE_A_W", readonly operand: OperandOffset16 }

// レジスタベースメモリアクセス命令
export type InstructionLoadReg = Instruction & { readonly mnemonic: "LOAD_REG", readonly operand: OperandRegister }
export type InstructionStoreReg = Instruction & { readonly mnemonic: "STORE_REG", readonly operand: OperandRegister }
export type InstructionLoadIndReg = Instruction & { readonly mnemonic: "LOAD_IND_REG", readonly operand: OperandRegister }
export type InstructionStoreIndReg = Instruction & { readonly mnemonic: "STORE_IND_REG", readonly operand: OperandRegister }

// 制御命令
export type InstructionJmp = Instruction & { readonly mnemonic: "JMP", readonly operand: OperandOffset16 }
export type InstructionJz = Instruction & { readonly mnemonic: "JZ", readonly operand: OperandOffset16 }
export type InstructionJnz = Instruction & { readonly mnemonic: "JNZ", readonly operand: OperandOffset16 }
export type InstructionJc = Instruction & { readonly mnemonic: "JC", readonly operand: OperandOffset16 }
export type InstructionJnc = Instruction & { readonly mnemonic: "JNC", readonly operand: OperandOffset16 }
export type InstructionCall = Instruction & { readonly mnemonic: "CALL", readonly operand: OperandOffset16 }
export type InstructionJg = Instruction & { readonly mnemonic: "JG", readonly operand: OperandOffset16 }
export type InstructionJle = Instruction & { readonly mnemonic: "JLE", readonly operand: OperandOffset16 }
export type InstructionJge = Instruction & { readonly mnemonic: "JGE", readonly operand: OperandOffset16 }
export type InstructionJl = Instruction & { readonly mnemonic: "JL", readonly operand: OperandOffset16 }

// 4バイト命令
// パターンマッチング命令
export type InstructionSearchF = Instruction & { readonly mnemonic: "SEARCH_F" }
export type InstructionSearchB = Instruction & { readonly mnemonic: "SEARCH_B" }
export type InstructionSearchFMax = Instruction & { readonly mnemonic: "SEARCH_F_MAX" }
export type InstructionSearchBMax = Instruction & { readonly mnemonic: "SEARCH_B_MAX" }

// ユニット操作命令（メモリマップドI/O）
export type InstructionUnitMemRead = Instruction & { readonly mnemonic: "UNIT_MEM_READ", readonly operand: OperandUnit }
export type InstructionUnitMemWrite = Instruction & { readonly mnemonic: "UNIT_MEM_WRITE", readonly operand: OperandUnit }
export type InstructionUnitMemReadReg = Instruction & { readonly mnemonic: "UNIT_MEM_READ_REG", readonly operand: OperandUnit }
export type InstructionUnitMemWriteReg = Instruction & { readonly mnemonic: "UNIT_MEM_WRITE_REG", readonly operand: OperandUnit }
export type InstructionUnitExists = Instruction & { readonly mnemonic: "UNIT_EXISTS", readonly operand: OperandUnit }

// エネルギー計算命令（1024進法32bit演算）
export type InstructionAddE32 = Instruction & { readonly mnemonic: "ADD_E32" }
export type InstructionSubE32 = Instruction & { readonly mnemonic: "SUB_E32" }
export type InstructionCmpE32 = Instruction & { readonly mnemonic: "CMP_E32" }
export type InstructionShrE10 = Instruction & { readonly mnemonic: "SHR_E10" }
export type InstructionShlE10 = Instruction & { readonly mnemonic: "SHL_E10" }

// 動的ユニット操作命令
export type InstructionUnitMemWriteDyn = Instruction & { readonly mnemonic: "UNIT_MEM_WRITE_DYN", readonly operand: OperandUnit & OperandRegister }

// メモリアクセス命令（絶対アドレス）
export type InstructionLoadAbs = Instruction & { readonly mnemonic: "LOAD_ABS", readonly operand: OperandAddress16 }
export type InstructionStoreAbs = Instruction & { readonly mnemonic: "STORE_ABS", readonly operand: OperandAddress16 }
export type InstructionLoadAbsW = Instruction & { readonly mnemonic: "LOAD_ABS_W", readonly operand: OperandAddress16 }
export type InstructionStoreAbsW = Instruction & { readonly mnemonic: "STORE_ABS_W", readonly operand: OperandAddress16 }

// 間接ジャンプ命令
export type InstructionJmpInd = Instruction & { readonly mnemonic: "JMP_IND", readonly operand: OperandRegister }
export type InstructionJmpAbs = Instruction & { readonly mnemonic: "JMP_ABS", readonly operand: OperandAddress16 }
export type InstructionRet = Instruction & { readonly mnemonic: "RET" }

// 5バイト命令
// 拡張演算命令
export type InstructionMulAb = Instruction & { readonly mnemonic: "MUL_AB" }
export type InstructionDivAb = Instruction & { readonly mnemonic: "DIV_AB" }
export type InstructionShl = Instruction & { readonly mnemonic: "SHL" }
export type InstructionShr = Instruction & { readonly mnemonic: "SHR" }
export type InstructionSar = Instruction & { readonly mnemonic: "SAR" }

// 条件付き移動命令
export type InstructionCmovZ = Instruction & { readonly mnemonic: "CMOV_Z", readonly operand: OperandRegisters }
export type InstructionCmovNz = Instruction & { readonly mnemonic: "CMOV_NZ", readonly operand: OperandRegisters }
export type InstructionCmovC = Instruction & { readonly mnemonic: "CMOV_C", readonly operand: OperandRegisters }
export type InstructionCmovNc = Instruction & { readonly mnemonic: "CMOV_NC", readonly operand: OperandRegisters }

// 即値ロード命令
export type InstructionLoadImm = Instruction & { readonly mnemonic: "LOAD_IMM", readonly operand: OperandImmediate16 }
export type InstructionLoadImmB = Instruction & { readonly mnemonic: "LOAD_IMM_B", readonly operand: OperandImmediate16 }

// NOP命令
export type InstructionNop5 = Instruction & { readonly mnemonic: "NOP5" }

export type DecodedInstruction =
  | InstructionNop0
  | InstructionNop1
  | InstructionXchg
  | InstructionMovAb
  | InstructionMovAd
  | InstructionMovBa
  | InstructionMovDa
  | InstructionMovBc
  | InstructionMovCb
  | InstructionMovAc
  | InstructionMovCa
  | InstructionMovCd
  | InstructionMovDc
  | InstructionMovSp
  | InstructionSetSp
  | InstructionIncA
  | InstructionIncB
  | InstructionIncC
  | InstructionIncD
  | InstructionDecA
  | InstructionDecB
  | InstructionDecC
  | InstructionDecD
  | InstructionAddAb
  | InstructionSubAb
  | InstructionXorAb
  | InstructionAndAb
  | InstructionOrAb
  | InstructionNotA
  | InstructionCmpAb
  | InstructionPushA
  | InstructionPushB
  | InstructionPushC
  | InstructionPushD
  | InstructionPopA
  | InstructionPopB
  | InstructionPopC
  | InstructionPopD
  | InstructionLoadA
  | InstructionStoreA
  | InstructionLoadInd
  | InstructionStoreInd
  | InstructionLoadAW
  | InstructionStoreAW
  | InstructionLoadReg
  | InstructionStoreReg
  | InstructionLoadIndReg
  | InstructionStoreIndReg
  | InstructionJmp
  | InstructionJz
  | InstructionJnz
  | InstructionJc
  | InstructionJnc
  | InstructionCall
  | InstructionJg
  | InstructionJle
  | InstructionJge
  | InstructionJl
  | InstructionSearchF
  | InstructionSearchB
  | InstructionSearchFMax
  | InstructionSearchBMax
  | InstructionUnitMemRead
  | InstructionUnitMemWrite
  | InstructionUnitMemReadReg
  | InstructionUnitMemWriteReg
  | InstructionUnitExists
  | InstructionAddE32
  | InstructionSubE32
  | InstructionCmpE32
  | InstructionShrE10
  | InstructionShlE10
  | InstructionUnitMemWriteDyn
  | InstructionLoadAbs
  | InstructionStoreAbs
  | InstructionLoadAbsW
  | InstructionStoreAbsW
  | InstructionJmpInd
  | InstructionJmpAbs
  | InstructionRet
  | InstructionMulAb
  | InstructionDivAb
  | InstructionShl
  | InstructionShr
  | InstructionSar
  | InstructionCmovZ
  | InstructionCmovNz
  | InstructionCmovC
  | InstructionCmovNc
  | InstructionLoadImm
  | InstructionLoadImmB
  | InstructionNop5
