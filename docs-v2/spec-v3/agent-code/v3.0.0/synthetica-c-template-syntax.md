# Synthetica C テンプレート記法の提案

## 概要

C言語からSynthetica Scriptへのコンパイル時に、テンプレートマッチングを使用したループ、分岐、関数呼び出しを記述するための拡張記法を定義する。

## 基本原則

1. C言語の標準的な構文を可能な限り維持
2. テンプレート値を明示的に指定可能
3. 補完パターンは自動的に計算される

## 提案する記法

### 1. テンプレートラベル定義

```c
// 現在の記法（gotoラベルとして）
template_c5:  // 11000101 というテンプレート

// 提案記法1: プラグマによる明示的定義
#pragma template_label LOOP_START 0xC5  // 11000101
LOOP_START:
    // ループ本体

// 提案記法2: 属性記法（C23/C++11風）
[[template(0xC5)]] LOOP_START:
    // ループ本体

// 提案記法3: 特殊コメント記法
/*@template:0xC5*/ LOOP_START:
    // ループ本体
```

### 2. テンプレートgoto

```c
// 現在の記法（テンプレート値が暗黙的）
goto template_c5;

// 提案記法1: 組み込み関数風
__goto_template(0xC5);  // 補完パターン0x3Aを探してジャンプ

// 提案記法2: 拡張goto文
goto @template(0xC5);   // 補完パターンを探してジャンプ

// 提案記法3: マクロ展開
GOTO_TEMPLATE(0xC5);    // マクロで実装
```

### 3. テンプレートを使用したループ

```c
// 提案記法1: do-whileループの拡張
#pragma template_label LOOP_TOP 0xA5
do {
    LOOP_TOP:
    // ループ本体
    count++;
} while (__continue_template(0xA5));  // 条件が真なら補完パターンを探してジャンプ

// 提案記法2: forループの拡張
for (int i = 0; i < 10; i++) [[template_continue(0xA5)]] {
    // ループ本体
    // continueはテンプレート0xA5の補完を探す
}

// 提案記法3: whileループの拡張
#pragma template_loop 0xA5
while (condition) {
    // ループ本体
    // ループの先頭にテンプレート0xA5が配置される
}
```

### 4. テンプレートを使用した分岐

```c
// 提案記法1: if文の拡張
if (condition) [[template_then(0x33)]] {
    // then節
} else [[template_else(0xCC)]] {
    // else節
}

// 提案記法2: switch文の拡張
switch (value) {
    [[template(0x11)]] case 1:
        // 処理1
        break;
    [[template(0x22)]] case 2:
        // 処理2
        break;
    [[template(0x44)]] default:
        // デフォルト処理
        break;
}
```

### 5. テンプレートを使用した関数呼び出し

```c
// 提案記法1: 関数定義の拡張
[[template_entry(0x5A)]]
void my_function() {
    // 関数本体
    [[template_return(0x5A)]]  // 呼び出し元へ戻る
}

// 呼び出し側
__call_template(0x5A);  // 補完パターンを探して呼び出し

// 提案記法2: 関数ポインタ風
typedef void (*template_func_t)(void) [[template]];
template_func_t func = __get_template_func(0x5A);
func();  // テンプレート経由で呼び出し

// 提案記法3: マクロによる実装
TEMPLATE_CALL(my_function, 0x5A);
```

### 6. 動的テンプレート値の使用

```c
// 提案記法1: 変数からテンプレート値を生成
unsigned int template_value = calculate_template();
__goto_template_var(template_value);  // 変数の値をテンプレートとして使用

// 提案記法2: テンプレート検索関数
unsigned int addr = __search_template_forward(template_value);
if (addr != 0xFFFF) {
    __jump_indirect(addr);
}
```

## 実装における考慮事項

### 1. コンパイラディレクティブ

```c
// テンプレートマッチングの最大検索距離を指定
#pragma template_search_distance 1000

// テンプレートの自動割り当てを有効化
#pragma template_auto_assign

// デバッグ用：テンプレート配置情報を出力
#pragma template_debug on
```

### 2. エラーハンドリング

```c
// テンプレートが見つからない場合の処理
if (!__goto_template_safe(0xC5)) {
    // エラー処理
    error_handler();
}
```

### 3. 最適化ヒント

```c
// 頻繁に使用するテンプレートを近くに配置するヒント
#pragma template_hot 0xC5

// まれにしか使用しないテンプレートを遠くに配置するヒント
#pragma template_cold 0x3A
```

