# ビット演算を活用した効率的な実装パターン

## 概要

このドキュメントは、Synthetica v3.1.0で追加されたビットシフト命令（SHL, SHR, SAR）を活用した効率的な実装パターンを提供します。1024進法エネルギーシステムと16bitアーキテクチャにおける最適化技法をまとめています。

## 1024進法エネルギー計算

### エネルギー値の構造

```
32bit エネルギー値:
[上位16bit: 1024E単位] [下位16bit: 1E単位]
```

### 基本的な演算パターン

#### 1024E単位の抽出

```assembly
; Aレジスタに32bitエネルギー値
; 上位16bitを取得
MOV B, A
SHR B, 16           ; B = 1024E単位の値
```

#### 1E単位の抽出

```assembly
; Aレジスタに32bitエネルギー値
; 下位16bitを取得
MOV B, A
AND B, #0xFFFF      ; B = 1E単位の値
```

#### エネルギー値の組み立て

```assembly
; A = 1024E単位, B = 1E単位
SHL A, 16           ; A = 1024E単位を上位16bitへ
OR A, B             ; A = 完全な32bitエネルギー値
```

### エネルギー計算の最適化

#### 1024倍の計算（10ビット左シフト）

```assembly
; A = 元の値
; 1024倍 = 2^10倍
SHL A, 10           ; A = 元の値 × 1024
```

#### 1024での除算（10ビット右シフト）

```assembly
; A = 元の値
; 1024で除算 = 2^10で除算
SHR A, 10           ; A = 元の値 ÷ 1024（切り捨て）
```

#### エネルギー単位変換

```assembly
; 15E を 1024E単位系に変換
MOV A, #15
ADD A, #1024        ; 繰り上がり処理
SHR A, 10           ; A = 0（15は1024未満なので0）

; 2048E を 1024E単位系に変換
MOV A, #2048
SHR A, 10           ; A = 2（2048 ÷ 1024 = 2）
```

## 効率的な乗算・除算

### 2のべき乗での乗算

```assembly
; × 2
SHL A, 1

; × 4
SHL A, 2

; × 8
SHL A, 3

; × 16
SHL A, 4

; × 32
SHL A, 5
```

### 2のべき乗での除算

```assembly
; ÷ 2
SHR A, 1

; ÷ 4
SHR A, 2

; ÷ 8
SHR A, 3

; ÷ 16
SHR A, 4

; ÷ 32
SHR A, 5
```

### 近似的な除算

```assembly
; ÷ 10 の近似（実際は ÷ 10.24）
; x/10 ≈ x/10.24 = (x * 100) >> 10
MOV B, A
MOV C, #100
MUL B, C
SHR B, 10

; ÷ 20 の近似
; x/20 ≈ (x >> 4) - (x >> 6)
MOV B, A
SHR B, 4            ; B = x/16
MOV C, A
SHR C, 6            ; C = x/64
SUB B, C            ; B ≈ x/20

; ÷ 100 の近似
; x/100 ≈ (x * 41) >> 12
MOV B, A
MOV C, #41
MUL B, C
SHR B, 12
```

## フラグとビットマスク操作

### ビットフラグの設定

```assembly
; ビット3を設定
MOV A, [flags]
OR A, #0x0008       ; 0000 0000 0000 1000
MOV [flags], A

; ビット7を設定
MOV A, [flags]
OR A, #0x0080       ; 0000 0000 1000 0000
MOV [flags], A
```

### ビットフラグのクリア

```assembly
; ビット3をクリア
MOV A, [flags]
AND A, #0xFFF7      ; 1111 1111 1111 0111
MOV [flags], A

; ビット7をクリア
MOV A, [flags]
AND A, #0xFF7F      ; 1111 1111 0111 1111
MOV [flags], A
```

### ビットフラグのトグル

```assembly
; ビット3をトグル
MOV A, [flags]
XOR A, #0x0008
MOV [flags], A
```

### 特定ビットのチェック

```assembly
; ビット3をチェック
MOV A, [flags]
AND A, #0x0008
BNZ bit3_is_set
```

## メモリアドレス計算

### 配列アクセスの最適化

```assembly
; 16バイト構造体の配列アクセス
; array[i] のアドレス = base + (i << 4)
MOV A, [index]
SHL A, 4            ; i * 16
ADD A, [base_addr]
; Aに目的のアドレスが入る

; 32バイト構造体の配列アクセス
MOV A, [index]
SHL A, 5            ; i * 32
ADD A, [base_addr]
```

