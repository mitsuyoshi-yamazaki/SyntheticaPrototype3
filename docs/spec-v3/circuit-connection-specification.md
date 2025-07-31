# 回路接続仕様

## 概要

このドキュメントは、Synthetica v3における回路接続の具体的な仕様を定義します。v3では、ユニットを固定できるのはHULLのみであるため、回路接続はHULLを中心とした仕様となります。

## 基本原則

1. **回路接続の定義**: HULLに固定されたユニット間で、操作メモリの読み書きが可能な状態
2. **アクセス制御**: v3ではaccessibility機能を削除し、同一HULLに接続された全ユニットが相互アクセス可能
3. **接続数制限**: 1つのHULLへの接続可能ユニット数に上限なし

## 回路接続の仕組み

### 接続状態

ユニットは以下のいずれかの状態を持ちます：

| 状態 | 説明 | 回路接続 |
|------|------|----------|
| HULL固定状態 | HULLの外側または内側に物理的に固定 | 可能 |
| HULL格納状態 | HULLの内部空間に格納（固定ではない） | 不可 |
| 自由状態 | 座標を持ってゲーム世界を漂う | 不可 |

### 回路接続の成立条件

```
回路接続が成立する条件:
1. ユニットがHULLに固定されている（HULL固定状態）
2. 対象ユニットも同じHULLに固定されている

回路接続により可能な操作:
- 対象ユニットの操作メモリ読み取り（UNIT_MEM_READ命令）
- 対象ユニットの操作メモリ書き込み（UNIT_MEM_WRITE命令）
```

## アクセス可能性（Accessibility）の廃止

### v3での変更点

- **廃止理由**: 
  - HULLへ能動的にユニットを追加できるのは、既に接続済みのASSEMBLERのみ
  - 他者のHULLへのアクセス手段が存在しない
  - 現状では機能しない仕様となっている

- **新仕様**:
  - 同一HULLに接続された全ユニットは相互にフルアクセス可能
  - アクセス制御は存在しない（全て許可）

### 影響範囲

```
// 旧仕様（廃止）
if (accessibility.allows(source, target)) {
    // アクセス許可
}

// 新仕様（v3）
if (sameHull(source, target)) {
    // 常にアクセス許可
}
```

## ユニット識別とアドレッシング

### ユニット種別コード

| ユニット種別 | コード | 説明 |
|-------------|--------|------|
| HULL | 0x00 | 基本構造体 |
| ASSEMBLER | 0x40 | 生産ユニット |
| COMPUTER | 0xC0 | 演算ユニット |

### ユニットインデックス

- 各ユニット種別ごとに0から始まるインデックスを持つ
- 同一HULL内でのみ有効
- ユニット削除時もインデックスは保持（歯抜け状態を許容）

### ユニット指定方法

```
ユニット指定 = (ユニット種別コード | インデックス)

例:
- HULL[0] = 0x00
- HULL[3] = 0x03
- ASSEMBLER[0] = 0x40
- ASSEMBLER[2] = 0x42
- COMPUTER[0] = 0xC0
- COMPUTER[1] = 0xC1
```

## 回路接続の実装詳細

### 接続管理

```
struct Hull {
    uint32 id;
    Vec2 position;
    uint16 capacity;
    
    // 固定ユニットリスト（回路接続可能）
    Unit[] attachedUnits;
    
    // 格納オブジェクト（回路接続不可）
    GameObject[] containedObjects;
}

struct Unit {
    uint8 typeCode;      // ユニット種別コード
    uint8 index;         // 種別内インデックス
    Hull* parentHull;    // 固定先HULL
    bool isAttached;     // 固定状態フラグ
}
```

### アクセス判定

```
function canAccess(sourceUnit, targetUnit) {
    // 両方が固定状態か確認
    if (!sourceUnit.isAttached || !targetUnit.isAttached) {
        return false;
    }
    
    // 同一HULLに固定されているか確認
    return sourceUnit.parentHull == targetUnit.parentHull;
}
```

## 操作メモリアクセス

### 読み取り操作

```assembly
; ASSEMBLER[0]の assemble_power を読み取る
MOV A, #0x40        ; ASSEMBLER[0]
MOV B, #0x00        ; assemble_power のアドレス
UNIT_MEM_READ B, A, 0x00
; 結果はBレジスタに格納される
```

### 書き込み操作

```assembly
; ASSEMBLER[0]の生産ユニット種別をHULLに設定
MOV A, #0x40        ; ASSEMBLER[0]
MOV B, #0x01        ; 生産ユニット種別のアドレス
MOV C, #0x00        ; HULL種別
UNIT_MEM_WRITE B, A, 0x00, C
```

## 接続数制限

### v3での仕様

- **上限なし**: 1つのHULLに接続可能なユニット数に制限を設けない
- **実装上の考慮**:
  - メモリ使用量は接続ユニット数に比例
  - 大量接続時のパフォーマンスは実装依存

### 将来の拡張性

```
// v4での検討事項
const MAX_ATTACHED_UNITS = 256;  // 接続数上限（例）
const CONNECTION_COST = 10;      // 接続コスト（エネルギー）
```

## 特殊ケース

### 自己参照

COMPUTERが自身にアクセスする場合：

```assembly
; COMPUTER自身の操作メモリにアクセス
; COMPUTER[0]は常に自身を指す
MOV A, #0xC0        ; 自身（COMPUTER[0]）
MOV B, #0x02        ; メモリ書き換え許可状態
UNIT_MEM_READ B, A, 0x00
```

### HULL分離時の処理

```
HULLが分離される際の回路接続の扱い:
1. 分離されるHULL上の固定ユニットは新HULLの回路に移行
2. 元のHULLに残るユニットとの回路接続は切断
3. 切断後、各グループ内で新たな回路が形成される
```

## デバッグとトラブルシューティング

### 接続状態の確認

開発時のデバッグ用情報：

```
Hull[ID: 123]
├─ Attached Units (回路接続可能):
│  ├─ ASSEMBLER[0]
│  ├─ ASSEMBLER[1]
│  └─ COMPUTER[0]
└─ Contained Objects (回路接続不可):
   ├─ Energy(50E)
   └─ HULL[5] (格納状態)
```

### よくあるエラー

1. **アクセス失敗**: 対象ユニットが固定状態でない
2. **インデックスエラー**: 存在しないユニットインデックスを指定
3. **種別エラー**: 間違ったユニット種別コードを使用

## 実装チェックリスト

- [ ] HULL構造体への固定ユニットリスト実装
- [ ] ユニット識別子（種別コード + インデックス）の実装
- [ ] canAccess関数の実装
- [ ] UNIT_MEM_READ/WRITE命令の回路接続チェック
- [ ] HULL分離時の回路再構成処理
- [ ] デバッグ用の接続状態表示機能

## 関連ドキュメント

- `game-world-requirement.md`: HULLとユニットの基本仕様
- `synthetica-script.md`: UNIT_MEM_READ/WRITE命令の詳細
- `energy-action-order.md`: アクション実行順序（回路アクセスの順序）