## **attribute**を使用した実装

GCC/Clangの`__attribute__`拡張を使用することで、より標準的な方法でテンプレート機能を実装できる。

### **attribute**による実装例

```c
// 1. ラベル定義
__attribute__((template(0xC5)))
void loop_start_label(void) {
    // この関数の先頭にテンプレート0xC5が配置される
}

// より簡潔な記法（ラベルのみの場合）
loop_start: __attribute__((template(0xC5)));

// 2. 関数定義
__attribute__((template_entry(0x5A), template_return(0x5A)))
void my_function(void) {
    // 関数エントリにテンプレート0x5A
    // return時に補完パターン0xA5を探して戻る
}

// 3. goto文の拡張
__attribute__((template_goto(0xC5)))
goto loop_start;  // 補完パターンを探してジャンプ

// 4. ループの拡張
__attribute__((template_loop(0xA5)))
while (condition) {
    // ループ先頭にテンプレート0xA5が配置
    // continueは補完パターンを探す
}

// 5. 分岐の拡張
if (condition) {
    __attribute__((template_branch(0x33)));
    // then節
} else {
    __attribute__((template_branch(0xCC)));
    // else節
}
```

### **attribute**の利点

1. **既存のコンパイラ拡張機能との親和性**
   - GCC/Clangは既に`__attribute__`の解析機能を持つ
   - カスタム属性の追加が容易

2. **構文的な明確性**
   - 属性がどの要素に適用されるか明確
   - IDEの構文ハイライトが効きやすい

3. **後方互換性**
   - 未対応のコンパイラでは警告を出すだけで無視される
   - `__has_attribute`マクロで検出可能

### 実装の詳細

```c
// synthetica_attributes.h

// 属性の存在確認
#ifdef __has_attribute
  #if __has_attribute(template)
    #define HAS_TEMPLATE_ATTR 1
  #endif
#endif

#ifndef HAS_TEMPLATE_ATTR
  // 互換性のためのマクロ定義
  #define __attribute__(x)  /* 無視 */
#endif

// 便利なマクロ
#define TEMPLATE_LABEL(value) \
    __attribute__((template(value)))

#define TEMPLATE_FUNC(entry, exit) \
    __attribute__((template_entry(entry), template_return(exit)))

#define TEMPLATE_GOTO(label, value) \
    do { \
        __attribute__((template_goto(value))) \
        goto label; \
    } while(0)
```

### コンパイラ実装のヒント

```c
// コンパイラは以下のように変換
// 元のコード:
loop_start: __attribute__((template(0xC5)));

// 変換後:
loop_start:
    NOP1  // 1
    NOP1  // 1
    NOP0  // 0
    NOP0  // 0
    NOP0  // 0
    NOP1  // 1
    NOP0  // 0
    NOP1  // 1
```

## 推奨される実装方式（改訂版）

`__attribute__`を使用した実装が最も現実的：

1. **ラベル定義**: `__attribute__((template(0xXX)))`
2. **ジャンプ**: `__attribute__((template_goto(0xXX))) goto label;`
3. **ループ**: `__attribute__((template_loop(0xXX))) while (...)`
4. **関数呼び出し**: `__attribute__((template_entry(0xXX), template_return(0xXX)))`

この方式の利点：

- 既存のCコンパイラインフラを活用可能
- 構文的に明確で、エラー検出が容易
- IDEサポートが得られやすい
- 段階的な実装が可能

## マクロ実装例

```c
// ヘッダーファイル: synthetica_template.h

// テンプレートラベル定義
#define TEMPLATE_LABEL(name, value) \
    name: __asm__("NOP0 NOP1 ...") // valueに応じたNOPパターンを生成

// テンプレートgoto
#define GOTO_TEMPLATE(value) do { \
    unsigned int __addr = search_template(~(value)); \
    if (__addr != 0xFFFF) __jump_indirect(__addr); \
} while(0)

// テンプレート関数呼び出し
#define TEMPLATE_CALL(func_name, value) do { \
    __push_return_address(); \
    GOTO_TEMPLATE(value); \
} while(0)

// テンプレートループ
#define TEMPLATE_LOOP_START(value) \
    TEMPLATE_LABEL(__loop_##value, value)

#define TEMPLATE_LOOP_CONTINUE(value) \
    GOTO_TEMPLATE(value)
```

このような記法により、C言語の可読性を保ちながら、Synthetica Scriptのテンプレート機能を活用できる。
