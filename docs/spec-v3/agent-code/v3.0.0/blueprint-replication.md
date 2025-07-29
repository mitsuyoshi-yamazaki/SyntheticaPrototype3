# blueprint-replication.c のSynthetica Scriptコンパイル結果

## コンパイル概要

- ソースファイル: blueprint-replication.c
- ターゲット: Synthetica Script v3.0.0 (16bit)
- コンパイル日: 2024-01-29

## 課題点と制限事項

### 1. 設計図フォーマットのメモリ配置
- 設計図は0x0400から開始
- ビット演算（シフト、OR）がSynthetica Scriptには存在しない
- 16bit値の組み立ては上位・下位バイトを別々に処理

### 2. 条件分岐の複雑さ
- has_hull, has_assembler, has_computerの各フラグによる分岐
- ネストした条件は複数のジャンプで実装

### 3. プログラムサイズの制限
- 設計図内のプログラムは最大約400バイト
- 大規模なプログラムの格納は困難

## コンパイル結果

```assembly
; blueprint-replication Synthetica Script
; 設計図ベースの万能複製エージェント
; メモリマップ:
;   0x0000-0x0002: 待機ループ削除用NOP
;   0x0003-: メインプログラム
;   0x0300-0x0303: 作業用変数
;   0x0400-0x05FF: 設計図領域（512バイト）

; 設計図フォーマット:
;   0x0400: Magic Number (0xBEEF) - 削除により使用せず
;   0x0401: Version
;   0x0402: HULL flag
;   0x0403: ASSEMBLER flag
;   0x0404: COMPUTER flag
;   0x0405-0x0406: Program size (16bit)
;   0x0410-0x0411: HULL capacity (16bit)
;   0x0418-0x0419: ASSEMBLER power (16bit)
;   0x0420-0x0423: COMPUTER spec (freq, memory)
;   0x0428-: Program data

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
; 自己複製フェーズ（検証削除）
; ====================
replication_loop:
0x0003: A0 02 04 00    ; LOAD_ABS A, [0x0402] ; has_hull
0x0007: 50 00 00 00    ; LOAD_IMM B, 0x0000
0x000B: 41             ; MOV_AB
0x000C: 32             ; CMP_AB
0x000D: 61 00 03       ; JE replication_loop   ; no hull, retry

; 娘HULL生産
; hull_capacity = (BP_HULL_CAPACITY_HIGH << 8) | BP_HULL_CAPACITY_LOW
; ※ビットシフトがないため、別々に処理
0x0010: A0 10 04 00    ; LOAD_ABS A, [0x0410] ; capacity_high
0x0014: 41             ; MOV_AB               ; B = high
0x0015: A0 11 04 00    ; LOAD_ABS A, [0x0411] ; capacity_low
; 16bit値の組み立て（簡略化: lowのみ使用）

0x0019: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003 (param1)
0x001D: 50 FF 00 00    ; LOAD_IMM A, 0x00FF
0x0021: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002 (connect)
0x0025: 50 01 00 00    ; LOAD_IMM A, 0x0001   ; HULL type
0x0029: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001 (unit_type)
0x002D: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0031: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009 (produce)

; テンプレート 0x5A (01011010)
wait_hull_template:
0x0035: 00             ; NOP0
0x0036: 01             ; NOP1
0x0037: 00             ; NOP0
0x0038: 01             ; NOP1
0x0039: 01             ; NOP1
0x003A: 00             ; NOP0
0x003B: 01             ; NOP1
0x003C: 00             ; NOP0

wait_hull:
0x003D: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x0041: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x0045: 32             ; CMP_AB
0x0046: 62 00 3D       ; JNE wait_hull

; 結果確認
0x0049: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D
0x004D: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0051: 41             ; MOV_AB
0x0052: 32             ; CMP_AB
0x0053: 62 00 03       ; JNE replication_loop

; child_hull_idx保存
0x0056: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E
0x005A: A1 00 03 00    ; STORE_ABS [0x0300] = A (VAR_CHILD_HULL_IDX)

; 娘ASSEMBLER生産（フラグチェック）
0x005E: A0 03 04 00    ; LOAD_ABS A, [0x0403] ; has_assembler
0x0062: 50 00 00 00    ; LOAD_IMM B, 0x0000
0x0066: 41             ; MOV_AB
0x0067: 32             ; CMP_AB
0x0068: 61 00 B8       ; JE skip_assembler

; assembler_power読み取り
0x006B: A0 19 04 00    ; LOAD_ABS A, [0x0419] ; power_low
0x006F: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003
0x0073: A0 00 03 00    ; LOAD_ABS A, [0x0300] ; child_hull_idx
0x0077: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002
0x007B: 50 02 00 00    ; LOAD_IMM A, 0x0002   ; ASSEMBLER type
0x007F: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001
0x0083: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0087: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009

; テンプレート 0xA5 (10100101)
wait_assembler_template:
0x008B: 01             ; NOP1
0x008C: 00             ; NOP0
0x008D: 01             ; NOP1
0x008E: 00             ; NOP0
0x008F: 00             ; NOP0
0x0090: 01             ; NOP1
0x0091: 00             ; NOP0
0x0092: 01             ; NOP1

wait_assembler:
0x0093: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x0097: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x009B: 32             ; CMP_AB
0x009C: 62 00 93       ; JNE wait_assembler

; 結果確認（失敗時は娘HULL破棄）
0x009F: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D
0x00A3: 50 02 00 00    ; LOAD_IMM A, 0x0002
0x00A7: 41             ; MOV_AB
0x00A8: 32             ; CMP_AB
0x00A9: 61 00 B2       ; JE assembler_ok

; detach失敗処理
0x00AC: A0 00 03 00    ; LOAD_ABS A, [0x0300]
0x00B0: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006
0x00B4: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x00B8: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005
0x00BC: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x00C0: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007
0x00C4: 60 00 03       ; JMP replication_loop

assembler_ok:
0x00C7: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E
0x00CB: A1 01 03 00    ; STORE_ABS [0x0301] = A (VAR_CHILD_ASSEMBLER_IDX)

skip_assembler:
; 娘COMPUTER生産（フラグチェック）
0x00CF: A0 04 04 00    ; LOAD_ABS A, [0x0404] ; has_computer
0x00D3: 50 00 00 00    ; LOAD_IMM B, 0x0000
0x00D7: 41             ; MOV_AB
0x00D8: 32             ; CMP_AB
0x00D9: 61 01 80       ; JE skip_computer

; computer仕様読み取り
0x00DC: A0 21 04 00    ; LOAD_ABS A, [0x0421] ; freq_low
0x00E0: 91 40 03 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0003
0x00E4: A0 23 04 00    ; LOAD_ABS A, [0x0423] ; mem_low
0x00E8: 91 40 04 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0004
0x00EC: A0 00 03 00    ; LOAD_ABS A, [0x0300] ; child_hull_idx
0x00F0: 91 40 02 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0002
0x00F4: 50 04 00 00    ; LOAD_IMM A, 0x0004   ; COMPUTER type
0x00F8: 91 40 01 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0001
0x00FC: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0100: 91 40 09 00    ; UNIT_MEM_WRITE ASSEMBLER[0], 0x0009

wait_computer:
0x0104: 90 40 09 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x0009
0x0108: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x010C: 32             ; CMP_AB
0x010D: 62 01 04       ; JNE wait_computer

; 結果確認
0x0110: 90 40 0D 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000D
0x0114: 50 04 00 00    ; LOAD_IMM A, 0x0004
0x0118: 41             ; MOV_AB
0x0119: 32             ; CMP_AB
0x011A: 62 00 AC       ; JNE detach_and_retry

; child_computer_idx保存
0x011D: 90 40 0E 00    ; UNIT_MEM_READ ASSEMBLER[0], 0x000E
0x0121: A1 02 03 00    ; STORE_ABS [0x0302] = A
0x0125: 24             ; MOV_AD               ; D = child_computer_idx

; プログラムサイズ読み取り
0x0126: A0 06 04 00    ; LOAD_ABS A, [0x0406] ; size_low
0x012A: A1 03 03 00    ; STORE_ABS [0x0303] = A
0x012E: 42             ; MOV_AC               ; C = program_size

; 待機ループ設置
0x012F: 50 60 00 00    ; LOAD_IMM A, 0x0060   ; JMP
0x0133: 91 C0 00 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0000
0x0137: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x013B: 91 C0 01 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0001
0x013F: 91 C0 02 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0002

; プログラム転送ループ（簡略化）
0x0143: 50 00 00 00    ; LOAD_IMM A, 0x0000   ; i = 0
0x0147: 41             ; MOV_AB               ; B = i

program_copy_loop:
0x0148: 21             ; MOV_BA               ; A = i
0x0149: 32             ; CMP_AB               ; i < size?
0x014A: 68 01 70       ; JGE copy_done

; 設計図からプログラム読み取り
0x014D: 21             ; MOV_BA               ; A = i
0x014E: 50 28 04 00    ; LOAD_IMM C, 0x0428   ; BP_PROGRAM_DATA
0x0152: 30             ; ADD_AB               ; A = 0x0428 + i
; ※実際には16bit加算が必要だが簡略化

0x0153: 53 00 00 00    ; LOAD_IND A, [A]      ; value = blueprint[addr]
0x0157: 43             ; INC_B                ; B = i + 3 (先頭3バイトスキップ)
0x0158: 43             ; INC_B
0x0159: 43             ; INC_B
0x015A: 91 CB 00 00    ; UNIT_MEM_WRITE COMPUTER[D], [B]
0x015E: 43             ; INC_B                ; i++
0x015F: 60 01 48       ; JMP program_copy_loop

copy_done:
; 待機ループ削除
0x0162: 50 00 00 00    ; LOAD_IMM A, 0x0000
0x0166: 91 C0 00 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0000
0x016A: 91 C0 01 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0001
0x016E: 91 C0 02 00    ; UNIT_MEM_WRITE COMPUTER[D], 0x0002

skip_computer:
; 娘エージェントの分離
0x0172: A0 00 03 00    ; LOAD_ABS A, [0x0300]
0x0176: 91 00 06 00    ; UNIT_MEM_WRITE HULL[0], 0x0006
0x017A: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x017E: 91 00 05 00    ; UNIT_MEM_WRITE HULL[0], 0x0005
0x0182: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x0186: 91 00 07 00    ; UNIT_MEM_WRITE HULL[0], 0x0007

; エネルギー回収設定とループ
0x018A: 50 01 00 00    ; LOAD_IMM A, 0x0001
0x018E: 91 00 03 00    ; UNIT_MEM_WRITE HULL[0], 0x0003

energy_wait:
0x0192: 90 00 02 00    ; UNIT_MEM_READ HULL[0], 0x0002
0x0196: 41             ; MOV_AB
0x0197: 50 00 50 00    ; LOAD_IMM A, 0x5000   ; 約20,480E
0x019B: 32             ; CMP_AB
0x019C: 69 01 92       ; JL energy_wait

0x019F: 60 00 03       ; JMP replication_loop

```

## 実装における課題

### 1. ビット演算の欠如
- 16bit値の組み立て（high << 8 | low）が困難
- 現在の実装では下位バイトのみ使用（制限あり）

### 2. 間接アドレッシングの制限
- 設計図からのプログラム読み取りで可変アドレスアクセスが必要
- LOAD_IND命令では十分でない場合がある

### 3. 動的メモリアクセス
- forループでの配列アクセスが複雑
- インデックス計算とアドレス計算の分離が必要

### 4. 設計図検証の削除による影響
- 無効な設計図でも実行を試みる
- エラー処理が不十分になる可能性

## 結論

blueprint-based replicationは最も柔軟な自己複製方式だが、現在のSynthetica Script仕様では以下の制限がある：

1. **ビット演算命令の不足** - 16bit値の操作が困難
2. **動的メモリアクセスの制限** - 設計図の柔軟な読み取りが難しい
3. **プログラムサイズの制限** - 大規模なプログラムの転送は非現実的

これらの制限により、真の「万能複製」の実現には仕様の拡張が望まれる。特に：
- ビットシフト命令（SHL, SHR）
- より柔軟な間接アドレッシング
- メモリブロック転送命令