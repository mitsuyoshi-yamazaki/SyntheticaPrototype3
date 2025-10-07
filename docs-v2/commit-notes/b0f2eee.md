# コミット b0f2eee の指示内容

## ユーザーからの指示

src/engine/vm-instructions.test.ts で test.todo として記載されている命令を除いて、 docs/spec-v3/synthetica-script.md に定義されている命令でまだテストが記述されていない命令のテストを追加せよ

## 実施内容

仕様書（docs/spec-v3/synthetica-script.md）に定義されている全ての命令のうち、test.todoとして記載されているユニット操作命令、エネルギー計算命令、パターンマッチング命令を除く、未実装の命令のテストを追加しました。

### 追加した命令のテスト

#### 1バイト命令

- **データ移動命令**: MOV_BA, MOV_DA, MOV_BC, MOV_CB, MOV_AC, MOV_CA, MOV_CD, MOV_DC
- **算術演算命令**: INC_B, INC_C, INC_D, DEC_B, DEC_C, DEC_D
- **論理演算命令**: AND_AB, OR_AB, NOT_A
- **スタック操作**: PUSH_B, PUSH_C, PUSH_D, POP_B, POP_C, POP_D

#### 3バイト命令

- **メモリアクセス**: LOAD_IND, STORE_IND, STORE_A_W, LOAD_REG, STORE_REG, LOAD_IND_REG, STORE_IND_REG
- **制御命令**: JNZ, JC, JNC, JG, JLE, JGE, JL

#### 4バイト命令

- **メモリアクセス**: STORE_ABS, LOAD_ABS_W, STORE_ABS_W
- **間接ジャンプ**: JMP_IND

#### 5バイト命令

- **ビットシフト**: SHL, SHR, SAR
- **条件付き移動**: CMOV_Z, CMOV_NZ, CMOV_C, CMOV_NC
- **即値ロード**: LOAD_IMM_B
- **NOP**: NOP5

### テストの特徴

各テストは仕様書に基づいて実装され、以下を検証します：

- 命令実行前後の全レジスタ（A, B, C, D）の状態
- プログラムカウンタ（PC）の更新
- フラグ（キャリー、ゼロ）の更新
- メモリアクセス命令の場合はメモリの内容
- 実行サイクル数の正確性
- エラー処理（ゼロ除算など）

これにより、VM命令の実装不備を効果的に検出できるテストスイートが完成しました。
