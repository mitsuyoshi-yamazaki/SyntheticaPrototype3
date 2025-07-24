# ユニットパラメータ値の比較と分岐の実装例

## 概要

HULLの容量などのユニットパラメータをリテラル値と比較して分岐する実装方法を示します。

## 実装例1: HULLの容量チェック

### アセンブリコード

```assembly
; HULLの容量が100以上かチェックして分岐
CHECK_HULL_CAPACITY:
    ; HULL[0]の状態を読み取り（容量は上位バイト）
    UNIT_MEM_READ       ; 外部ユニットメモリ読み取り
    0x00                ; HULL[0]
    0x00                ; アドレス0x00（状態の上位バイト=容量使用率）
    
    ; Aレジスタに容量使用率が格納される
    ; 実際の容量を計算するには、HULLの最大容量情報も必要
    
    ; 比較のため、Bレジスタに閾値（100）をロード
    MOV_AB              ; A→B（一時保存）
    LOAD_IMM            ; A = 100
    0x64                ; 100（0x64）
    
    ; B（容量）とA（100）を比較
    ; A = B - A（キャリーフラグで大小判定）
    MOV_BA              ; B→A（容量を戻す）
    XCHG                ; A↔B（100がB、容量がA）
    ; ここで減算命令があれば使うが、ない場合は別の方法で比較
    
    ; XORで等しいかチェック（等しければゼロフラグセット）
    XOR_AB              ; A = A XOR B
    JZ                  ; ゼロなら（容量==100）
    0x10                ; EQUAL_100へジャンプ
    
    ; 容量が100でない場合の処理
    JMP                 ; 
    0x20                ; NOT_EQUAL_100へ

EQUAL_100:
    ; 容量が100の場合の処理
    ; ...
    
NOT_EQUAL_100:
    ; 容量が100でない場合の処理
    ; ...
```

## 実装例2: より実用的な大小比較

メモリマップドI/Oでは、ユニットの実際のパラメータ値を直接取得できる設計にすることが重要です。

### 改善案: HULLメモリマップの拡張

```
HULL（16バイト）
0x00: 現在の格納量（エネルギー量 + ユニット占有量）
0x01: 最大容量
0x02: エネルギー回収ON/OFF
0x03: マージ対象HULL ID
0x04-0x0F: 予約
```

### 改善後の実装

```assembly
; HULLの空き容量が50以上あるかチェック
CHECK_FREE_SPACE:
    ; 現在の格納量を取得
    UNIT_MEM_READ
    0x00                ; HULL[0]
    0x00                ; 現在の格納量
    MOV_AB              ; A→B（格納量を保存）
    
    ; 最大容量を取得
    UNIT_MEM_READ
    0x00                ; HULL[0]  
    0x01                ; 最大容量
    
    ; 空き容量 = 最大容量 - 現在格納量
    ; （減算命令がないため、加算で代用）
    ; まず現在格納量の補数を作る
    MOV_BA              ; B→A（格納量）
    XOR_AB              ; A = A XOR 0xFF（Bに0xFFを事前設定必要）
    INC_A               ; A = -格納量（2の補数）
    
    ; 最大容量を加算（結果は空き容量）
    ADD_AB              ; A = A + B（最大容量）
    
    ; 空き容量を50と比較
    MOV_AB              ; A→B（空き容量を保存）
    LOAD_IMM            ; A = 50
    0x32                ; 50（0x32）
    
    ; 比較ロジック（簡略版）
    ; 実際には減算と符号判定が必要
    ...
```

## 実装例3: C言語風の高レベル実装

```c
// C言語でのイメージ（将来的なコンパイラ実装時）
void check_hull_capacity() {
    // メモリマップドI/Oで直接アクセス
    uint8_t current_load = unit_mem_read(HULL, 0, 0x00);
    uint8_t max_capacity = unit_mem_read(HULL, 0, 0x01);
    
    uint8_t free_space = max_capacity - current_load;
    
    if (free_space >= 50) {
        // 十分な空き容量がある
        start_production();
    } else {
        // 空き容量不足
        wait_or_expand();
    }
}
```

## 実装上の課題と解決策

### 1. 比較演算の不足

現在の命令セットには減算命令や符号付き比較命令がないため、大小比較が困難です。

**解決策の提案**:
- SUB_AB命令の追加（A = A - B）
- CMP命令の追加（フラグのみ更新）
- JG/JL命令の追加（符号付き大小でジャンプ）

### 2. ユニットパラメータの設計

