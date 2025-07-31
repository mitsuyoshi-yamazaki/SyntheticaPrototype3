// blueprint-replication.c
// メモリ上に格納したスペックを元に複製する万能複製エージェント
// Blueprint replication: メモリに保存された設計図から任意のエージェントを複製

/*
 * エージェント構成仕様:
 * 
 * [親エージェント]
 * - HULL[0]: 容量300以上（設計図とプログラムを格納するため）
 *   - ASSEMBLER[0]: assemble_power 10以上
 *   - COMPUTER[0]: 動作周波数 1命令/tick、メモリ 1024バイト以上（本プログラムを実行）
 * 
 * [娘エージェント] ※設計図に基づいて生成
 * - 設計図で定義された仕様のエージェント
 * 
 * 接続構成:
 * - 親HULL[0]に親ASSEMBLER[0]と親COMPUTER[0]が接続
 * - メモリ内の設計図を読み取って娘エージェントを生産
 * - 最後に娘エージェントを親HULLから分離
 * 
 * 実行COMPUTER: 親COMPUTER[0]で本プログラムを実行
 * 
 * 制約事項:
 * 1. 単一HULL構成のエージェントのみサポート
 * 2. 各ユニット種別は1個まで（HULL×1、ASSEMBLER×1、COMPUTER×1）
 * 3. COMPUTERプログラムは設計図内に1つのみ格納可能
 * 4. 複雑な接続関係（複数HULL等）は非サポート
 * 5. 設計図サイズは最大512バイト
 */

#include "synthetica_api.h"

// 設計図フォーマット定義
// メモリアドレス 0x0400 から開始
#define BLUEPRINT_START_ADDR    0x0400

// 設計図ヘッダー（16バイト）
#define BP_MAGIC_NUMBER         0x0400  // 0xBEEF (Blueprint magic)
#define BP_VERSION              0x0401  // バージョン（現在は0x01）
#define BP_HULL_FLAG            0x0402  // HULLの有無（0x01=あり）
#define BP_ASSEMBLER_FLAG       0x0403  // ASSEMBLERの有無
#define BP_COMPUTER_FLAG        0x0404  // COMPUTERの有無
#define BP_PROGRAM_SIZE_HIGH    0x0405  // プログラムサイズ上位
#define BP_PROGRAM_SIZE_LOW     0x0406  // プログラムサイズ下位
// 0x0407-0x040F は予約

// ユニット仕様部（各ユニット8バイト）
#define BP_HULL_SPEC            0x0410  // HULL仕様開始
#define BP_HULL_CAPACITY_HIGH   0x0410
#define BP_HULL_CAPACITY_LOW    0x0411
// 0x0412-0x0417 は予約

#define BP_ASSEMBLER_SPEC       0x0418  // ASSEMBLER仕様開始
#define BP_ASSEMBLER_POWER_HIGH 0x0418
#define BP_ASSEMBLER_POWER_LOW  0x0419
// 0x041A-0x041F は予約

#define BP_COMPUTER_SPEC        0x0420  // COMPUTER仕様開始
#define BP_COMPUTER_FREQ_HIGH   0x0420
#define BP_COMPUTER_FREQ_LOW    0x0421
#define BP_COMPUTER_MEM_HIGH    0x0422
#define BP_COMPUTER_MEM_LOW     0x0423
// 0x0424-0x0427 は予約

// プログラムデータ部
#define BP_PROGRAM_DATA         0x0428  // COMPUTERプログラム開始

// 作業用変数
#define VAR_CHILD_HULL_IDX      0x0300
#define VAR_CHILD_ASSEMBLER_IDX 0x0301
#define VAR_CHILD_COMPUTER_IDX  0x0302
#define VAR_PROGRAM_SIZE        0x0303

// 待機ループ用のテンプレート
// template_5A: 01011010
// template_A5: 10100101

