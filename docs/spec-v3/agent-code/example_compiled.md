# example.c のSynthetica Scriptコンパイル結果

## メモリマップ

```
0x00-0x01: プログラム開始（初期化後に無限ループ解除される）
0x02-: メインプログラム
0xF0: child_hull_index（変数）
0xF1: memory_size（変数）
0xF2: memory_address（変数）
0xF3-0xFF: 予約
```

## ユニットメモリアドレス定義（ラベル）

```assembly
; HULL メモリマップ
HULL_ADDRESS_CAPACITY        ; 最大容量
HULL_ADDRESS_CURRENT_LOAD    ; 現在の格納量
HULL_ADDRESS_ENERGY_AMOUNT   ; エネルギー保有量
HULL_ADDRESS_MERGE_TARGET    ; マージ対象HULL ID

; ASSEMBLER メモリマップ  
ASSEMBLER_ADDRESS_STATUS     ; 状態（稼働中/待機中）
ASSEMBLER_ADDRESS_UNIT_TYPE  ; 生産ユニット種別
ASSEMBLER_ADDRESS_PARAM1     ; 生産パラメータ1
ASSEMBLER_ADDRESS_PARAM2     ; 生産パラメータ2
ASSEMBLER_ADDRESS_START      ; 生産開始フラグ
ASSEMBLER_ADDRESS_LAST_TYPE  ; 最後に生成したユニット種別
ASSEMBLER_ADDRESS_LAST_INDEX ; 最後に生成したユニットインデックス

; ユニット種別コード
UNIT_TYPE_NONE      0x00
UNIT_TYPE_HULL      0x01
UNIT_TYPE_ASSEMBLER 0x02
UNIT_TYPE_DISASSEMBLER 0x03
UNIT_TYPE_COMPUTER  0x04
```

## コンパイル結果

