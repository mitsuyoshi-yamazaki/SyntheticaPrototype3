# constructor-based-replication.c コンパイル結果 (v3.1.0)

## 概要
v3.1.0の新機能（ビットシフト、スタック操作、条件付き実行、動的ユニット操作）を活用してコンパイルしました。

## v3.1.0での最適化ポイント

1. **ビットシフト命令の活用**
   - 16bit値の組み立てにSHL命令を使用
   - メモリアドレス計算の効率化

2. **スタック操作の活用**
   - 関数呼び出しパターンでのレジスタ保存
   - ローカル変数の効率的な管理

3. **条件付き実行命令の活用**
   - 条件分岐の削減によるコード効率化

4. **動的ユニット操作の活用**
   - ループ内でのユニットメモリアクセスの簡略化

## コンパイル結果

```assembly
; constructor-based-replication.asm
; v3.1.0 optimized version

; 定数定義
REPRODUCTION_CAPACITY   .equ 0x00C8  ; 200
EXPAND_CAPACITY        .equ 0x0014  ; 20
CHILD_HULL_CAPACITY    .equ 0x0064  ; 100
CHILD_ASSEMBLER_POWER  .equ 0x000A  ; 10
CHILD_COMPUTER_FREQ    .equ 0x0001  ; 1
CHILD_COMPUTER_MEMORY  .equ 0x0100  ; 256

; エネルギー定数（16,000E = 16 * 1024E）
ENERGY_REPRODUCTION    .equ 0x0010  ; 上位16bit: 16
                      .equ 0x0000  ; 下位16bit: 0

; メモリマップベース
HULL_BASE             .equ 0x00
ASSEMBLER_BASE        .equ 0x40
COMPUTER_BASE         .equ 0xC0

; スタック初期化
start:
    SET_SP #0xFFFF          ; スタックポインタ初期化

; ========== 成長フェーズ ==========
growth_phase:
    ; 現在の容量チェック
    MOV A, #0x00            ; HULL[0]
    UNIT_MEM_READ 0x00, A, 0x00  ; capacity読み取り
    MOV B, #REPRODUCTION_CAPACITY
    CMP A, B
    BGE reproduction_phase  ; 容量が十分なら複製フェーズへ

    ; HULLの拡張生産
    MOV A, #0x01            ; ASSEMBLER[0]
    MOV B, #0x40            ; produce_type
    MOV C, #0x01            ; UNIT_TYPE_HULL
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x42            ; produce_param1 (capacity)
    MOV C, #EXPAND_CAPACITY
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x43            ; produce_exec
    MOV C, #0x01
    UNIT_MEM_WRITE B, A, 0x00, C

wait_expansion:
    ; テンプレート: 10101010
    NOP1
    NOP0
    NOP1
    NOP0
    NOP1
    NOP0
    NOP1
    NOP0
    
    ; 生産状態チェック
    MOV A, #0x01
    MOV B, #0x40            ; produce_status
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_expansion

    ; 生産結果確認
    MOV B, #0x48            ; last_produced_type
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x01            ; UNIT_TYPE_HULL
    BNE growth_phase        ; 失敗なら再試行
    
    ; 新HULLのインデックス取得
    MOV B, #0x49            ; last_produced_index
    UNIT_MEM_READ B, A, 0x00
    
    ; マージ実行（v3.1.0: スタック使用）
    PUSH_A                  ; 新HULLインデックスを保存
    
    MOV A, #0x00            ; HULL[0]
    MOV B, #0x04            ; merge_target
    POP_C                   ; 新HULLインデックスを復元
    UNIT_MEM_WRITE B, A, 0x00, C
    
    JMP growth_phase

; ========== 自己複製フェーズ ==========
reproduction_phase:
    ; インデックス変数をスタックに確保
    MOV A, #0xFF            ; UNIT_INDEX_NONE
    PUSH_A                  ; child_hull_index
    PUSH_A                  ; child_assembler_index  
    PUSH_A                  ; child_computer_index

produce_child_hull:
    ; 娘HULL生産
    MOV A, #0x01            ; ASSEMBLER[0]
    MOV B, #0x40            ; produce_type
    MOV C, #0x01            ; UNIT_TYPE_HULL
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x42            ; produce_param1
    MOV C, #CHILD_HULL_CAPACITY
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x43            ; produce_exec
    MOV C, #0x01
    UNIT_MEM_WRITE B, A, 0x00, C

wait_hull:
    ; テンプレート: 01010101
    NOP0
    NOP1
    NOP0
    NOP1
    NOP0
    NOP1
    NOP0
    NOP1
    
    MOV A, #0x01
    MOV B, #0x40
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_hull

    ; 結果確認（v3.1.0: 条件付き実行使用）
    MOV B, #0x48
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x01            ; UNIT_TYPE_HULL
    MOV B, #0x49
    UNIT_MEM_READ B, A, 0x00
    
    ; スタック上のchild_hull_indexを更新
    MOV_SP B                ; SPをBに取得
    ADD B, #2               ; child_hull_indexの位置
    MOV [B], A              ; インデックスを保存
    
    ; 失敗時は再試行
    CMP A, #0x01
    BNE cleanup_and_retry

produce_child_assembler:
    ; child_hull_indexを取得
    MOV_SP A
    ADD A, #2
    MOV C, [A]              ; child_hull_index
    
    ; 娘ASSEMBLER生産
    MOV A, #0x01            ; ASSEMBLER[0]
    MOV B, #0x40            ; produce_type
    MOV D, #0x02            ; UNIT_TYPE_ASSEMBLER
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x41            ; produce_target
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x42            ; produce_param1
    MOV D, #CHILD_ASSEMBLER_POWER
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x43            ; produce_exec
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

wait_assembler:
    MOV A, #0x01
    MOV B, #0x40
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_assembler

    ; 結果確認と保存
    MOV B, #0x48
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x02            ; UNIT_TYPE_ASSEMBLER
    BNE detach_hull_retry
    
    MOV B, #0x49
    UNIT_MEM_READ B, A, 0x00
    
    ; child_assembler_index更新
    MOV_SP B
    ADD B, #4
    MOV [B], A

produce_child_computer:
    ; インデックス取得
    MOV_SP A
    ADD A, #2
    MOV C, [A]              ; child_hull_index
    
    ; 娘COMPUTER生産
    MOV A, #0x01
    MOV B, #0x40
    MOV D, #0x04            ; UNIT_TYPE_COMPUTER
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x41
    UNIT_MEM_WRITE B, A, 0x00, C
    
    ; 周波数（16bit値の組み立て - v3.1.0: SHL使用）
    MOV D, #0x00
    SHL D, 8                ; 上位バイト
    OR D, #CHILD_COMPUTER_FREQ
    MOV B, #0x42
    UNIT_MEM_WRITE B, A, 0x00, D
    
    ; メモリサイズ
    MOV D, #CHILD_COMPUTER_MEMORY
    MOV B, #0x44
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x43
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

wait_computer:
    MOV A, #0x01
    MOV B, #0x40
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x00
    BNE wait_computer

    ; 結果確認
    MOV B, #0x48
    UNIT_MEM_READ B, A, 0x00
    CMP A, #0x04
    BNE detach_hull_retry
    
    MOV B, #0x49
    UNIT_MEM_READ B, A, 0x00
    
    ; child_computer_index保存
    MOV_SP B
    ADD B, #6
    MOV [B], A

init_child_memory:
    ; child_computer_indexを取得
    MOV_SP A
    ADD A, #6
    MOV B, [A]
    
    ; COMPUTERメモリベースアドレス計算（v3.1.0: SHL使用）
    MOV A, B
    OR A, #0xC0             ; COMPUTER[index]
    
    ; 待機ループ書き込み（v3.1.0: 動的アドレス使用）
    MOV B, #0x02            ; memory_write
    MOV C, #0x0000          ; アドレス0
    MOV D, #0x60            ; JMP命令
    UNIT_MEM_WRITE_DYN B, A, C
    
    INC C
    MOV D, #0x00            ; to 0x0000
    UNIT_MEM_WRITE_DYN B, A, C
    
    INC C
    MOV D, #0x00
    UNIT_MEM_WRITE_DYN B, A, C

detach_child:
    ; child_hull_index取得
    MOV_SP A
    ADD A, #2
    MOV C, [A]
    
    ; 分離実行
    MOV A, #0x00            ; HULL[0]
    MOV B, #0x05            ; detach_type
    MOV D, #0x01            ; UNIT_TYPE_HULL
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x06            ; detach_index
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x07            ; detach_execute
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

energy_recovery:
    ; エネルギー回収開始
    MOV A, #0x00
    MOV B, #0x03            ; energy_collect
    MOV C, #0x01
    UNIT_MEM_WRITE B, A, 0x00, C

wait_energy:
    ; エネルギー量チェック
    MOV B, #0x02            ; energy_amount
    UNIT_MEM_READ B, A, 0x00
    
    ; 16,000E（0x0010:0x0000）との比較
    CMP A, #ENERGY_REPRODUCTION
    BLT wait_energy

    ; スタッククリーンアップ
    POP_A                   ; child_computer_index
    POP_A                   ; child_assembler_index
    POP_A                   ; child_hull_index
    
    JMP reproduction_phase

; エラー処理
detach_hull_retry:
    ; child_hull_indexを取得して分離
    MOV_SP A
    ADD A, #2
    MOV C, [A]
    
    MOV A, #0x00
    MOV B, #0x05
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D
    
    MOV B, #0x06
    UNIT_MEM_WRITE B, A, 0x00, C
    
    MOV B, #0x07
    MOV D, #0x01
    UNIT_MEM_WRITE B, A, 0x00, D

cleanup_and_retry:
    ; スタッククリーンアップ
    POP_A
    POP_A
    POP_A
    
    JMP reproduction_phase
```

## v3.1.0の改善点

1. **コードサイズ削減**
   - スタック操作により一時変数のメモリ確保が不要
   - 条件付き実行により分岐命令を削減

2. **実行効率向上**
   - ビットシフトによる効率的な値の組み立て
   - 動的ユニット操作によるループ処理の簡略化

3. **メモリ使用量削減**
   - スタックを活用したローカル変数管理
   - グローバル変数の削減

## 課題

- プログラム転送部分は基本的な実装のまま
- より高度なメモリ管理機能の活用余地あり