void main() {
    // 先頭3バイトはNOP（待機ループ削除用の安全領域）
    __asm__("NOP");
    __asm__("NOP");
    __asm__("NOP");
    
    // ========== 自己複製フェーズ ==========
    while (1) {
        // 設計図からユニット仕様を読み取り
        uint8_t has_hull = computer_read_my_memory(BP_HULL_FLAG);
        uint8_t has_assembler = computer_read_my_memory(BP_ASSEMBLER_FLAG);
        uint8_t has_computer = computer_read_my_memory(BP_COMPUTER_FLAG);
        
        // 最低限HULLは必要
        if (!has_hull) {
            continue;
        }
        
        // ----- 娘HULL生産 -----
        uint16_t hull_capacity = (computer_read_my_memory(BP_HULL_CAPACITY_HIGH) << 8) |
                                computer_read_my_memory(BP_HULL_CAPACITY_LOW);
        
        assembler_produce_hull(0, UNIT_INDEX_NONE, hull_capacity);
        
        __attribute__((template(0x5A)))
        wait_hull:
        while (assembler_is_producing(0)) {
            // 生産待機
        }
        
        if (assembler_get_last_produced_type(0) != UNIT_TYPE_HULL) {
            continue;
        }
        uint8_t child_hull_idx = assembler_get_last_produced_index(0);
        computer_write_memory(0, VAR_CHILD_HULL_IDX, child_hull_idx);
        
        // ----- 娘ASSEMBLER生産（設計図に含まれる場合）-----
        if (has_assembler) {
            uint16_t assembler_power = (computer_read_my_memory(BP_ASSEMBLER_POWER_HIGH) << 8) |
                                      computer_read_my_memory(BP_ASSEMBLER_POWER_LOW);
            
            assembler_produce_assembler(0, child_hull_idx, assembler_power);
            
            __attribute__((template(0xA5)))
            wait_assembler:
            while (assembler_is_producing(0)) {
                // 生産待機
            }
            
            if (assembler_get_last_produced_type(0) != UNIT_TYPE_ASSEMBLER) {
                hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
                continue;
            }
            uint8_t child_assembler_idx = assembler_get_last_produced_index(0);
            computer_write_memory(0, VAR_CHILD_ASSEMBLER_IDX, child_assembler_idx);
        }
        
        // ----- 娘COMPUTER生産（設計図に含まれる場合）-----
        if (has_computer) {
            int16_t computer_freq = (computer_read_my_memory(BP_COMPUTER_FREQ_HIGH) << 8) |
                                   computer_read_my_memory(BP_COMPUTER_FREQ_LOW);
            uint16_t computer_mem = (computer_read_my_memory(BP_COMPUTER_MEM_HIGH) << 8) |
                                   computer_read_my_memory(BP_COMPUTER_MEM_LOW);
            
            assembler_produce_computer(0, child_hull_idx, computer_freq, computer_mem);
            
            while (assembler_is_producing(0)) {
                // 生産待機
            }
            
            if (assembler_get_last_produced_type(0) != UNIT_TYPE_COMPUTER) {
                hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
                continue;
            }
            uint8_t child_computer_idx = assembler_get_last_produced_index(0);
            computer_write_memory(0, VAR_CHILD_COMPUTER_IDX, child_computer_idx);
            
            // ----- 設計図内のプログラムを娘COMPUTERへ転送 -----
            uint16_t program_size = (computer_read_my_memory(BP_PROGRAM_SIZE_HIGH) << 8) |
                                   computer_read_my_memory(BP_PROGRAM_SIZE_LOW);
            computer_write_memory(0, VAR_PROGRAM_SIZE, program_size);
            
            // 待機ループを設置
            computer_write_memory(child_computer_idx, 0x0000, 0x60); // JMP
            computer_write_memory(child_computer_idx, 0x0001, 0x00); // to 0x0000
            computer_write_memory(child_computer_idx, 0x0002, 0x00);
            
            // プログラム転送（設計図から）
            for (uint16_t i = 0; i < program_size && i < computer_mem - 3; i++) {
                uint16_t value = computer_read_my_memory(BP_PROGRAM_DATA + i);
                computer_write_memory(child_computer_idx, i + 3, value);
                
                // 転送効率化
                if ((i & 0x1F) == 0x1F) {
                    __attribute__((template(0x1F)))
                    transfer_pause:;
                }
            }
            
            // 待機ループを削除
            computer_write_memory(child_computer_idx, 0x0000, 0x00); // NOP
            computer_write_memory(child_computer_idx, 0x0001, 0x00); // NOP
            computer_write_memory(child_computer_idx, 0x0002, 0x00); // NOP
        }
        
        // ----- 娘エージェントの分離 -----
        hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
        
        // エネルギー回復待機
        hull_set_energy_collect_state(0, true);
        while (hull_get_energy_amount(0) < ENERGY_MAKE(20, 0)) {
            // 基本的な複製コスト（設計図により変動）
        }
    }
}

/*
 * 実装上の特徴:
 * 
 * 1. 設計図フォーマット
 *    - ヘッダー部：ユニット構成フラグとプログラムサイズ
 *    - 仕様部：各ユニットの詳細仕様
 *    - プログラム部：COMPUTERに転送するプログラム
 * 
 * 2. 柔軟性と制約のバランス
 *    - 様々な仕様のエージェントを生成可能
 *    - ただし単一ユニット構成に限定
 * 
 * 3. 設計図の解釈
 *    - 設計図の検証を行わず、記載された内容をそのまま実行
 *    - 変異や進化に対して開かれた設計
 * 
 * 4. メモリ効率
 *    - 設計図は512バイト以内に収める
 *    - 大きなプログラムは格納できない
 * 
 * 5. 拡張性
 *    - 将来的に複数ユニット対応も可能な設計
 *    - バージョン管理により後方互換性を確保
 */