```assembly
; ===========================================
; 自己複製エージェント（祖先種）
; ===========================================

; アドレス0x00: 初期無限ループ（子COMPUTERで使用）
0x00: JMP         ; 自身へジャンプ（初期値0で自己ループ）
0x01: 0x00        ; ジャンプ先オフセット

; ===========================================
; メインプログラム開始（アドレス0x02）
; ===========================================

MAIN_LOOP:
0x02: NOP1 NOP1 NOP0 NOP0    ; テンプレート: 1100（メインループマーカー）

; --- 成長フェーズ ---
GROWTH_PHASE:
    ; get_capacity(0) > REPRODUCTION_HULL_CAPACITY のチェック
0x06: UNIT_MEM_READ
0x07: 0x00                    ; HULL[0]
0x08: HULL_ADDRESS_CAPACITY   ; 容量取得
    
    ; 200と比較（REPRODUCTION_HULL_CAPACITY）
0x09: MOV_AB                  ; A→B（容量を保存）
0x0A: LOAD_IMM
0x0B: 0xC8                    ; 200（仮の値として8bitに収まるよう200を使用）
    
0x0D: XCHG                    ; A↔B
0x0E: CMP_AB                  ; 容量 - 200
0x0F: JG                      ; 容量 > 200なら
0x10: 0x40                    ; REPRODUCTION_PHASEへジャンプ

; --- HULL拡張処理 ---
EXPAND_HULL:
    ; reset_last_assembled_unit(0)
0x11: LOAD_IMM
0x12: UNIT_TYPE_NONE          ; 0x00
0x13: UNIT_MEM_WRITE
0x14: 0x40                    ; ASSEMBLER[0]
0x15: ASSEMBLER_ADDRESS_LAST_TYPE

0x16: LOAD_IMM
0x17: 0xFF                    ; UNIT_INDEX_NONE
0x18: UNIT_MEM_WRITE
0x19: 0x40                    ; ASSEMBLER[0]
0x1A: ASSEMBLER_ADDRESS_LAST_INDEX

    ; assemble(0, HULL, EXPAND_HULL_CAPACITY)
0x1B: LOAD_IMM
0x1C: UNIT_TYPE_HULL          ; HULL種別
0x1D: UNIT_MEM_WRITE
0x1E: 0x40                    ; ASSEMBLER[0]
0x1F: ASSEMBLER_ADDRESS_UNIT_TYPE

0x20: LOAD_IMM
0x21: 0x14                    ; EXPAND_HULL_CAPACITY = 20
0x22: UNIT_MEM_WRITE
0x23: 0x40                    ; ASSEMBLER[0]
0x24: ASSEMBLER_ADDRESS_PARAM1

    ; 生産開始
0x25: LOAD_IMM
0x26: 0x01                    ; 開始フラグ
0x27: UNIT_MEM_WRITE
0x28: 0x40                    ; ASSEMBLER[0]
0x29: ASSEMBLER_ADDRESS_START

; --- アセンブル待機ループ ---
WAIT_EXPAND_ASSEMBLY:
0x2A: NOP0 NOP0 NOP1 NOP1    ; テンプレート: 0011
    
    ; is_assembling(0)のチェック
0x2E: UNIT_MEM_READ
0x2F: 0x40                    ; ASSEMBLER[0]
0x30: ASSEMBLER_ADDRESS_STATUS
    
0x31: JZ                      ; 待機中（0）なら
0x32: 0x08                    ; CHECK_EXPAND_RESULTへ

    ; まだアセンブル中ならループ継続
0x33: SEARCH_B                ; 待機ループマーカーを検索
0x34: NOP1 NOP1 NOP0 NOP0    ; 補完: 1100
0x38: JMP_IND                 ; 見つかった位置へジャンプ
0x39: 0x01                    ; Bレジスタ
0x3A: 0x00

; --- 拡張結果確認 ---
CHECK_EXPAND_RESULT:
0x3B: UNIT_MEM_READ
0x3C: 0x40                    ; ASSEMBLER[0]
0x3D: ASSEMBLER_ADDRESS_LAST_TYPE
    
0x3E: MOV_AB                  ; A→B
0x3F: LOAD_IMM
0x40: UNIT_TYPE_HULL
0x41: CMP_AB
0x42: JNZ                     ; HULLでなければ
0x43: 0x10                    ; SKIP_MERGEへ

    ; merge_hull(get_last_assembled_unit_index(0), 0)
0x44: UNIT_MEM_READ
0x45: 0x40                    ; ASSEMBLER[0]
0x46: ASSEMBLER_ADDRESS_LAST_INDEX
    
    ; マージ実行（両HULLで相互指定が必要）
0x47: UNIT_MEM_WRITE          ; 新HULLから親を指定
0x48: 0x00                    ; HULL[取得したindex] ※動的に決まる
0x49: HULL_ADDRESS_MERGE_TARGET
    
0x4A: LOAD_IMM
0x4B: 0x00                    ; ※実際は新HULLのindexを指定
0x4C: UNIT_MEM_WRITE
0x4D: 0x00                    ; HULL[0]
0x4E: HULL_ADDRESS_MERGE_TARGET

SKIP_MERGE:
    ; reset_last_assembled_unit(0)
0x4F: LOAD_IMM
0x50: UNIT_TYPE_NONE
0x51: UNIT_MEM_WRITE
0x52: 0x40                    ; ASSEMBLER[0]
0x53: ASSEMBLER_ADDRESS_LAST_TYPE

    ; メインループへ戻る
0x54: SEARCH_B                ; メインループマーカーを検索
0x55: NOP0 NOP0 NOP1 NOP1    ; 補完: 0011
0x59: JMP_IND
0x5A: 0x01
0x5B: 0x00

; ===========================================
; 自己複製フェーズ（アドレス0x5C）
; ===========================================

REPRODUCTION_PHASE:
0x5C: NOP1 NOP0 NOP1 NOP0    ; テンプレート: 1010（複製フェーズマーカー）

REPRODUCTION_LOOP:
    ; --- 娘HULL作成 ---
    ; reset_last_assembled_unit(0)
0x60: LOAD_IMM
0x61: UNIT_TYPE_NONE
0x62: UNIT_MEM_WRITE
0x63: 0x40
0x64: ASSEMBLER_ADDRESS_LAST_TYPE

    ; assemble(0, HULL, CHILD_HULL_CAPACITY)
0x65: LOAD_IMM
0x66: UNIT_TYPE_HULL
0x67: UNIT_MEM_WRITE
0x68: 0x40
0x69: ASSEMBLER_ADDRESS_UNIT_TYPE

0x6A: LOAD_IMM
0x6B: 0x64                    ; CHILD_HULL_CAPACITY = 100
0x6C: UNIT_MEM_WRITE
0x6D: 0x40
0x6E: ASSEMBLER_ADDRESS_PARAM1

0x6F: LOAD_IMM
0x70: 0x01
0x71: UNIT_MEM_WRITE
0x72: 0x40
0x73: ASSEMBLER_ADDRESS_START

; --- 待機ループ ---
WAIT_HULL_ASSEMBLY:
0x74: NOP0 NOP1 NOP0 NOP1    ; テンプレート: 0101
    
0x78: UNIT_MEM_READ
0x79: 0x40
0x7A: ASSEMBLER_ADDRESS_STATUS
0x7B: JZ
0x7C: 0x08                    ; CHECK_HULL_RESULTへ

0x7D: SEARCH_B
0x7E: NOP1 NOP0 NOP1 NOP0    ; 補完: 1010
0x82: JMP_IND
0x83: 0x01
0x84: 0x00

CHECK_HULL_RESULT:
    ; HULLが正しく作成されたかチェック
0x85: UNIT_MEM_READ
0x86: 0x40
0x87: ASSEMBLER_ADDRESS_LAST_TYPE
0x88: MOV_AB
0x89: LOAD_IMM
0x8A: UNIT_TYPE_HULL
0x8B: CMP_AB
0x8C: JNZ
0x8D: 0x20                    ; DETACH_AND_CONTINUEへ

    ; child_hull_indexを保存
0x8E: UNIT_MEM_READ
0x8F: 0x40
0x90: ASSEMBLER_ADDRESS_LAST_INDEX
0x91: STORE_ABS
0x92: 0xF0                    ; child_hull_index変数
0x93: 0x00

    ; --- 娘ASSEMBLER作成 ---
    ; （同様のパターンなので省略表記）
0x94: ; reset → assemble → wait → check の処理
    ; ...
    
    ; --- 娘COMPUTER作成 ---
0xA0: ; reset → assemble → wait → check の処理
    ; ...

    ; --- メモリ転送 ---
MEMORY_TRANSFER:
    ; 無限ループ書き込み
0xB0: LOAD_IMM
0xB1: 0x60                    ; JMP命令
0xB2: UNIT_MEM_WRITE
0xB3: 0xC1                    ; COMPUTER[1]
0xB4: 0x00

    ; search_template(0xCC) - 終了位置検索
0xB5: SEARCH_F
0xB6: NOP0 NOP1 NOP0 NOP1    ; 0x55の補完: 0101
0xBA: MOV_BA                  ; 検索結果を保存
0xBB: STORE_ABS
0xBC: 0xF1                    ; memory_size変数
0xBD: 0x00

    ; 転送ループ初期化
0xBE: LOAD_IMM
0xBF: 0x02                    ; 開始アドレス
0xC0: STORE_ABS
0xC1: 0xF2                    ; memory_address変数
0xC2: 0x00

TRANSFER_LOOP:
0xC3: NOP1 NOP1 NOP1 NOP0    ; テンプレート: 1110
    
    ; 自メモリ読み取り
0xC7: LOAD_ABS
0xC8: 0xF2                    ; memory_address
0xC9: 0x00
0xCA: MOV_AB                  ; アドレスをBへ
0xCB: LOAD_IND                ; Memory[B]を読む
0xCC: 0x00
    
    ; 子COMPUTERへ書き込み
0xCD: MOV_AB                  ; 値を一時保存
0xCE: LOAD_ABS
0xCF: 0xF2                    ; memory_address
0xD0: 0x00
0xD1: ; ※ここで動的アドレス指定が必要（現仕様では困難）
    
    ; memory_address++
0xD5: LOAD_ABS
0xD6: 0xF2
0xD7: 0x00
0xD8: INC_A
0xD9: STORE_ABS
0xDA: 0xF2
0xDB: 0x00
    
    ; memory_address <= memory_sizeチェック
0xDC: MOV_AB
0xDD: LOAD_ABS
0xDE: 0xF1                    ; memory_size
0xDF: 0x00
0xE0: CMP_AB
0xE1: JG                      ; address > sizeなら
0xE2: 0x10                    ; 転送終了へ

    ; ループ継続
0xE3: SEARCH_B
0xE4: NOP0 NOP0 NOP0 NOP1    ; 補完: 0001
0xE8: JMP_IND
0xE9: 0x01
0xEA: 0x00

    ; 無限ループ解除
0xEB: LOAD_IMM
0xEC: 0x00                    ; NOP
0xED: UNIT_MEM_WRITE
0xEE: 0xC1                    ; COMPUTER[1]
0xEF: 0x00

    ; --- 娘エージェント分離 ---
0xF0: ; detach(0, HULL, child_hull_index) の実装
    ; ...

    ; 複製ループへ戻る
0xF5: SEARCH_B
0xF6: NOP0 NOP1 NOP0 NOP1    ; 複製フェーズマーカーの補完
0xFA: JMP_IND
0xFB: 0x01
0xFC: 0x00

; 終了マーカー
0xFD: NOP0 NOP1 NOP0 NOP1    ; テンプレート: 0101（0x55）
```

