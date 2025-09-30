// constructor-based-replication.c
// プログラム的に娘個体を定義する自己複製エージェント
// Constructor-based replication: 娘個体のスペックをコード内に直接記述

/*
 * エージェント構成仕様:
 * 
 * [親エージェント]
 * - HULL[0]: 容量200以上（成長後）
 *   - ASSEMBLER[0]: assemble_power 10以上
 *   - COMPUTER[0]: 動作周波数 1命令/tick、メモリ 512バイト（本プログラムを実行）
 * 
 * [娘エージェント] ※プログラム内で定義
 * - HULL: 容量100
 *   - ASSEMBLER: assemble_power 10
 *   - COMPUTER: 動作周波数 1命令/tick、メモリ 256バイト
 * 
 * 接続構成:
 * - 親HULL[0]に親ASSEMBLER[0]と親COMPUTER[0]が接続
 * - 親ASSEMBLER[0]が娘ユニットを生産
 * - 娘HULLに娘ASSEMBLERと娘COMPUTERを接続して生産
 * - 最後に娘エージェントを親HULLから分離
 * 
 * 実行COMPUTER: 親COMPUTER[0]で本プログラムを実行
 */

#include "synthetica_api.h"

// 成長パラメータ
#define REPRODUCTION_HULL_CAPACITY  200  // 自己複製開始容量
#define EXPAND_HULL_CAPACITY        20   // 1回の拡張容量

// 娘エージェントの仕様（プログラムに直接記述）
#define CHILD_HULL_CAPACITY         100
#define CHILD_ASSEMBLER_POWER       10
#define CHILD_COMPUTER_FREQUENCY    1    // 1命令/tick
#define CHILD_COMPUTER_MEMORY       256

// 待機ループ用のテンプレート
// template_AA: 10101010
// template_55: 01010101

void main() {
    // ユニットインデックスは固定
    // HULL[0], ASSEMBLER[0]が接続されていることを前提

    // ========== 成長フェーズ ==========
    while (1) {
        // 現在の容量チェック
        if (hull_get_capacity(0) >= REPRODUCTION_HULL_CAPACITY) {
            break;
        }

        // HULLの拡張
        assembler_produce_hull(0, UNIT_INDEX_NONE, EXPAND_HULL_CAPACITY);
        
        // 生産完了待機
        __attribute__((template(0xAA)))
        wait_expansion:
        while (assembler_is_producing(0)) {
            // エネルギー効率を考慮した待機
        }

        // 生産結果確認
        if (assembler_get_last_produced_type(0) == UNIT_TYPE_HULL) {
            uint8_t new_hull_index = assembler_get_last_produced_index(0);
            hull_merge(new_hull_index, 0);  // 自身に統合
        }
    }

    // ========== 自己複製フェーズ ==========
    while (1) {
        uint8_t child_hull_index = UNIT_INDEX_NONE;
        uint8_t child_assembler_index = UNIT_INDEX_NONE;
        uint8_t child_computer_index = UNIT_INDEX_NONE;

        // ----- 娘HULL生産 -----
        assembler_produce_hull(0, UNIT_INDEX_NONE, CHILD_HULL_CAPACITY);
        
        __attribute__((template(0x55)))
        wait_hull:
        while (assembler_is_producing(0)) {
            // 待機
        }

        if (assembler_get_last_produced_type(0) != UNIT_TYPE_HULL) {
            // 生産失敗時は次のサイクルへ
            continue;
        }
        child_hull_index = assembler_get_last_produced_index(0);

        // ----- 娘ASSEMBLER生産 -----
        assembler_produce_assembler(0, child_hull_index, CHILD_ASSEMBLER_POWER);
        
        while (assembler_is_producing(0)) {
            // 待機
        }

        if (assembler_get_last_produced_type(0) != UNIT_TYPE_ASSEMBLER) {
            // 失敗時は娘HULLを分離してやり直し
            hull_detach(0, UNIT_TYPE_HULL, child_hull_index);
            continue;
        }
        child_assembler_index = assembler_get_last_produced_index(0);

        // ----- 娘COMPUTER生産 -----
        assembler_produce_computer(0, child_hull_index, 
                                 CHILD_COMPUTER_FREQUENCY, 
                                 CHILD_COMPUTER_MEMORY);
        
        while (assembler_is_producing(0)) {
            // 待機
        }

        if (assembler_get_last_produced_type(0) != UNIT_TYPE_COMPUTER) {
            // 失敗時は娘エージェント全体を分離
            hull_detach(0, UNIT_TYPE_HULL, child_hull_index);
            continue;
        }
        child_computer_index = assembler_get_last_produced_index(0);

        // ----- 娘COMPUTERのメモリ初期化 -----
        // 娘COMPUTERは生成時はメモリ書き換え許可状態
        
        // 初期プログラムの書き込み（簡単な待機ループ）
        computer_write_memory(child_computer_index, 0x0000, 0x60); // JMP
        computer_write_memory(child_computer_index, 0x0001, 0x00); // to 0x0000
        computer_write_memory(child_computer_index, 0x0002, 0x00);
        
        // TODO: より高度な初期プログラムの転送
        // 現在の実装では単純な待機ループのみ
        
        // メモリ書き換え権限を削除（セキュリティ）
        // 注: v3.0.0仕様では外部からの権限変更は不可のため、
        // 子COMPUTER自身が権限を変更する必要がある

        // ----- 娘エージェントの分離 -----
        hull_detach(0, UNIT_TYPE_HULL, child_hull_index);

        // 次の複製サイクルのためにエネルギー回収
        hull_set_energy_collect_state(0, true);
        
        // エネルギーが十分に回復するまで待機
        while (hull_get_energy_amount(0) < 
               ENERGY_MAKE(16, 0)) {  // 約16,000E（娘エージェント生産コスト）
            // エネルギー回収待機
        }
    }
}

/*
 * 実装上の特徴:
 * 
 * 1. 娘個体の仕様が完全にコード内で定義されている
 *    - 容量、性能などすべてマクロ定数として記述
 *    - 実行時に仕様を変更することはできない
 * 
 * 2. シンプルで確実な複製
 *    - 毎回同じ仕様の娘個体を生産
 *    - エラー処理も単純（失敗したら最初からやり直し）
 * 
 * 3. 制限事項
 *    - 娘COMPUTERへの高度なプログラム転送は未実装
 *    - 娘は単純な待機ループのみ実行
 *    - 真の自己複製には娘への完全なプログラム転送が必要
 * 
 * 4. エネルギー効率
 *    - 待機時はテンプレートマッチングを使用してJMP命令を削減
 *    - 必要最小限のメモリアクセスで実装
 */