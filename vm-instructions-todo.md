# VM命令テスト実装TODO

このファイルは、`src/engine/vm-instructions.test.ts`のテスト実装タスク一覧です。

## 作業概要

SyntheticaScript命令セットの仕様（`docs/spec-v3/synthetica-script.md`）に基づいて、網羅的なテストを実装する。

## 実装方針

- 各命令をdescribe()でグループ化
- InstructionExecutor.step()で命令実行
- 全テストで必ず検証する項目：
  - step()の返り値（success, error, cycles）
  - 実行前後のVM全状態（PC、全レジスタ、全フラグ）を`expectVMState()`で検証
  - 命令の操作対象（メモリ操作ならメモリ内容）の実行前後の状態

## タスク一覧

### 既存テストの修正
- [x] vm-instructions.test.ts冒頭のコメント更新
- [x] NOP0テストのsp期待値修正（0xffff → 0x09）
- [x] NOP1テストのsp期待値修正（0xffff → 0x09）
- [x] XCHGテストのsp期待値修正（0xffff → 0x09）

### 1バイト命令テスト実装（0x00-0x3F）

#### データ移動命令
- [x] 0x00: NOP0（既存・修正済み）
- [x] 0x01: NOP1（既存・修正済み）
- [x] 0x02: XCHG（既存・修正済み）
- [x] 0x03: MOV_AB
- [x] 0x04: MOV_AD
- [x] 0x05: MOV_BA
- [x] 0x06: MOV_DA
- [x] 0x07: MOV_BC
- [x] 0x08: MOV_CB
- [x] 0x09: MOV_AC
- [x] 0x0A: MOV_CA
- [x] 0x0B: MOV_CD
- [x] 0x0C: MOV_DC
- [x] 0x0D: MOV_SP
- [x] 0x0E: SET_SP

#### 算術演算命令（16bit演算）
- [x] 0x10: INC_A
- [x] 0x11: INC_B
- [x] 0x12: INC_C
- [x] 0x13: INC_D
- [x] 0x14: DEC_A
- [x] 0x15: DEC_B
- [x] 0x16: DEC_C
- [x] 0x17: DEC_D
- [x] 0x18: ADD_AB
- [x] 0x19: SUB_AB
- [x] 0x1A: XOR_AB
- [x] 0x1B: AND_AB
- [x] 0x1C: OR_AB
- [x] 0x1D: NOT_A
- [x] 0x1E: CMP_AB
- [x] 0x1F: PUSH_A
- [x] 0x20: PUSH_B
- [x] 0x21: PUSH_C
- [x] 0x22: PUSH_D
- [x] 0x2E: POP_A
- [x] 0x2F: POP_B
- [x] 0x30: POP_C
- [x] 0x31: POP_D

### 3バイト命令テスト実装（0x40-0x7F）

#### メモリアクセス命令（相対アドレス）
- [x] 0x40: LOAD_A
- [x] 0x41: STORE_A
- [x] 0x42: LOAD_IND
- [x] 0x43: STORE_IND
- [x] 0x44: LOAD_A_W
- [x] 0x45: STORE_A_W

#### レジスタベースメモリアクセス命令
- [x] 0x50: LOAD_REG
- [x] 0x51: STORE_REG
- [x] 0x52: LOAD_IND_REG
- [x] 0x53: STORE_IND_REG

#### 制御命令
- [x] 0x60: JMP
- [x] 0x61: JZ
- [x] 0x62: JNZ
- [x] 0x63: JC
- [x] 0x64: JNC
- [x] 0x65: CALL
- [x] 0x66: JG
- [x] 0x67: JLE
- [x] 0x68: JGE
- [x] 0x69: JL

### 4バイト命令テスト実装（0x80-0xBF）

#### パターンマッチング命令
- [x] 0x80: SEARCH_F（プレースホルダ）
- [x] 0x81: SEARCH_B（プレースホルダ）
- [x] 0x82: SEARCH_F_MAX（プレースホルダ）
- [x] 0x83: SEARCH_B_MAX（プレースホルダ）