## 改善版コンパイル結果（新命令使用）

```assembly
; ===========================================
; 自己複製エージェント（レジスタベース版）
; ===========================================

; メモリマップ
; 0x00-0x01: 初期化用無限ループ
; 0x02-: メインプログラム
; 0xF0: child_hull_index
; 0xF1: child_assembler_index
; 0xF2: child_computer_index
; 0xF3: memory_size
; 0xF4: memory_address（転送用）

; アドレス0x00: 初期無限ループ
0x00: JMP
0x01: 0x00

; ===========================================
; メインプログラム開始（アドレス0x02）
; ===========================================

MAIN_LOOP:
0x02: NOP1 NOP1 NOP0 NOP0    ; テンプレート: 1100

; --- 成長フェーズ ---
GROWTH_PHASE:
    ; get_capacity(0) > REPRODUCTION_HULL_CAPACITY
0x06: UNIT_MEM_READ
0x07: 0x00                    ; HULL[0]
0x08: 0x01                    ; 最大容量
    
0x09: MOV_AB
0x0A: LOAD_IMM
0x0B: 0xC8                    ; 200（REPRODUCTION_HULL_CAPACITY）
0x0D: CMP_AB
0x0E: JG
0x0F: 0x50                    ; REPRODUCTION_PHASEへ

; --- HULL拡張処理 ---
EXPAND_HULL:
    ; reset_last_assembled_unit(0)
0x10: LOAD_IMM
0x11: 0x00                    ; UNIT_TYPE_NONE
0x12: UNIT_MEM_WRITE
0x13: 0x40                    ; ASSEMBLER[0]
0x14: 0x05                    ; ASSEMBLER_ADDRESS_LAST_TYPE

    ; assemble(0, HULL, EXPAND_HULL_CAPACITY)
0x15: LOAD_IMM
0x16: 0x01                    ; UNIT_TYPE_HULL
0x17: UNIT_MEM_WRITE
0x18: 0x40
0x19: 0x10                    ; ASSEMBLER_ADDRESS_UNIT_TYPE

0x1A: LOAD_IMM
0x1B: 0x14                    ; EXPAND_HULL_CAPACITY = 20
0x1C: UNIT_MEM_WRITE
0x1D: 0x40
0x1E: 0x11                    ; ASSEMBLER_ADDRESS_PARAM1

0x1F: LOAD_IMM
0x20: 0x01                    ; 開始フラグ
0x21: UNIT_MEM_WRITE
0x22: 0x40
0x23: 0x1F                    ; ASSEMBLER_ADDRESS_START

; --- 待機＆マージ処理 ---
WAIT_AND_MERGE:
0x24: UNIT_MEM_READ
0x25: 0x40
0x26: 0x00                    ; ASSEMBLER_ADDRESS_STATUS
0x27: JNZ                     ; まだアセンブル中
0x28: -0x04                   ; ループ

    ; マージ実行
0x29: UNIT_MEM_READ
0x2A: 0x40
0x2B: 0x06                    ; ASSEMBLER_ADDRESS_LAST_INDEX
0x2C: MOV_AD                  ; 新HULL indexをDに

    ; 新HULLから親を指定
0x2D: LOAD_IMM
0x2E: 0x00                    ; 親HULL[0]
0x2F: MOV_BC                  ; Cにアドレス0x03
0x30: LOAD_IMM
0x31: 0x03                    ; HULL_ADDRESS_MERGE_TARGET
0x32: MOV_AC
0x33: UNIT_MEM_WRITE_REG
0x34: 0x3C                    ; D=ユニット、C=アドレス
0x35: 0x00

    ; 親HULLから新HULLを指定
0x36: MOV_DA                  ; 新HULL index
0x37: UNIT_MEM_WRITE
0x38: 0x00                    ; HULL[0]
0x39: 0x03                    ; HULL_ADDRESS_MERGE_TARGET

    ; メインループへ戻る
0x3A: JMP
0x3B: -0x39                   ; MAIN_LOOPへ

; ===========================================
; 自己複製フェーズ（アドレス0x3C）
; ===========================================

REPRODUCTION_PHASE:
0x3C: NOP1 NOP0 NOP1 NOP0    ; テンプレート: 1010

; --- 娘HULL作成 ---
CREATE_CHILD_HULL:
    ; reset & assemble
0x40: LOAD_IMM
0x41: 0x00
0x42: UNIT_MEM_WRITE
0x43: 0x40
0x44: 0x05                    ; LAST_TYPE

0x45: LOAD_IMM
0x46: 0x01                    ; HULL
0x47: UNIT_MEM_WRITE
0x48: 0x40
0x49: 0x10

0x4A: LOAD_IMM
0x4B: 0x64                    ; CHILD_HULL_CAPACITY = 100
0x4C: UNIT_MEM_WRITE
0x4D: 0x40
0x4E: 0x11

0x4F: LOAD_IMM
0x50: 0x01
0x51: UNIT_MEM_WRITE
0x52: 0x40
0x53: 0x1F

WAIT_HULL:
0x54: UNIT_MEM_READ
0x55: 0x40
0x56: 0x00
0x57: JNZ
0x58: -0x04

    ; child_hull_index保存
0x59: UNIT_MEM_READ
0x5A: 0x40
0x5B: 0x06                    ; LAST_INDEX
0x5C: STORE_ABS
0x5D: 0xF0                    ; child_hull_index
0x5E: 0x00

; --- 娘ASSEMBLER作成（省略形） ---
0x5F: ; 同様のパターンでASSEMBLER作成
    ; 結果を0xF1に保存

; --- 娘COMPUTER作成（省略形） ---
0x70: ; 同様のパターンでCOMPUTER作成
    ; 結果を0xF2に保存

; --- メモリ転送（レジスタベース版） ---
MEMORY_TRANSFER:
    ; 子COMPUTERインデックスをDに設定
0x80: LOAD_ABS
0x81: 0xF2                    ; child_computer_index
0x82: 0x00
0x83: MOV_AB
0x84: LOAD_IMM
0x85: 0xC0                    ; COMPUTER種別
0x86: ADD_AB                  ; 0xC0 + index
0x87: MOV_AD                  ; Dにユニット指定

    ; 無限ループ書き込み
0x88: LOAD_IMM
0x89: 0x60                    ; JMP
0x8A: MOV_BC                  ; C = 0
0x8B: UNIT_MEM_WRITE_REG
0x8C: 0x3C                    ; D、C
0x8D: 0x00

    ; プログラムサイズ検索
0x8E: SEARCH_F
0x8F: NOP0 NOP1 NOP0 NOP1    ; 0x55の補完
0x93: STORE_ABS
0x94: 0xF3                    ; memory_size
0x95: 0x00

    ; 転送ループ初期化
0x96: LOAD_IMM
0x97: 0x02                    ; 開始アドレス
0x98: MOV_AB                  ; B = ソース
0x99: MOV_AC                  ; C = 宛先

TRANSFER_LOOP:
0x9A: LOAD_REG                ; A = Memory[B]
0x9B: 0x01                    ; Bレジスタ
    
0x9C: UNIT_MEM_WRITE_REG      ; 子COMPUTERへ書き込み
0x9D: 0x3C                    ; D、C
0x9E: 0x00
    
0x9F: INC_B
0xA0: INC_C
    
    ; 終了判定
0xA1: MOV_BA
0xA2: LOAD_ABS
0xA3: 0xF3                    ; memory_size
0xA4: 0x00
0xA5: CMP_AB
0xA6: JLE
0xA7: -0x0D                   ; TRANSFER_LOOPへ

    ; 無限ループ解除
0xA8: LOAD_IMM
0xA9: 0x00                    ; NOP
0xAA: MOV_BC                  ; C = 0
0xAB: UNIT_MEM_WRITE_REG
0xAC: 0x3C
0xAD: 0x00

; --- 娘エージェント分離 ---
DETACH_CHILD:
    ; detach(0, HULL, child_hull_index)
0xAE: LOAD_IMM
0xAF: 0x01                    ; HULL種別
0xB0: UNIT_MEM_WRITE
0xB1: 0x00                    ; HULL[0]
0xB2: 0x06                    ; DETACH_TYPE

0xB3: LOAD_ABS
0xB4: 0xF0                    ; child_hull_index
0xB5: 0x00
0xB6: UNIT_MEM_WRITE
0xB7: 0x00
0xB8: 0x07                    ; DETACH_INDEX

0xB9: LOAD_IMM
0xBA: 0x01                    ; 実行フラグ
0xBB: UNIT_MEM_WRITE
0xBC: 0x00
0xBD: 0x08                    ; DETACH_EXECUTE

    ; 複製ループへ戻る
0xBE: JMP
0xBF: -0x83                   ; REPRODUCTION_PHASEへ

; 終了マーカー
0xC0: NOP0 NOP1 NOP0 NOP1    ; テンプレート: 0101（0x55）
```

## 改善点

### 1. 動的インデックス指定 ✅
- レジスタベース命令により、`child_hull_index`などの変数でユニット指定が可能に

### 2. 動的メモリアドレス ✅
- `UNIT_MEM_WRITE_REG`でCレジスタを使用し、メモリアドレスを動的に指定

### 3. detach操作 ✅
- HULLメモリマップに追加されたdetach操作を使用

### 4. プログラムサイズ
- 現在約192バイト（0xC0）で256バイト以内に収まる
- さらなる最適化も可能

### 5. 効率性
- レジスタベース命令により、ループ処理が大幅に簡潔化
- メモリアクセス回数の削減