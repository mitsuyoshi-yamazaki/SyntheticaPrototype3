# CLAUDE.md - v3.0.0 エージェントコード実装ガイド

このディレクトリには、Synthetica仕様バージョン3.0.0に基づくエージェントコードの実装を格納します。

## バージョン3.0.0の主要な特徴

### 1. 1024進法エネルギーシステム
- エネルギーは32bitで表現（上位16bit: 1024E単位、下位16bit: 1E単位）
- すべてのエネルギー値は整数（小数廃止）
- エネルギーコストは全体的に1/10に削減

### 2. 16bitアーキテクチャ
- プログラムカウンタ、レジスタ、メモリアドレスすべて16bit
- 最大メモリ容量: 65,536バイト（64KB）
- ユニット操作も16bit対応

### 3. 新命令
- レジスタベース・間接アドレッシング命令（0x50-0x53）
- UNIT_EXISTS命令（0x94）
- エネルギー計算専用命令（0x95-0x99）

## 実装時の注意事項

### エネルギー定数の使用
エネルギー値は`energy-constants.h`で定義された定数を使用してください：
```assembly
; 例: 1024E = 0x0400（ENERGY_1024E）
MOV R0, #0x0400
MOV R1, #0x0000
```

### メモリレイアウト
- プログラムコード: 0x0000から配置
- スタック: 0xFFFFから下方向に成長
- ヒープ: プログラムコードの終端から上方向に成長

### ユニットメモリマップ
各ユニット種別の標準的なメモリマップ位置：
- HULL: 0x00-0x0F
- ASSEMBLER: 0x10-0x1F
- DISASSEMBLER: 0x20-0x2F
- CONNECTOR: 0x30-0x3F
- COMPUTER: 0x40-0x4F
- SENSOR: 0x50-0x5F
- MOVER: 0x60-0x6F

### エネルギー計算
32bitエネルギー計算には専用命令を使用：
```assembly
; R0:R1に1024Eを加算
ADD_E32 R0, R1, #0x0400, #0x0000
```

## 推奨される実装パターン

### 1. エネルギーチェック
```assembly
; 現在のエネルギーが必要量以上か確認
CMP_E32 R0, R1, R2, R3
BGE sufficient_energy
; エネルギー不足の処理
```

### 2. ユニット存在確認
```assembly
; ユニットが存在するか確認してから操作
UNIT_EXISTS R4, R5
JZ unit_not_found
; ユニット操作
```

### 3. エラーハンドリング
操作失敗時は適切にエラーを処理し、無限ループを避ける

## 関連ドキュメント

- `/docs/spec-v3/synthetica-script.md` - 命令セット仕様
- `/docs/spec-v3/energy-consumption.md` - エネルギー消費詳細
- `/docs/spec-v3/energy-constants.h` - エネルギー定数定義
- `/docs/spec-v3/game-world-requirement.md` - ゲーム世界仕様

## コンパイル例

C言語からのコンパイル例は`../v3.0.0以前/example.c`および`../v3.0.0以前/example_compiled_16bit.md`を参照してください。