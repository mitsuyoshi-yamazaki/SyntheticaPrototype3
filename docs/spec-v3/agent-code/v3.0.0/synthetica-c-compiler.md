# Synthetica Script Cコンパイラ仕様

## このファイルについて

Synthetica ScriptのCコンパイラに関する要件、仕様、決定事項、TODO、課題等を管理するファイルです。

## コンパイラ概要

- C言語（サブセット）からSynthetica Scriptへのコンパイラ
- 16bitアーキテクチャ対応
- エネルギー計算などの特殊処理をサポート

## エネルギー計算のコンパイル仕様

### 基本方針

- **C言語レベル**: 32bit整数として統合的に扱う（uint32_t）
- **アセンブリレベル**: 必要に応じて上位/下位16bitに分離
- **最適化**: コンパイラが自動的に最適な実装を選択
- **エネルギー単位**: 1Eが最小単位（小数なし）

### エネルギー型の定義

```c
// C言語での定義
typedef uint32_t energy_t;  // 1024進法エネルギー値

// エネルギー定数の定義例
#define ENERGY_1K    1024U        // 1024E
#define ENERGY_10K   10240U       // 10×1024E
#define ENERGY_100K  102400U      // 100×1024E

// エネルギー操作マクロ
#define ENERGY_HIGH(e) ((e) >> 10)      // 上位16bit取得
#define ENERGY_LOW(e)  ((e) & 0x3FF)    // 下位10bit取得
#define MAKE_ENERGY(high, low) (((high) << 10) | ((low) & 0x3FF))
```

### コンパイル例

#### 例1: 単純な加算（C言語）

```c
energy_t total = energy1 + energy2;
```

**コンパイラが生成するアセンブリ（最適化なし）**:

```assembly
; energy1が[A,B]、energy2が[C,D]に格納されている場合
ADD_AB      ; 下位を加算: B = B + D
JNC skip    ; キャリーなければスキップ
INC_A       ; キャリーありなら上位をインクリメント
skip:
ADD_AC      ; 上位を加算: A = A + C
```

**コンパイラが生成するアセンブリ（最適化あり）**:

```assembly
; 専用命令を使用
ADD_E32     ; エネルギー32bit加算（自動的にキャリー処理）
```

#### 例2: 概算計算（上位のみ）

```c
// プログラマが明示的に上位のみで計算
if (ENERGY_HIGH(current_energy) > ENERGY_HIGH(required_energy)) {
    // 十分なエネルギーがある（概算）
}
```

**生成されるアセンブリ**:

```assembly
; current_energyの上位のみロード
SHR_E10     ; 1024で除算（上位16bit取得）
MOVE_AB     ; Bに保存
; required_energyの上位のみロード
SHR_E10
CMP_AB      ; 上位16bitのみで比較
JG enough_energy
```

#### 例3: 精密な計算が必要な場合

```c
// エネルギー不足を正確に判定
energy_t deficit = required_energy - current_energy;
if (deficit > 0) {
    // エネルギー不足
}
```

**生成されるアセンブリ**:

```assembly
SUB_E32     ; 32bitエネルギー減算（ボロー処理込み）
CMP_E32     ; 32bit比較
JG energy_shortage
```

#### 例4: エネルギー計算命令の詳細な使用例

```c
// エネルギー加算
energy_t total = energy1 + energy2;
```

**アセンブリ（A,Bにenergy1、C,Dにenergy2が格納済み）**:

```assembly
ADD_E32     ; A,B = A,B + C,D（1024進法キャリー処理自動）
```

```c
// エネルギー比較と分岐
if (current_energy >= required_energy) {
    // 十分なエネルギーがある
}
```

**アセンブリ**:

```assembly
; current_energyがA,B、required_energyがC,Dに格納済み
CMP_E32     ; 32bit比較（フラグ更新）
JGE has_enough_energy
```

```c
// 概算計算（kE単位での計算）
uint16_t rough_estimate = ENERGY_HIGH(total_energy);
```

**アセンブリ**:

```assembly
; total_energyがA,Bに格納済み
SHR_E10     ; A = 上位16bit（1024E単位の値）
```

### コンパイラ最適化のヒント

