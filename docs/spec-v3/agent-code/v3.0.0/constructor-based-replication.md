# constructor-based-replication.c のSynthetica Scriptコンパイル結果

## コンパイル概要

- ソースファイル: constructor-based-replication.c
- ターゲット: Synthetica Script v3.0.0 (16bit)
- コンパイル日: 2024-01-29

## 課題点と制限事項

### 1. マクロ定数の展開

- C言語の`#define`マクロは、コンパイル時に即値に展開
- 可読性のため、コメントで元のマクロ名を記載

### 2. 関数呼び出しの簡略化

- API関数は対応するSynthetica Script命令に直接変換
- 引数の順序と命令のオペランド配置に注意が必要

### 3. 制御構造

- while文やif文は条件ジャンプ命令で実装
- breakはジャンプ先ラベルで対応

## コンパイル結果

```assembly
; constructor-based-replication Synthetica Script
; 固定仕様による自己複製エージェント
; メモリマップ:
;   0x0000-0x0002: 待機ループ削除用NOP
;   0x0003-: メインプログラム

; 定数定義（マクロ展開）
; REPRODUCTION_HULL_CAPACITY = 200 (0x00C8)
; EXPAND_HULL_CAPACITY = 20 (0x0014)
; CHILD_HULL_CAPACITY = 100 (0x0064)
; CHILD_ASSEMBLER_POWER = 10 (0x000A)
; CHILD_COMPUTER_FREQUENCY = 1 (0x0001)
; CHILD_COMPUTER_MEMORY = 256 (0x0100)

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
; 成長フェーズ
; ====================
growth_phase:
0x0003: 90 00 00 00    ; UNIT_MEM_READ HULL[0], 0x0000 (capacity)
0x0007: 41             ; MOV_AB               ; B = current capacity
0x0008: 50 C8 00 00    ; LOAD_IMM A, 0x00C8   ; A = 200 (REPRODUCTION_HULL_CAPACITY)
0x000C: 32             ; CMP_AB
0x000D: 68 00 48       ; JGE start_replication ; if capacity >= 200

; HULLの拡張
; assembler_produce_hull(0, UNIT_INDEX_NONE, EXPAND_HULL_CAPACITY)
0x0010: 50 14 00 00    ; LOAD_IMM A, 0x0014   ; EXPAND_HULL_CAPACITY
0x0014: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003 (param1)
0x0018: 50 FF 00 00    ; LOAD_IMM A, 0x00FF   ; UNIT_INDEX_NONE
0x001C: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002 (connect)
0x0020: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL type
0x0024: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001 (unit_type)
0x0028: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; start production
0x002C: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009 (produce)

; テンプレート 0xAA (10101010) での待機
wait_expansion_template:
0x0030: 01             ; NOP1
0x0031: 00             ; NOP0
0x0032: 01             ; NOP1
0x0033: 00             ; NOP0
0x0034: 01             ; NOP1
0x0035: 00             ; NOP0
0x0036: 01             ; NOP1
0x0037: 00             ; NOP0

wait_expansion:
0x0038: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009 (produce state)
0x003C: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0040: 41             ; MOV_AB
0x0041: 32             ; CMP_AB
0x0042: 61 00 38       ; JE wait_expansion    ; still producing

; 生産結果確認とマージ
0x0045: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D (last_type)
0x0049: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL type
0x004D: 41             ; MOV_AB
0x004E: 32             ; CMP_AB
0x004F: 62 00 03       ; JNE growth_phase     ; not HULL, retry

; hull_merge(new_hull_index, 0)
0x0052: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E (last_index)
0x0056: 91 00 04 00    ; UNIT_MEM_WRITE HULL[0], 0x0004 (merge_target)
0x005A: 60 00 03       ; JMP growth_phase

; ====================
; 自己複製フェーズ
; ====================
start_replication:
0x005D:
replication_loop:

; 娘HULL生産
; assembler_produce_hull(0, UNIT_INDEX_NONE, CHILD_HULL_CAPACITY)
0x005D: 50 64 00 00    ; LOAD_IMM A, 0x0064   ; CHILD_HULL_CAPACITY
0x0061: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003 (param1)
0x0065: 50 FF 00 00    ; LOAD_IMM A, 0x00FF   ; UNIT_INDEX_NONE
0x0069: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002 (connect)
0x006D: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL type
0x0071: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001 (unit_type)
0x0075: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; start
0x0079: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009 (produce)

; テンプレート 0x55 (01010101) での待機
wait_hull_template:
0x007D: 00             ; NOP0
0x007E: 01             ; NOP1
0x007F: 00             ; NOP0
0x0080: 01             ; NOP1
0x0081: 00             ; NOP0
0x0082: 01             ; NOP1
0x0083: 00             ; NOP0
0x0084: 01             ; NOP1

wait_hull:
0x0085: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x0089: 50 00 00 00    ; LOAD_IMM A, 0x0000   ; check if done
0x008D: 32             ; CMP_AB
0x008E: 62 00 85       ; JNE wait_hull

; 結果確認
0x0091: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D (last_type)
0x0095: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL
0x0099: 41             ; MOV_AB
0x009A: 32             ; CMP_AB
0x009B: 62 00 5D       ; JNE replication_loop ; retry if failed

; child_hull_index保存
0x009E: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E (last_index)
0x00A2: 42             ; MOV_AC               ; C = child_hull_idx

; 娘ASSEMBLER生産
; assembler_produce_assembler(0, child_hull_idx, CHILD_ASSEMBLER_POWER)
0x00A3: 22             ; MOV_CA               ; A = child_hull_idx
0x00A4: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002 (connect)
0x00A8: 50 0A 00 00    ; LOAD_IMM A, 0x000A   ; CHILD_ASSEMBLER_POWER
0x00AC: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003 (param1)
0x00B0: 50 02 00 00    ; LOAD_IMM A, 0x0002   ; ASSEMBLER type
0x00B4: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001 (unit_type)
0x00B8: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; start
0x00BC: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009 (produce)

wait_assembler:
0x00C0: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x00C4: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x00C8: 32             ; CMP_AB
0x00C9: 62 00 C0       ; JNE wait_assembler

; 結果確認（失敗時は娘HULL破棄）
0x00CC: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D
0x00D0: 50 02 00 00    ; LOAD_IMM A, 0x0002   ; ASSEMBLER
0x00D4: 41             ; MOV_AB
0x00D5: 32             ; CMP_AB
0x00D6: 61 00 E8       ; JE assembler_ok

; hull_detach(0, HULL, child_hull_idx)
0x00D9: 22             ; MOV_CA               ; A = child_hull_idx
0x00DA: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006 (detach_index)
0x00DE: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL type
0x00E2: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005 (detach_type)
0x00E6: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; execute
0x00EA: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007 (detach_execute)
0x00EE: 60 00 5D       ; JMP replication_loop

assembler_ok:
; 娘COMPUTER生産
0x00F1: 22             ; MOV_CA               ; A = child_hull_idx
0x00F2: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002 (connect)
0x00F6: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; CHILD_COMPUTER_FREQUENCY
0x00FA: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003 (param1)
0x00FE: 50 00 01 00    ; LOAD_IMM A, 0x0100   ; CHILD_COMPUTER_MEMORY
0x0102: 91 40 04 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0004 (param2)
0x0106: 50 04 00 00    ; LOAD_IMM A, 0x0004   ; COMPUTER type
0x010A: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001 (unit_type)
0x010E: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; start
0x0112: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009 (produce)

wait_computer:
0x0116: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x011A: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x011E: 32             ; CMP_AB
0x011F: 62 01 16       ; JNE wait_computer

; 結果確認
0x0122: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D
0x0126: 50 04 00 00    ; LOAD_IMM A, 0x0004   ; COMPUTER
0x012A: 41             ; MOV_AB
0x012B: 32             ; CMP_AB
0x012C: 61 01 3E       ; JE computer_ok

; 失敗時は娘エージェント全体を破棄
0x012F: 22             ; MOV_CA
0x0130: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006
0x0134: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0138: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005
0x013C: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0140: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007
0x0144: 60 00 5D       ; JMP replication_loop

computer_ok:
; 娘COMPUTERのメモリ初期化
0x0147: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E (last_index)
0x014B: 24             ; MOV_AD               ; D = child_computer_idx

; 簡単な待機ループを書き込む
0x014C: 50 60 00 00    ; LOAD_IMM A, 0x0060   ; JMP
0x0150: 91 C0 00 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0000
0x0154: 50 00 00 00    ; LOAD_IMM A, 0x0000   ; to 0x0000
0x0158: 91 C0 01 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0001
0x015C: 91 C0 02 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0002

; 娘エージェントの分離
0x0160: 22             ; MOV_CA               ; A = child_hull_idx
0x0161: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006
0x0165: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0169: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005
0x016D: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0171: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007

; エネルギー回収設定
0x0175: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; true
0x0179: 91 00 03 00    ; UNIT_MEM_WRITE HULL[0], 0x0003 (energy_collect)

; エネルギー回復待機（簡略化）
energy_wait_loop:
0x017D: 90 00 02 00    ; UNIT_MEM_READ HULL[0], 0x0002 (energy_amount)
0x0181: 41             ; MOV_AB
0x0182: 50 00 40 00    ; LOAD_IMM A, 0x4000   ; 約16,384E
0x0186: 32             ; CMP_AB
0x0187: 69 01 7D       ; JL energy_wait_loop

0x018A: 60 00 5D       ; JMP replication_loop

```

## 実装における課題

### 1. エネルギー計算の簡略化

- `ENERGY_MAKE(16, 0)`のような32bitエネルギー計算は簡略化
- 正確な実装にはADD_E32等の使用が必要

### 2. 娘COMPUTERへのプログラム転送

- 現在の実装では単純な待機ループのみ
- 完全な自己複製には大規模なメモリ転送が必要

### 3. インデックス管理

- child_hull_idxなどの一時変数はレジスタで管理
- より複雑な実装では専用のメモリ領域が必要

## 結論

constructor-based replicationは最もシンプルな自己複製方式であり、現在のSynthetica Script仕様で十分実装可能。ただし、以下の点で改善の余地がある：

1. 娘個体の仕様が固定的（柔軟性に欠ける）
2. プログラム転送機能が限定的
3. エラー処理が単純（リトライのみ）
