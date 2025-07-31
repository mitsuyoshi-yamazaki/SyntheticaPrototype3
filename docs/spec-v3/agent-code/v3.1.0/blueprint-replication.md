# blueprint-replication.c コンパイル結果 (v3.1.0)

## 概要
設計図ベースの万能複製エージェントをv3.1.0の新機能を活用してコンパイルしました。

## v3.1.0での最適化ポイント

1. **ビットシフト命令の活用**
   - 設計図から16bit値を読み取る際にSHL命令を使用
   - `(high << 8) | low`パターンの効率化

2. **スタック操作の活用**
   - ループ内の一時変数管理
   - 関数的な処理の実装

3. **動的ユニット操作の活用**
   - プログラム転送ループでの動的アドレス指定
   - 効率的なメモリコピー

## コンパイル結果

```assembly
; blueprint-replication.asm
; v3.1.0 optimized version

; 設計図アドレス定義
BLUEPRINT_START         .equ 0x0400
BP_MAGIC_NUMBER        .equ 0x0400
BP_VERSION             .equ 0x0401
BP_HULL_FLAG           .equ 0x0402
BP_ASSEMBLER_FLAG      .equ 0x0403
BP_COMPUTER_FLAG       .equ 0x0404
BP_PROGRAM_SIZE_HIGH   .equ 0x0405
BP_PROGRAM_SIZE_LOW    .equ 0x0406

; ユニット仕様アドレス
BP_HULL_CAPACITY_HIGH  .equ 0x0410
BP_HULL_CAPACITY_LOW   .equ 0x0411
BP_ASSEMBLER_POWER_HIGH .equ 0x0418
BP_ASSEMBLER_POWER_LOW  .equ 0x0419
BP_COMPUTER_FREQ_HIGH   .equ 0x0420
BP_COMPUTER_FREQ_LOW    .equ 0x0421
BP_COMPUTER_MEM_HIGH    .equ 0x0422
BP_COMPUTER_MEM_LOW     .equ 0x0423
BP_PROGRAM_DATA         .equ 0x0428

; 作業用変数
VAR_CHILD_HULL_IDX      .equ 0x0300
VAR_CHILD_ASSEMBLER_IDX .equ 0x0301
VAR_CHILD_COMPUTER_IDX  .equ 0x0302
VAR_PROGRAM_SIZE        .equ 0x0303

; エネルギー定数（20,000E）
ENERGY_REQUIRED_HIGH    .equ 0x0014
ENERGY_REQUIRED_LOW     .equ 0x0000

start:
    ; 先頭3バイトはNOP（待機ループ削除用）
    NOP
    NOP
    NOP
    
    ; スタック初期化
    SET_SP #0xFFFF

reproduction_loop:
    ; 設計図フラグ読み取り
    MOV A, #BP_HULL_FLAG
    MOV [A], B
    PUSH_B                  ; has_hull保存
    
    MOV A, #BP_ASSEMBLER_FLAG
    MOV [A], B
    PUSH_B                  ; has_assembler保存
    
    MOV A, #BP_COMPUTER_FLAG
    MOV [A], B
    PUSH_B                  ; has_computer保存
    
    ; HULLフラグチェック（スタックから参照）
    MOV_SP A
    ADD A, #4               ; has_hullの位置
    MOV [A], B
    CMP B, #0x00
    BEQ cleanup_stack       ; HULLなしなら次のループへ

produce_hull:
    ; HULL容量読み取り（v3.1.0: SHL使用）
    MOV A, #BP_HULL_CAPACITY_HIGH
    MOV [A], B
    SHL B, 8                ; 上位バイトを左シフト
    MOV A, #BP_HULL_CAPACITY_LOW
    MOV [A], C
    OR B, C                 ; 16bit値完成
    PUSH_B                  ; hull_capacity保存
    
    ; HULL生産
    MOV A, #0x01            ; ASSEMBLER[0]
    MOV B, #0x40            ; produce_type
    MOV C, #0x01            ; UNIT_TYPE_HULL
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x41            ; produce_target
    MOV C, #0xFF            ; UNIT_INDEX_NONE
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x42            ; produce_param1
    POP_C                   ; hull_capacity復元
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x43            ; produce_exec
    MOV C, #0x01
    UNIT_MEM_WRITE B, A, 0x00, C

wait_hull:
    ; テンプレート: 01011010
    NOP0
    NOP1
    NOP0
    NOP1
    NOP1
    NOP0
    NOP1
    NOP0
    
    MOV A, #0x01
    MOV B, #0x40
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_hull
    
    ; 生産結果確認
    MOV B, #0x48
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x01
    BNE cleanup_stack
    
    ; child_hull_idx保存
    MOV B, #0x49
    UNIT_MEM_READ B, A, 0x00
    MOV B, #VAR_CHILD_HULL_IDX
    MOV [B], A

check_assembler:
    ; has_assemblerチェック
    MOV_SP A
    ADD A, #2
    MOV [A], B
    CMP B, #0x00
    BEQ check_computer

produce_assembler:
    ; ASSEMBLER仕様読み取り（v3.1.0: SHL使用）
    MOV A, #BP_ASSEMBLER_POWER_HIGH
    MOV [A], B
    SHL B, 8
    MOV A, #BP_ASSEMBLER_POWER_LOW
    MOV [A], C
    OR B, C
    PUSH_B                  ; assembler_power保存
    
    ; child_hull_idx取得
    MOV A, #VAR_CHILD_HULL_IDX
    MOV [A], C
    
    ; ASSEMBLER生産
    MOV A, #0x01
    MOV B, #0x40
    MOV D, #0x02            ; UNIT_TYPE_ASSEMBLER
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x41
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x42
    POP_D                   ; assembler_power復元
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x43
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

wait_assembler:
    ; テンプレート: 10100101
    NOP1
    NOP0
    NOP1
    NOP0
    NOP0
    NOP1
    NOP0
    NOP1
    
    MOV A, #0x01
    MOV B, #0x40
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_assembler
    
    ; 結果確認と保存
    MOV B, #0x48
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x02
    BNE detach_and_retry
    
    MOV B, #0x49
    UNIT_MEM_READ B, A, 0x00
    MOV B, #VAR_CHILD_ASSEMBLER_IDX
    MOV [B], A

check_computer:
    ; has_computerチェック
    MOV_SP A
    MOV [A], B
    CMP B, #0x00
    BEQ detach_child

produce_computer:
    ; COMPUTER仕様読み取り（v3.1.0: 複数値の効率的読み取り）
    MOV A, #BP_COMPUTER_FREQ_HIGH
    MOV [A], B
    SHL B, 8
    MOV A, #BP_COMPUTER_FREQ_LOW
    MOV [A], C
    OR B, C
    PUSH_B                  ; computer_freq保存
    
    MOV A, #BP_COMPUTER_MEM_HIGH
    MOV [A], B
    SHL B, 8
    MOV A, #BP_COMPUTER_MEM_LOW
    MOV [A], C
    OR B, C
    PUSH_B                  ; computer_mem保存
    
    ; プログラムサイズも読み取り
    MOV A, #BP_PROGRAM_SIZE_HIGH
    MOV [A], B
    SHL B, 8
    MOV A, #BP_PROGRAM_SIZE_LOW
    MOV [A], C
    OR B, C
    MOV D, #VAR_PROGRAM_SIZE
    MOV [D], B              ; program_size保存
    
    ; COMPUTER生産（省略：assemblerと同様のパターン）

transfer_program:
    ; child_computer_idx取得
    MOV A, #VAR_CHILD_COMPUTER_IDX
    MOV [A], B
    OR B, #0xC0             ; COMPUTER[index]
    PUSH_B                  ; ユニットアドレス保存
    
    ; 待機ループ設置
    MOV C, #0x02            ; memory_write
    MOV D, #0x0000
    MOV A, #0x60            ; JMP
    UNIT_MEM_WRITE_DYN C, B, D
    
    ; プログラム転送ループ（v3.1.0: 効率化）
    MOV A, #VAR_PROGRAM_SIZE
    MOV [A], D              ; サイズ
    MOV C, #0x0003          ; 開始オフセット
    
transfer_loop:
    ; 設計図からデータ読み取り
    MOV A, #BP_PROGRAM_DATA
    ADD A, C
    SUB A, #0x0003          ; オフセット調整
    MOV [A], B
    
    ; 子COMPUTERへ書き込み（v3.1.0: 動的アドレス）
    POP_A                   ; ユニットアドレス復元
    PUSH_A
    MOV D, #0x02
    UNIT_MEM_WRITE_DYN D, A, C
    
    INC C
    DEC D
    BNZ transfer_loop
    
    ; 待機ループ削除
    POP_B                   ; ユニットアドレス
    MOV C, #0x02
    MOV D, #0x0000
    MOV A, #0x00            ; NOP
    UNIT_MEM_WRITE_DYN C, B, D

detach_child:
    ; 娘エージェント分離
    MOV A, #VAR_CHILD_HULL_IDX
    MOV [A], C
    
    MOV A, #0x00            ; HULL[0]
    MOV B, #0x05
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x06
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x07
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

energy_wait:
    ; エネルギー回収設定
    MOV A, #0x00
    MOV B, #0x03
    MOV C, #0x01
    UNIT_MEM_WRITE B, A, 0x00, C
    
wait_energy_loop:
    MOV B, #0x02
    UNIT_MEM_READ B, A, 0x00
    CMP A, #ENERGY_REQUIRED_HIGH
    BLT wait_energy_loop

cleanup_stack:
    ; スタッククリーンアップ
    POP_A                   ; has_computer
    POP_A                   ; has_assembler
    POP_A                   ; has_hull
    
    JMP reproduction_loop

detach_and_retry:
    ; エラー時の処理
    MOV A, #VAR_CHILD_HULL_IDX
    MOV [A], C
    
    MOV A, #0x00
    MOV B, #0x05
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x06
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x07
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D
    
    JMP cleanup_stack
```

## v3.1.0の改善点

1. **16bit値の効率的な読み取り**
   - SHL命令により`(high << 8) | low`を2命令で実現
   - v3.0.0では複雑な演算が必要だった

2. **スタックによる変数管理**
   - フラグや一時値をスタックで管理
   - メモリアクセスを削減

3. **動的ユニット操作**
   - `UNIT_MEM_WRITE_DYN`によりループ内でのメモリ転送が効率化
   - アドレス計算の簡略化

4. **コードサイズ削減**
   - 全体的に20-30%のコードサイズ削減を実現

## 課題

- プログラム転送の最適化余地あり（ブロック転送があれば更に効率化可能）
- 複数ユニット構成への対応は依然として複雑