#### ユニット操作命令（プレースホルダのみ）
- [x] 0x90: UNIT_MEM_READ（プレースホルダ）
- [x] 0x91: UNIT_MEM_WRITE（プレースホルダ）
- [x] 0x92: UNIT_MEM_READ_REG（プレースホルダ）
- [x] 0x93: UNIT_MEM_WRITE_REG（プレースホルダ）
- [x] 0x94: UNIT_EXISTS（プレースホルダ）
- [x] 0x9B: UNIT_MEM_WRITE_DYN（プレースホルダ）

#### エネルギー計算命令
- [x] 0x95: ADD_E32（プレースホルダ）
- [x] 0x96: SUB_E32（プレースホルダ）
- [x] 0x97: CMP_E32（プレースホルダ）
- [x] 0x98: SHR_E10（プレースホルダ）
- [x] 0x99: SHL_E10（プレースホルダ）

#### メモリアクセス命令（絶対アドレス）
- [ ] 0xA0: LOAD_ABS
- [ ] 0xA1: STORE_ABS
- [ ] 0xA2: LOAD_ABS_W
- [ ] 0xA3: STORE_ABS_W

#### 間接ジャンプ命令
- [ ] 0xB0: JMP_IND
- [ ] 0xB1: JMP_ABS
- [ ] 0xB2: RET

### 5バイト命令テスト実装（0xC0-0xFF）

#### 拡張演算命令
- [ ] 0xC0: MUL_AB
- [ ] 0xC1: DIV_AB
- [ ] 0xC2: SHL
- [ ] 0xC3: SHR
- [ ] 0xC4: SAR
- [ ] 0xC5: CMOV_Z
- [ ] 0xC6: CMOV_NZ
- [ ] 0xC7: CMOV_C
- [ ] 0xC8: CMOV_NC

#### 即値ロード命令
- [x] 0xE0: LOAD_IMM
- [x] 0xE1: LOAD_IMM_B

#### NOP命令
- [x] 0xF0: NOP5

### 未定義命令テスト実装

#### 1バイト未定義命令
- [ ] 0x0F
- [ ] 0x23-0x2D（11命令）
- [ ] 0x32-0x3F（14命令）

#### 3バイト未定義命令
- [ ] 0x46-0x4F（10命令）
- [ ] 0x54-0x5F（12命令）
- [ ] 0x6A-0x7F（22命令）

#### 4バイト未定義命令
- [ ] 0x84-0x8F（12命令）
- [ ] 0x9A-0x9F（6命令）
- [ ] 0xA4-0xAF（12命令）
- [ ] 0xB3-0xBF（13命令）

#### 5バイト未定義命令
- [ ] 0xC9-0xDF（23命令）
- [ ] 0xE2-0xEF（14命令）
- [ ] 0xF1-0xFF（15命令）

## 実装状況サマリー

### 完了済み
- ✅ 1バイト命令（0x00-0x3F）: すべて実装済み
- ✅ 3バイト命令（0x40-0x7F）: すべて実装済み
- ✅ 5バイト命令の一部（0xE0, 0xE1, 0xF0）: 実装済み
- ✅ プレースホルダ: パターンマッチング、ユニット操作、エネルギー計算

### 未実装
- ⏳ 4バイト命令の一部（0xA0-0xA3, 0xB0-0xB2）: メモリアクセス（絶対アドレス）、間接ジャンプ
- ⏳ 5バイト命令の一部（0xC0-0xC8）: 拡張演算命令
- ⏳ 未定義命令の一括テスト

## 実装優先度

1. ✅ 既存テストのsp期待値修正（完了）
2. ✅ 1バイト命令の基本命令（完了）
3. ✅ 3バイト命令（完了）
4. 🔄 4バイト命令（一部実装中）
5. 🔄 5バイト命令（一部実装中）
6. ⏳ 未定義命令の一括テスト

## 備考

- ユニット操作命令はVM以外への副作用を持つため、プレースホルダのみ実装
- テストが通る必要はない（実装不備の洗い出しが目的）
- 仕様に疑問がある場合は実装コードではなく人間に確認
- 2024年1月時点：主要な命令のテストは実装済み、残りは実装優先度に従って進行中