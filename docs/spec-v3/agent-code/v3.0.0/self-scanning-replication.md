# self-scanning-replication.c のSynthetica Scriptコンパイル結果

## コンパイル概要

- ソースファイル: self-scanning-replication.c
- ターゲット: Synthetica Script v3.0.0 (16bit)
- コンパイル日: 2024-01-29

## 課題点と制限事項

### 1. C言語の高度な機能

- **for文**: Synthetica Scriptにはループカウンタの自動管理がないため、手動でカウンタを管理
- **関数呼び出し**: CALLとRETで実装可能だが、引数の受け渡しにスタックが必要
- **ローカル変数**: メモリの固定アドレスに配置

### 2. APIのマッピング

- `hull_get_capacity()` → UNIT_MEM_READ (0x90)
- `computer_write_memory()` → UNIT_MEM_WRITE (0x91)
- `unit_exists()` → UNIT_EXISTS (0x94)
- その他のAPI関数も同様に命令にマッピング

### 3. テンプレートマッチング

- `__attribute__((template()))`はSEARCH命令のテンプレートに変換
- 待機ループの最適化に使用

## コンパイル結果

```assembly
; self-scanning-replication Synthetica Script
; メモリマップ:
;   0x0000-0x0002: 待機ループ削除用NOP
;   0x0003-: メインプログラム
;   0x0200-0x0208: 変数領域
;   0x0300-: 作業用領域

; ====================
; 先頭3バイトのNOP
; ====================
0x0000: 00      ; NOP
0x0001: 00      ; NOP
0x0002: 00      ; NOP

; ====================
; メインプログラム開始
; ====================
0x0003:
main_start:

; ====================
; 自己スキャンフェーズ
; ====================

; HULL[0]の容量を取得
; hull_get_capacity(0) → A
0x0003: 90 00 00 00    ; UNIT_MEM_READ HULL[0], 0x0000 (capacity)
0x0007: A1 00 02 00    ; STORE_ABS [0x0200] = A (VAR_MY_HULL_CAPACITY)

; ASSEMBLER探索ループの初期化
0x000B: 50 00 00 00    ; LOAD_IMM A, 0x0000  ; i = 0
0x000F: 21             ; MOV_AD               ; D = 0 (カウンタ)

assembler_search_loop:
0x0010: 94 40 00 00    ; UNIT_EXISTS ASSEMBLER[D] (0x40 + D)
0x0014: 41             ; MOV_AB               ; B = result
0x0015: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x0019: 32             ; CMP_AB               ; if exists
0x001A: 62 00 26       ; JNE assembler_found  ; goto found

; インクリメントとループ継続判定
0x001D: 44             ; INC_D
0x001E: 23             ; MOV_DA
0x001F: 50 10 00 00    ; LOAD_IMM A, 0x0010  ; max 16
0x0023: 41             ; MOV_AB
0x0024: 23             ; MOV_DA
0x0025: 32             ; CMP_AB
0x0026: 69 00 10       ; JL assembler_search_loop

; ASSEMBLERが見つからない場合
0x0029: 50 FF 00 00    ; LOAD_IMM A, 0x00FF  ; UNIT_INDEX_NONE
0x002D: A1 04 02 00    ; STORE_ABS [0x0204] = A
0x0031: 60 00 3B       ; JMP continue_scan

assembler_found:
0x0034: 23             ; MOV_DA               ; A = assembler_idx
0x0035: A1 04 02 00    ; STORE_ABS [0x0204] = A

continue_scan:
; ASSEMBLERのpower読み取り
0x0039: A0 04 02 00    ; LOAD_ABS A, [0x0204]
0x003D: 24             ; MOV_AD
0x003E: 90 40 00 00    ; UNIT_MEM_READ ASSEMBLER[D], 0x0000 (power)
0x0042: A1 01 02 00    ; STORE_ABS [0x0201] = A (VAR_MY_ASSEMBLER_POWER)

; 自身のCOMPUTERスペック読み取り
; computer_get_my_frequency() → A
0x0046: 90 C0 00 00    ; UNIT_MEM_READ COMPUTER[0], 0x0000 (frequency)
0x004A: A1 02 02 00    ; STORE_ABS [0x0202] = A

; computer_get_my_capacity() → A
0x004E: 90 C0 01 00    ; UNIT_MEM_READ COMPUTER[0], 0x0001 (capacity)
0x0052: A1 03 02 00    ; STORE_ABS [0x0203] = A

; ====================
; 自己複製フェーズ
; ====================
replication_loop:

; 設計値の読み出し
0x0056: A0 00 02 00    ; LOAD_ABS A, [0x0200] ; hull_capacity
0x005A: 41             ; MOV_AB
0x005B: A0 01 02 00    ; LOAD_ABS A, [0x0201] ; assembler_power
0x005F: 42             ; MOV_AC
0x0060: A0 04 02 00    ; LOAD_ABS A, [0x0204] ; assembler_idx
0x0064: 24             ; MOV_AD

; エラーチェック
0x0065: 50 FF 00 00    ; LOAD_IMM A, 0x00FF
0x0069: 32             ; CMP_AB               ; D == UNIT_INDEX_NONE?
0x006A: 61 00 56       ; JE replication_loop  ; retry if no assembler

; 娘HULL生産
; assembler_produce_hull(D, UNIT_INDEX_NONE, B)
0x006D: 21             ; MOV_BA               ; A = hull_capacity
0x006E: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[D], 0x0003 (param1)
0x0072: 50 FF 00 00    ; LOAD_IMM A, 0x00FF  ; UNIT_INDEX_NONE
0x0076: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[D], 0x0002 (connect)
0x007A: 50 01 00 00    ; LOAD_IMM A, 0x0001  ; HULL type
0x007E: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[D], 0x0001 (unit_type)
0x0082: 50 01 00 00    ; LOAD_IMM A, 0x0001  ; start production
0x0086: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[D], 0x0009 (produce)

; テンプレート 0x33 (00110011) での待機
wait_hull_template:
0x008A: 00             ; NOP0
0x008B: 00             ; NOP0
0x008C: 01             ; NOP1
0x008D: 01             ; NOP1
0x008E: 00             ; NOP0
0x008F: 00             ; NOP0
0x0090: 01             ; NOP1
0x0091: 01             ; NOP1

wait_hull_loop:
0x0092: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[D], 0x0009 (produce state)
0x0096: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x009A: 41             ; MOV_AB
0x009B: 32             ; CMP_AB
0x009C: 61 00 92       ; JE wait_hull_loop    ; still producing

; 生産結果確認
0x009F: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[D], 0x000D (last_type)
0x00A3: 50 01 00 00    ; LOAD_IMM A, 0x0001  ; HULL type
0x00A7: 41             ; MOV_AB
0x00A8: 32             ; CMP_AB
0x00A9: 62 00 56       ; JNE replication_loop ; not HULL, retry

; 娘HULL indexを保存
0x00AC: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[D], 0x000E (last_index)
0x00B0: A1 06 02 00    ; STORE_ABS [0x0206] = A (VAR_CHILD_HULL_IDX)

; 娘ASSEMBLER生産
; （同様のパターンで実装、省略）

; 娘COMPUTER生産
; （同様のパターンで実装、省略）

; ====================
; メモリ転送部分
; ====================
; 待機ループ設置
0x0100: A0 08 02 00    ; LOAD_ABS A, [0x0208] ; child_computer_idx
0x0104: 24             ; MOV_AD
0x0105: 50 60 00 00    ; LOAD_IMM A, 0x0060  ; JMP opcode
0x0109: 91 C0 00 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0000
0x010D: 50 00 00 00    ; LOAD_IMM A, 0x0000  ; to 0x0000
0x0111: 91 C0 01 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0001
0x0115: 91 C0 02 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0002

; メモリ転送ループ
; for (addr = 3; addr < memory_size; addr++)
0x0119: 50 03 00 00    ; LOAD_IMM A, 0x0003  ; addr = 3
0x011D: 42             ; MOV_AC              ; C = addr

memory_copy_loop:
0x011E: 22             ; MOV_CA              ; A = addr
0x011F: A0 03 02 00    ; LOAD_ABS A, [0x0203] ; memory_size
0x0123: 41             ; MOV_AB
0x0124: 22             ; MOV_CA
0x0125: 32             ; CMP_AB              ; addr < memory_size?
0x0126: 68 01 50       ; JGE copy_done

; 自身のメモリ読み取りと転送
0x0129: 22             ; MOV_CA              ; A = addr
0x012A: 53 00 00 00    ; LOAD_IND A, [A]     ; value = Memory[addr]
0x012E: 41             ; MOV_AB              ; B = value
0x012F: A0 08 02 00    ; LOAD_ABS A, [0x0208] ; child_idx
0x0133: 24             ; MOV_AD
0x0134: 22             ; MOV_CA              ; A = addr
0x0135: 91 C3 00 00    ; UNIT_MEM_WRITE COMPUTER[D], [C] ; 転送

; アドレスインクリメント
0x0139: 43             ; INC_C
0x013A: 60 01 1E       ; JMP memory_copy_loop

copy_done:
; 待機ループ削除（NOPで上書き）
0x013D: 50 00 00 00    ; LOAD_IMM A, 0x0000  ; NOP
0x0141: 91 C0 00 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0000
0x0145: 91 C0 01 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0001
0x0149: 91 C0 02 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0002

; 娘エージェントの分離
0x014D: A0 06 02 00    ; LOAD_ABS A, [0x0206] ; child_hull_idx
0x0151: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006 (detach_index)
0x0155: 50 01 00 00    ; LOAD_IMM A, 0x0001  ; HULL type
0x0159: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005 (detach_type)
0x015D: 50 01 00 00    ; LOAD_IMM A, 0x0001  ; execute
0x0161: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007 (detach_execute)

; エネルギー回復待機
0x0165: 60 00 56       ; JMP replication_loop

```

## 実装における課題

### 1. メモリアドレッシングの制限

- C言語の配列アクセス `memory[addr]` は間接アドレッシング命令で対応
- ただし、UNIT_MEM_WRITEで可変アドレスへの書き込みは複雑

### 2. 32bitエネルギー計算

- エネルギー量の動的計算部分は簡略化
- 完全な実装には多数のADD_E32/MUL命令が必要

### 3. 権限変更プログラムの埋め込み

- 娘COMPUTER内への小プログラム書き込みは実装可能
- ただし、コードサイズが大きくなる

## 結論

自己スキャン型複製の基本機能は実装可能だが、以下の点で仕様の拡張が望まれる：

1. 間接アドレッシングの強化（特にユニット操作）
2. ループ制御の専用命令
3. 関数呼び出しのスタック管理支援
