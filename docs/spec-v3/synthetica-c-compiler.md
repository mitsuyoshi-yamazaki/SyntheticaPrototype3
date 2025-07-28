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

## 参考資料

- `synthetica-script.md`: アセンブリ命令セット
- `energy-consumption.md`: エネルギー仕様
- `energy-scale-change-tasks.md`: エネルギースケール変更計画