```c
// volatile指定で最適化を抑制
volatile energy_t precise_energy;

// register指定で高速アクセスを示唆
register energy_t working_energy;

// 明示的な分離アクセス
uint16_t high = ENERGY_HIGH(total);
uint16_t low = ENERGY_LOW(total);
```

## 決定事項

1. **エネルギー型は32bit整数型として扱う**
2. **1024進法（2^10）を採用**
3. **C言語レベルでは統合的に扱い、必要に応じてアセンブリで分離**
4. **専用のエネルギー演算命令（ADD_E32等）を活用**
5. **エネルギー計算命令を0x95-0x99に実装済み**
   - ADD_E32: 32bitエネルギー加算
   - SUB_E32: 32bitエネルギー減算
   - CMP_E32: 32bitエネルギー比較
   - SHR_E10: 1024で除算（上位取得）
   - SHL_E10: 1024倍（左シフト）

## TODO項目

### 高優先度

- [ ] energy_t型の正式な定義
- [ ] 標準ライブラリ関数の定義（エネルギー操作用）
- [ ] エネルギー定数の標準ヘッダファイル作成

### 中優先度

- [ ] コンパイラ最適化パスの設計
- [ ] インライン展開の基準策定
- [ ] デバッグ情報の出力形式

### 低優先度

- [ ] プロファイリング機能の追加
- [ ] エネルギー消費見積もり機能

## 課題

### 1. オーバーフロー処理

- 加算時の上限チェック（67,108,863E）
- 警告/エラーの出力方法

### 2. 型安全性

- energy_tと通常のuint32_tの区別
- 暗黙の型変換の扱い

### 3. 定数折りたたみ

- コンパイル時計算の範囲
- 1024進法での定数評価

### 4. メモリモデル

- エネルギー値の格納方法（リトルエンディアン/ビッグエンディアン）
- レジスタ割り当て戦略

## 将来の拡張

### 浮動小数点サポート

- 現在は整数のみ
- 将来的に固定小数点や浮動小数点のサポートを検討

### SIMD命令

- 複数エネルギー値の並列計算
- ベクトル化の可能性

### 動的最適化

- 実行時プロファイルに基づく最適化
- JITコンパイルの検討

## テンプレート記法（**attribute**を使用）

### 概要

Synthetica Scriptのテンプレートマッチング機能をC言語から利用するため、GCC/Clangの`__attribute__`拡張を使用する。これにより、Cの標準的な記法を保ちながら、位置独立コードの生成が可能となる。

### 基本的な使用方法

#### 1. ラベルへのテンプレート付与

```c
// ラベルにテンプレートを定義
__attribute__((template(0xC5)))
loop_start:
    // ここにテンプレート 11000101 が配置される
    // ループ本体のコード
```

**コンパイラが生成するアセンブリ**:

```assembly
loop_start:
    NOP1    ; 1
    NOP1    ; 1
    NOP0    ; 0
    NOP0    ; 0
    NOP0    ; 0
    NOP1    ; 1
    NOP0    ; 0
    NOP1    ; 1
    ; ループ本体のコード
```

#### 2. テンプレートを使用したgoto

```c
// テンプレートマッチングによるジャンプ
__attribute__((template_goto(0xC5)))
goto loop_start;  // 補完パターン 0x3A を探してジャンプ
```

**コンパイラが生成するアセンブリ**:

```assembly
    SEARCH_B        ; 後方検索
    NOP0 NOP0 NOP1 NOP1 NOP1 NOP0 NOP1 NOP0  ; 補完パターン 00111010
    JMP_IND         ; Bレジスタ（検索結果）へジャンプ
    0x01            ; レジスタB指定
```

#### 3. 関数の定義と呼び出し

```c
// テンプレートを使用した関数定義
__attribute__((template_entry(0x5A), template_return(0x5A)))
void process_data(void) {
    // 関数本体
    // returnは自動的にテンプレート経由で戻る
}

// 関数呼び出し
__attribute__((template_call(0x5A)))
process_data();  // テンプレート経由で呼び出し
```

**コンパイラが生成するアセンブリ（関数定義）**:

```assembly
process_data:
    NOP0 NOP1 NOP0 NOP1 NOP1 NOP0 NOP1 NOP0  ; 0x5A = 01011010
    ; 関数本体
    ; return時は補完パターン 0xA5 を探して戻る
```

#### 4. ループ構造での使用

```c
// whileループでのテンプレート使用
__attribute__((template_loop(0xA5)))
while (condition) {
    // ループ本体
    if (need_continue) {
        __attribute__((template_continue(0xA5)))
        continue;  // テンプレート経由でループ先頭へ
    }
}
```

#### 5. 条件分岐での使用

```c
// if-else文でのテンプレート使用
if (condition) {
    __attribute__((template_branch(0x33)))
    {
        // then節
    }
} else {
    __attribute__((template_branch(0xCC)))
    {
        // else節
    }
}
```

### 実装詳細

#### ヘッダーファイル（synthetica_template.h）

```c
#ifndef SYNTHETICA_TEMPLATE_H
#define SYNTHETICA_TEMPLATE_H

// 属性の存在確認
#ifdef __has_attribute
  #if __has_attribute(template)
    #define HAS_SYNTHETICA_TEMPLATE 1
  #endif
#endif

#ifndef HAS_SYNTHETICA_TEMPLATE
  // 非対応コンパイラでの互換性確保
  #warning "Synthetica template attributes not supported"
  #define __attribute__(x)  /* 無視 */
#endif

// 便利なマクロ定義
#define TEMPLATE(value) __attribute__((template(value)))
#define TEMPLATE_GOTO(value) __attribute__((template_goto(value)))
#define TEMPLATE_CALL(value) __attribute__((template_call(value)))
#define TEMPLATE_FUNC(entry, ret) __attribute__((template_entry(entry), template_return(ret)))

#endif /* SYNTHETICA_TEMPLATE_H */
```

#### 使用例：自己複製プログラムの一部

```c
#include "synthetica_template.h"

// プログラム開始位置
TEMPLATE(0x1010)
void self_replicate(void) {
    // 娘COMPUTER生成完了待機ループ
    TEMPLATE(0x0101)
    wait_loop: {
        if (is_assembling(0)) {
            TEMPLATE_GOTO(0x0101)
            goto wait_loop;
        }
    }

    // メモリコピー処理
    TEMPLATE(0x1100)
    copy_start: {
        unsigned int src = 0;
        unsigned int dst = 0;

        TEMPLATE(0x0110)
        copy_loop: {
            write_computer_memory(1, dst, read_my_memory(src));
            src++;
            dst++;
            if (src < PROGRAM_SIZE) {
                TEMPLATE_GOTO(0x0110)
                goto copy_loop;
            }
        }
    }
}
```

### コンパイラ実装のガイドライン

1. **パース段階**：`__attribute__((template(...)))`を認識し、ASTノードに付加情報として保存

2. **中間表現生成**：テンプレート情報を中間表現に保持

3. **コード生成**：
   - `template(value)`: ラベル位置にNOP0/NOP1パターンを挿入
   - `template_goto(value)`: SEARCH_F/B + 補完パターン + JMP_INDに変換
   - `template_call(value)`: リターンアドレス保存 + SEARCH_F + CALL_INDに変換
   - `template_return(value)`: SEARCH_B + 補完パターン + JMP_INDに変換

4. **最適化**：
   - 近距離のテンプレートは検索範囲を制限
   - 頻繁に使用されるテンプレートは近くに配置

### 制限事項と注意点

1. **テンプレート値の重複**：同じテンプレート値を複数箇所で使用すると、最も近いものが選択される

2. **検索失敗時の動作**：テンプレートが見つからない場合、Bレジスタに0xFFFFが設定される

3. **パフォーマンス**：テンプレート検索は線形探索のため、大きなプログラムでは遅くなる可能性がある

4. **デバッグ**：テンプレートマッチングのデバッグのため、`-g`オプション使用時はテンプレート情報を保持

## 参考資料

- `synthetica-script.md`: アセンブリ命令セット
- `energy-consumption.md`: エネルギー仕様
- `energy-scale-change-tasks.md`: エネルギースケール変更計画
- `synthetica-c-template-syntax.md`: テンプレート記法の詳細提案