メモリマップドI/Oでは、比較しやすい形式でパラメータを提供することが重要です。

**推奨事項**:
- 生の数値をそのまま提供（百分率ではなく実数値）
- 関連するパラメータを隣接アドレスに配置
- 頻繁に使用するパラメータは低アドレスに配置

## テンプレート方式での実装

位置独立で進化耐性のある実装：

```assembly
; 容量チェックルーチンのマーカー
CAPACITY_CHECK:
    NOP1 NOP0 NOP1 NOP1    ; マーカー: 1011
    
    ; パラメータ読み取りと比較処理
    UNIT_MEM_READ
    0x00
    0x00
    
    ; 結果に応じて分岐先を検索
    JZ                      ; 条件成立なら
    0x08                    ; 次の検索をスキップ
    
    SEARCH_F                ; 処理Aを検索
    NOP0 NOP1 NOP0 NOP0    ; 補完: 0100
    JMP_IND
    0x01
    0x00
    
    SEARCH_F                ; 処理Bを検索  
    NOP1 NOP0 NOP0 NOP1    ; 補完: 1001
    JMP_IND
    0x01
    0x00
```

## 改善後の実装例（SUB/CMP命令追加版）

### HULLの空き容量チェック（改善版）

```assembly
; HULLの空き容量が50以上あるかチェック
CHECK_FREE_SPACE_V2:
    ; 最大容量を取得
    UNIT_MEM_READ
    0x00                ; HULL[0]  
    0x01                ; 最大容量
    MOV_AB              ; A→B（最大容量を保存）
    
    ; 現在の格納量を取得
    UNIT_MEM_READ
    0x00                ; HULL[0]
    0x00                ; 現在の格納量
    
    ; 空き容量 = 最大容量(B) - 現在格納量(A)
    XCHG                ; A↔B
    SUB_AB              ; A = A - B（空き容量）
    
    ; 空き容量を50と比較
    MOV_AB              ; A→B（空き容量を保存）
    LOAD_IMM            ; A = 50
    0x32                ; 50（0x32）
    
    ; B（空き容量）とA（50）を比較
    XCHG                ; A↔B
    CMP_AB              ; 空き容量 - 50（フラグ更新）
    
    JNC                 ; キャリーなし = 空き容量 >= 50
    0x10                ; ENOUGH_SPACEへ
    
    ; 空き容量不足の処理
    JMP
    0x20                ; NOT_ENOUGH_SPACEへ

ENOUGH_SPACE:
    ; 十分な空き容量がある場合の処理
    ; 例：新しいユニットの生産開始
    LOAD_IMM            ; A = COMPUTER種別
    0xC0
    UNIT_MEM_WRITE
    0x40                ; ASSEMBLER[0]
    0x10                ; 生産ユニット種別
    ; ...

NOT_ENOUGH_SPACE:
    ; 空き容量不足の場合の処理
    ; 例：HULL拡張処理へ
    ; ...
```

### より実用的な例：エネルギー量チェック

```assembly
; エネルギー保有量が自己複製に必要な量（1000E）以上あるかチェック
CHECK_ENERGY:
    ; HULL[0]のエネルギー保有量を取得（仮に0x04アドレスとする）
    UNIT_MEM_READ
    0x00                ; HULL[0]
    0x04                ; エネルギー保有量（下位バイト）
    MOV_AB              ; A→B
    
    UNIT_MEM_READ
    0x00                ; HULL[0]
    0x05                ; エネルギー保有量（上位バイト）
    
    ; 16bit値の比較（簡略版：上位バイトのみチェック）
    ; 1000E = 0x03E8 なので、上位バイトが4以上なら十分
    LOAD_IMM
    0x04                ; 4
    CMP_AB              ; 上位バイト - 4
    
    JG                  ; 上位バイト > 4なら十分
    0x10                ; START_REPLICATIONへ
    
    JZ                  ; 上位バイト == 4なら下位バイトもチェック
    0x20                ; CHECK_LOWER_BYTEへ
    
    ; エネルギー不足
    JMP
    0x30                ; WAIT_ENERGYへ
```

## まとめ

命令セットにSUB_AB、CMP_AB、JC/JNC/JG/JLE命令を追加することで：

1. **効率的な比較**: 値の比較が1-2命令で可能
2. **符号付き/なし両対応**: unsigned（JC/JNC）とsigned（JG/JLE）の両方をサポート
3. **人間に優しい**: 一般的なアセンブリ言語の経験が活用可能

これらの改善により、人間プログラマにとってもより直感的なコーディングが可能になります。