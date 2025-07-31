// stack-protection-example.c
// スタック保護実装例（Synthetica v3.1.0）

#include "synthetica_api.h"

// スタック関連の定数定義
#define STACK_TOP       0xFFFF
#define STACK_BOTTOM    0xE000
#define STACK_CANARY    0xDEAD
#define MAX_RECURSION   10

// グローバル変数（メモリレイアウトの管理）
uint16_t g_stack_pointer = STACK_TOP;
uint16_t g_recursion_depth = 0;

// スタック境界チェック付きプッシュ
int safe_push(uint16_t value) {
    // スタックオーバーフローチェック
    if (g_stack_pointer <= STACK_BOTTOM + 2) {
        // エラー: スタックオーバーフロー
        return -1;
    }
    
    // 値をプッシュ
    g_stack_pointer -= 2;
    *((uint16_t*)g_stack_pointer) = value;
    return 0;
}

// スタック境界チェック付きポップ
int safe_pop(uint16_t* value) {
    // スタックアンダーフローチェック
    if (g_stack_pointer >= STACK_TOP) {
        // エラー: スタックアンダーフロー
        return -1;
    }
    
    // 値をポップ
    *value = *((uint16_t*)g_stack_pointer);
    g_stack_pointer += 2;
    return 0;
}

// カナリア値を使用した関数
int protected_function(uint16_t param1, uint16_t param2) {
    // カナリア値をスタックに配置
    safe_push(STACK_CANARY);
    
    // ローカル変数の確保
    uint16_t local1 = param1 + param2;
    uint16_t local2 = param1 * 2;
    
    safe_push(local1);
    safe_push(local2);
    
    // 関数の処理
    // ...
    
    // ローカル変数の解放
    safe_pop(&local2);
    safe_pop(&local1);
    
    // カナリア値の検証
    uint16_t canary;
    safe_pop(&canary);
    if (canary != STACK_CANARY) {
        // スタック破壊を検出
        return -1;
    }
    
    return 0;
}

// 再帰深度制限付き再帰関数
int limited_recursive_function(uint16_t n) {
    // 再帰深度チェック
    if (g_recursion_depth >= MAX_RECURSION) {
        // エラー: 再帰深度超過
        return -1;
    }
    
    g_recursion_depth++;
    
    // ベースケース
    if (n <= 1) {
        g_recursion_depth--;
        return 1;
    }
    
    // 再帰呼び出し
    int result = n * limited_recursive_function(n - 1);
    
    g_recursion_depth--;
    return result;
}

// メモリ領域の検証
int validate_memory_access(uint16_t address, uint16_t size) {
    // プログラム領域への書き込み防止
    if (address < 0x4000) {
        return -1;  // エラー: 読み取り専用領域
    }
    
    // スタック領域への不正アクセス防止
    if (address >= STACK_BOTTOM && address <= STACK_TOP) {
        // スタック領域へのアクセスは特別な処理が必要
        if (address < g_stack_pointer) {
            return -1;  // エラー: 未使用スタック領域へのアクセス
        }
    }
    
    // アドレス範囲のオーバーフローチェック
    if ((uint32_t)address + size > 0x10000) {
        return -1;  // エラー: メモリ範囲外
    }
    
    return 0;
}

// 安全なメモリコピー
int safe_memcpy(uint16_t dest, uint16_t src, uint16_t size) {
    // 送信元と送信先の検証
    if (validate_memory_access(src, size) < 0) {
        return -1;
    }
    if (validate_memory_access(dest, size) < 0) {
        return -1;
    }
    
    // オーバーラップチェック
    if ((src < dest && src + size > dest) ||
        (dest < src && dest + size > src)) {
        return -1;  // エラー: メモリ領域のオーバーラップ
    }
    
    // コピー実行
    for (uint16_t i = 0; i < size; i++) {
        *((uint8_t*)(dest + i)) = *((uint8_t*)(src + i));
    }
    
    return 0;
}

// メインプログラム
void main() {
    // スタックポインタの初期化
    __asm__("MOV_SP #0xFFFF");
    
    // メモリレイアウトの初期化
    // 0x0000-0x3FFF: プログラム（読み取り専用）
    // 0x4000-0xDFFF: データ・ヒープ
    // 0xE000-0xFFFF: スタック
    
    // 保護された関数の呼び出し例
    if (protected_function(10, 20) < 0) {
        // エラー処理
        halt();
    }
    
    // 再帰関数の呼び出し例
    int factorial = limited_recursive_function(5);
    if (factorial < 0) {
        // エラー処理
        halt();
    }
    
    // 安全なメモリ操作の例
    uint16_t src_addr = 0x4000;
    uint16_t dst_addr = 0x5000;
    if (safe_memcpy(dst_addr, src_addr, 100) < 0) {
        // エラー処理
        halt();
    }
}

/*
実装上の注意事項:

1. このコードはC言語で記述されていますが、実際にはSynthetica Scriptに
   コンパイルして実行する必要があります。

2. スタック操作は実際にはPUSH/POP命令を使用しますが、この例では
   概念を示すために簡略化しています。

3. メモリアクセスの検証は、すべてのポインタ操作の前に行う必要があります。

4. エラー処理は適切に実装し、システムの安定性を保つ必要があります。

5. 実際の実装では、これらの保護機能をライブラリとして提供し、
   すべてのプログラムで利用できるようにすることが推奨されます。
*/