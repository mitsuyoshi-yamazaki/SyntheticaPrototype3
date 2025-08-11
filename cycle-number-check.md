# 命令サイクル数チェック結果

## サイクル数の仕様（docs/spec-v3/synthetica-script.md より）

### 明示されているサイクル数

#### 1バイト命令
- デフォルト: 1サイクル（「特にサイクル数指定のない1バイト命令は1サイクル」）
- スタック操作（PUSH_A, PUSH_B, PUSH_C, PUSH_D, POP_A, POP_B, POP_C, POP_D）: 2サイクル

#### 3バイト命令  
- デフォルト: 2サイクル（「特にサイクル数指定のない3バイト命令は2サイクル」）
- ジャンプ命令（JMP, JZ, JNZ, JC, JNC, CALL, JG, JLE, JGE, JL）: 
  - ジャンプが実行される場合: 3サイクル
  - ジャンプが実行されない場合: 1サイクル

#### 4バイト命令
- **デフォルトサイクル数の記載なし** ❌
- パターンマッチング命令（SEARCH_F, SEARCH_B, SEARCH_F_MAX, SEARCH_B_MAX）: 5サイクル
- ユニット操作命令（UNIT_MEM_READ, UNIT_MEM_WRITE, UNIT_MEM_READ_REG, UNIT_MEM_WRITE_REG, UNIT_EXISTS）: 3サイクル
- 動的ユニット操作命令（UNIT_MEM_WRITE_DYN）: 3サイクル
- エネルギー計算命令（ADD_E32, SUB_E32, CMP_E32, SHR_E10, SHL_E10）: 4サイクル
- **メモリアクセス命令（絶対アドレス）のサイクル数記載なし**:
  - 0xA0: LOAD_ABS
  - 0xA1: STORE_ABS
  - 0xA2: LOAD_ABS_W
  - 0xA3: STORE_ABS_W
- **間接ジャンプ命令のサイクル数記載なし**:
  - 0xB0: JMP_IND
  - 0xB1: JMP_ABS
  - 0xB2: RET

#### 5バイト命令
- **デフォルトサイクル数の記載なし** ❌
- **拡張演算命令のサイクル数記載なし**:
  - 0xC0: MUL_AB
  - 0xC1: DIV_AB
  - 0xC2: SHL
  - 0xC3: SHR
  - 0xC4: SAR
  - 0xC5: CMOV_Z
  - 0xC6: CMOV_NZ
  - 0xC7: CMOV_C
  - 0xC8: CMOV_NC
- **即値ロード命令のサイクル数記載なし**:
  - 0xE0: LOAD_IMM
  - 0xE1: LOAD_IMM_B
- **NOP命令のサイクル数記載なし**:
  - 0xF0: NOP5

## 問題点

### 1. デフォルトサイクル数が未定義
- 4バイト命令のデフォルトサイクル数
- 5バイト命令のデフォルトサイクル数

### 2. 個別命令のサイクル数が未定義

#### 4バイト命令
- メモリアクセス命令（絶対アドレス）: LOAD_ABS, STORE_ABS, LOAD_ABS_W, STORE_ABS_W
- 間接ジャンプ命令: JMP_IND, JMP_ABS, RET

#### 5バイト命令
- 拡張演算命令: MUL_AB, DIV_AB, SHL, SHR, SAR, CMOV_Z, CMOV_NZ, CMOV_C, CMOV_NC
- 即値ロード命令: LOAD_IMM, LOAD_IMM_B
- NOP命令: NOP5

## 推奨される対応

1. 4バイト命令のデフォルトサイクル数を定義（例: 3サイクル）
2. 5バイト命令のデフォルトサイクル数を定義（例: 3サイクル）
3. または、個別に未定義の命令のサイクル数を明記