### ページ境界アライメント

```assembly
; 256バイト境界にアライン
MOV A, [address]
AND A, #0xFF00      ; 下位8ビットをクリア

; 4KB境界にアライン
MOV A, [address]
AND A, #0xF000      ; 下位12ビットをクリア
```

## ループカウンタの最適化

### 16回ループの効率的な実装

```assembly
MOV C, #16
loop:
    ; ループ処理
    
    DEC C
    BNZ loop
    
; または、ビットマスクを使った方法
MOV C, #0
loop:
    ; ループ処理
    
    INC C
    MOV A, C
    AND A, #0x0F    ; 16回で0に戻る
    BNZ loop
```

### 2のべき乗回数のループ

```assembly
; 64回ループ（ビット6がセットされるまで）
MOV C, #0
loop:
    ; ループ処理
    
    INC C
    MOV A, C
    AND A, #0x40    ; ビット6をチェック
    BZ loop
```

## 実装例：エネルギー計算ルーチン

### HULLのコスト計算

```assembly
; HULL容量からコストを計算
; cost = capacity * 2 + ceil(capacity * 2 * 0.05)

calculate_hull_cost:
    ; A = capacity
    PUSH_A
    
    ; 構成エネルギー = capacity * 2
    SHL A, 1        ; A = capacity * 2
    PUSH_A          ; 構成エネルギーを保存
    
    ; 生産エネルギー = ceil(構成エネルギー * 0.05)
    ; 0.05 ≈ 1/20 ≈ (1/16 - 1/64)
    MOV B, A
    SHR B, 4        ; B = A/16
    MOV C, A
    SHR C, 6        ; C = A/64
    SUB B, C        ; B ≈ A * 0.05
    
    ; 切り上げ処理
    CMP B, #0
    BZ no_round_up
    INC B
    
no_round_up:
    POP_A           ; 構成エネルギーを復元
    ADD A, B        ; 総コスト
    
    POP_B           ; 元のcapacityを復元
    RET
```

### エネルギー残量チェック

```assembly
; 1024E単位で残量をチェック
check_energy_1024:
    ; A = 現在のエネルギー
    ; B = 必要なエネルギー（1024E単位）
    
    SHR A, 10       ; 1024E単位に変換
    CMP A, B
    BLT insufficient_energy
    
    ; 十分なエネルギーがある
    JMP sufficient_energy
    
insufficient_energy:
    ; エネルギー不足処理
    RET
    
sufficient_energy:
    ; 処理続行
    RET
```

## パフォーマンス考慮事項

### ビットシフト vs 乗除算

| 演算 | 乗除算命令 | ビットシフト | 速度比 |
|------|-----------|-------------|--------|
| ×2   | MUL A, #2 | SHL A, 1    | 5-10倍 |
| ×4   | MUL A, #4 | SHL A, 2    | 5-10倍 |
| ÷2   | DIV A, #2 | SHR A, 1    | 10-20倍|
| ÷4   | DIV A, #4 | SHR A, 2    | 10-20倍|

### メモリアクセスの削減

```assembly
; 非効率：複数回のメモリアクセス
MOV A, [value]
SHL A, 1
MOV [value], A
MOV A, [value]
ADD A, #10
MOV [value], A

; 効率的：レジスタで計算してから書き戻し
MOV A, [value]
SHL A, 1
ADD A, #10
MOV [value], A
```

## デバッグとテスト

### ビット演算のデバッグ用マクロ

```assembly
; 16進数表示用（上位バイトと下位バイトを分離）
debug_hex:
    PUSH_A
    PUSH_B
    
    MOV B, A
    SHR B, 8        ; 上位バイト
    AND A, #0xFF    ; 下位バイト
    
    ; ここでBとAをデバッグ出力
    
    POP_B
    POP_A
    RET
```

## まとめ

ビットシフト命令を活用することで：

1. **高速化**: 乗除算命令と比較して5-20倍の速度向上
2. **コードサイズ削減**: 複雑な計算を簡潔に表現
3. **エネルギー効率**: CPU使用量の削減による消費エネルギーの低減
4. **メモリ効率**: ビットフラグによる効率的な状態管理

これらのパターンを適切に使用することで、より効率的なSyntheticaエージェントの実装が可能になります。