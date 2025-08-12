import { Instruction } from "./vm-instructions"
import { RegisterName } from "./vm-state"

// 1バイト命令
export type InstructionNop0 = Instruction & { readonly mnemonic: "NOP0" }
export type InstructionNop1 = Instruction & { readonly mnemonic: "NOP1" }
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
export type InstructionPushA = Instruction & { readonly mnemonic: "PUSH_A" }
export type InstructionPushB = Instruction & { readonly mnemonic: "PUSH_B" }
export type InstructionPushC = Instruction & { readonly mnemonic: "PUSH_C" }
export type InstructionPushD = Instruction & { readonly mnemonic: "PUSH_D" }
export type InstructionPopA = Instruction & { readonly mnemonic: "POP_A" }
export type InstructionPopB = Instruction & { readonly mnemonic: "POP_B" }
export type InstructionPopC = Instruction & { readonly mnemonic: "POP_C" }
export type InstructionPopD = Instruction & { readonly mnemonic: "POP_D" }

type OperandOffset16 = { readonly offset16: number } /** 16bit符号付きオフセット（3バイト命令） */
type OperandRegister = { readonly register: RegisterName } /** レジスタ名 */

// 3バイト命令
export type InstructionLoadA = Instruction & { readonly mnemonic: "LOAD_A", readonly operand: OperandOffset16 }
export type InstructionStoreA = Instruction & { readonly mnemonic: "STORE_A", readonly operand: OperandOffset16 }
export type InstructionLoadInd = Instruction & { readonly mnemonic: "LOAD_IND", readonly operand: OperandOffset16 }
export type InstructionStoreInd = Instruction & { readonly mnemonic: "STORE_IND", readonly operand: OperandOffset16 }
export type InstructionLoadAW = Instruction & { readonly mnemonic: "LOAD_A_W", readonly operand: OperandOffset16 }
export type InstructionStoreAW = Instruction & { readonly mnemonic: "STORE_A_W", readonly operand: OperandOffset16 }

export type InstructionLoadReg = Instruction & { readonly mnemonic: "LOAD_REG", readonly operand: OperandRegister }
export type InstructionStoreReg = Instruction & { readonly mnemonic: "STORE_REG", readonly operand: OperandRegister }
export type InstructionLoadIndReg = Instruction & { readonly mnemonic: "LOAD_IND_REG", readonly operand: OperandRegister }
export type InstructionStoreIndReg = Instruction & { readonly mnemonic: "STORE_IND_REG", readonly operand: OperandRegister }

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
