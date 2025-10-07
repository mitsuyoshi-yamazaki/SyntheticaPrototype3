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

- デフォルト: 3サイクル（「特にサイクル数指定のない4バイト命令は3サイクル」） ✅
- パターンマッチング命令（SEARCH_F, SEARCH_B, SEARCH_F_MAX, SEARCH_B_MAX）: 5サイクル
- ユニット操作命令（UNIT_MEM_READ, UNIT_MEM_WRITE, UNIT_MEM_READ_REG, UNIT_MEM_WRITE_REG, UNIT_EXISTS）: 3サイクル
- 動的ユニット操作命令（UNIT_MEM_WRITE_DYN）: 3サイクル
- エネルギー計算命令（ADD_E32, SUB_E32, CMP_E32, SHR_E10, SHL_E10）: 4サイクル
- メモリアクセス命令（絶対アドレス）: デフォルトの3サイクル
  - 0xA0: LOAD_ABS
  - 0xA1: STORE_ABS
  - 0xA2: LOAD_ABS_W
  - 0xA3: STORE_ABS_W
- 間接ジャンプ命令: デフォルトの3サイクル
  - 0xB0: JMP_IND
  - 0xB1: JMP_ABS
  - 0xB2: RET

#### 5バイト命令

- デフォルト: 3サイクル（「特にサイクル数指定のない5バイト命令は3サイクル」） ✅
- 拡張演算命令: デフォルトの3サイクル
  - 0xC0: MUL_AB
  - 0xC1: DIV_AB
  - 0xC2: SHL
  - 0xC3: SHR
  - 0xC4: SAR
  - 0xC5: CMOV_Z
  - 0xC6: CMOV_NZ
  - 0xC7: CMOV_C
  - 0xC8: CMOV_NC
- 即値ロード命令: デフォルトの3サイクル
  - 0xE0: LOAD_IMM
  - 0xE1: LOAD_IMM_B
- NOP命令: デフォルトの3サイクル
  - 0xF0: NOP5

## 解決状況

✅ **すべての命令のサイクル数が定義されました**

- 4バイト命令のデフォルトサイクル数: 3サイクル（追加済み）
- 5バイト命令のデフォルトサイクル数: 3サイクル（追加済み）
- 個別に特殊なサイクル数を持つ命令は明示的に記載
- デフォルト値により、すべての命令にサイクル数が定義された状態
