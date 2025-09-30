// self-scanning-replication.c
// 自己のスペックをスキャンして複製するエージェント
// Self-scanning replication: 自身の構成を読み取って同一個体を生成

/*
 * エージェント構成仕様:
 * 
 * [親エージェント]
 * - HULL[0]: 任意の容量（スキャンして取得）
 *   - ASSEMBLER[0]: 任意のassemble_power（スキャンして取得）
 *   - COMPUTER[0]: 任意の動作周波数・メモリ容量（スキャンして取得、本プログラムを実行）
 * 
 * [娘エージェント] ※親と同一仕様
 * - HULL: 親と同じ容量
 *   - ASSEMBLER: 親と同じassemble_power
 *   - COMPUTER: 親と同じ動作周波数・メモリ容量
 * 
 * 接続構成:
 * - 親HULL[0]に親ASSEMBLER[0]と親COMPUTER[0]が接続
 * - 自己スキャンにより親の仕様を読み取る
 * - 読み取った仕様で娘エージェントを生産
 * - 最後に娘エージェントを親HULLから分離
 * 
 * 実行COMPUTER: 親COMPUTER[0]で本プログラムを実行
 * 
 * 特徴:
 * - どのような仕様のエージェントでも自己複製可能
 * - 進化的変異に対応（親の変異が娘に継承される）
 */

#include "synthetica_api.h"

// スキャンした仕様を格納する変数のメモリアドレス
#define VAR_MY_HULL_CAPACITY        0x0200
#define VAR_MY_ASSEMBLER_POWER      0x0201
#define VAR_MY_COMPUTER_FREQUENCY   0x0202
#define VAR_MY_COMPUTER_MEMORY      0x0203
#define VAR_CONNECTED_ASSEMBLER_IDX 0x0204
#define VAR_CONNECTED_COMPUTER_IDX  0x0205
#define VAR_CHILD_HULL_IDX          0x0206
#define VAR_CHILD_ASSEMBLER_IDX     0x0207
#define VAR_CHILD_COMPUTER_IDX      0x0208

// 待機ループ用のテンプレート
// template_33: 00110011
// template_CC: 11001100

void main() {
    // 先頭3バイトはNOP（待機ループ削除用の安全領域）
    __asm__("NOP");
    __asm__("NOP");
    __asm__("NOP");
    
    // ========== 自己スキャンフェーズ ==========
    // 自身の仕様を読み取って変数に格納
    
    // HULL[0]の容量を取得
    uint16_t my_hull_capacity = hull_get_capacity(0);
    computer_write_memory(0, VAR_MY_HULL_CAPACITY, my_hull_capacity);
    
    // 接続されているユニットを探索
    uint8_t assembler_idx = UNIT_INDEX_NONE;
    uint8_t computer_idx = UNIT_INDEX_NONE;
    
    // ASSEMBLER探索（最大16個まで）
    for (uint8_t i = 0; i < 16; i++) {
        if (unit_exists(UNIT_CODE_ASSEMBLER, i)) {
            // このASSEMBLERが自分のHULLに接続されているか確認
            // （v3.0.0では直接的な接続確認APIがないため、存在確認のみ）
            assembler_idx = i;
            break;
        }
    }
    computer_write_memory(0, VAR_CONNECTED_ASSEMBLER_IDX, assembler_idx);
    
    // ASSEMBLERのスペックを読み取る
    uint16_t my_assembler_power = 10; // デフォルト値
    if (assembler_idx != UNIT_INDEX_NONE) {
        my_assembler_power = assembler_get_power(assembler_idx);
    }
    computer_write_memory(0, VAR_MY_ASSEMBLER_POWER, my_assembler_power);
    
    // 自身のCOMPUTERスペックを読み取る
    int16_t my_frequency = computer_get_my_frequency();
    uint16_t my_memory = computer_get_my_capacity();
    computer_write_memory(0, VAR_MY_COMPUTER_FREQUENCY, my_frequency);
    computer_write_memory(0, VAR_MY_COMPUTER_MEMORY, my_memory);
    
    // ========== 自己複製フェーズ ==========
    // スキャンした仕様に基づいて娘エージェントを生産
    
    while (1) {
        // スキャンした値を読み出し
        uint16_t hull_capacity = computer_read_my_memory(VAR_MY_HULL_CAPACITY);
        uint16_t assembler_power = computer_read_my_memory(VAR_MY_ASSEMBLER_POWER);
        int16_t computer_frequency = computer_read_my_memory(VAR_MY_COMPUTER_FREQUENCY);
        uint16_t computer_memory = computer_read_my_memory(VAR_MY_COMPUTER_MEMORY);
        uint8_t parent_assembler_idx = computer_read_my_memory(VAR_CONNECTED_ASSEMBLER_IDX);
        
        // エラーチェック
        if (parent_assembler_idx == UNIT_INDEX_NONE) {
            // ASSEMBLERが見つからない場合は再スキャン
            continue;
        }
        
        // ----- 娘HULL生産 -----
        assembler_produce_hull(parent_assembler_idx, UNIT_INDEX_NONE, hull_capacity);
        
        __attribute__((template(0x33)))
        wait_hull_production:
        while (assembler_is_producing(parent_assembler_idx)) {
            // 生産待機
        }
        
        if (assembler_get_last_produced_type(parent_assembler_idx) != UNIT_TYPE_HULL) {
            continue;
        }
        uint8_t child_hull_idx = assembler_get_last_produced_index(parent_assembler_idx);
        computer_write_memory(0, VAR_CHILD_HULL_IDX, child_hull_idx);
        
        // ----- 娘ASSEMBLER生産 -----
        assembler_produce_assembler(parent_assembler_idx, child_hull_idx, assembler_power);
        
        __attribute__((template(0xCC)))
        wait_assembler_production:
        while (assembler_is_producing(parent_assembler_idx)) {
            // 生産待機
        }
        
        if (assembler_get_last_produced_type(parent_assembler_idx) != UNIT_TYPE_ASSEMBLER) {
            hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
            continue;
        }
        uint8_t child_assembler_idx = assembler_get_last_produced_index(parent_assembler_idx);
        computer_write_memory(0, VAR_CHILD_ASSEMBLER_IDX, child_assembler_idx);
        
        // ----- 娘COMPUTER生産 -----
        assembler_produce_computer(parent_assembler_idx, child_hull_idx, 
                                 computer_frequency, computer_memory);
        
        while (assembler_is_producing(parent_assembler_idx)) {
            // 生産待機
        }
        
        if (assembler_get_last_produced_type(parent_assembler_idx) != UNIT_TYPE_COMPUTER) {
            hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
            continue;
        }
        uint8_t child_computer_idx = assembler_get_last_produced_index(parent_assembler_idx);
        computer_write_memory(0, VAR_CHILD_COMPUTER_IDX, child_computer_idx);
        
        // ----- 自己のプログラムを娘COMPUTERへコピー -----
        // 自己複製の核心部分：自身のメモリ内容を娘へ転送
        
        // まず、娘COMPUTERに待機ループを書き込む（PCトラップ）
        computer_write_memory(child_computer_idx, 0x0000, 0x60); // JMP
        computer_write_memory(child_computer_idx, 0x0001, 0x00); // to 0x0000
        computer_write_memory(child_computer_idx, 0x0002, 0x00); // 無限ループ
        
        // メモリ転送ループ（待機ループの後から開始）
        // 注：親プログラムの先頭3バイトはNOPであることを前提
        for (uint16_t addr = 3; addr < computer_memory; addr++) {
            uint16_t value = computer_read_my_memory(addr);
            computer_write_memory(child_computer_idx, addr, value);
            
            // 転送効率化のため、一定間隔でのみ実行
            if ((addr & 0x0F) == 0x0F) {
                // 16バイトごとに少し待機（エネルギー効率）
                __attribute__((template(0x0F)))
                transfer_pause:;
            }
        }
        
        // ----- メモリ書き換え権限を削除 -----
        // 娘COMPUTERに自身の権限を変更させる必要がある
        // そのための小さなプログラムを娘の特定位置に書き込む
        
        // 権限変更プログラム（アドレス0x0100に配置）
        computer_write_memory(child_computer_idx, 0x0100, 0x50); // LOAD_IMM
        computer_write_memory(child_computer_idx, 0x0101, 0x00); // A = 0 (false)
        computer_write_memory(child_computer_idx, 0x0102, 0x00);
        computer_write_memory(child_computer_idx, 0x0103, 0x91); // UNIT_MEM_WRITE
        computer_write_memory(child_computer_idx, 0x0104, 0xC0 | child_computer_idx); // 自身
        computer_write_memory(child_computer_idx, 0x0105, 0x00);
        computer_write_memory(child_computer_idx, 0x0106, 0x02); // permission address
        computer_write_memory(child_computer_idx, 0x0107, 0x60); // JMP
        computer_write_memory(child_computer_idx, 0x0108, 0x00); // to 0x0003（NOP列の後）
        computer_write_memory(child_computer_idx, 0x0109, 0x03);
        
        // 最後に待機ループを削除（NOPで上書き）
        computer_write_memory(child_computer_idx, 0x0000, 0x00); // NOP
        computer_write_memory(child_computer_idx, 0x0001, 0x00); // NOP
        computer_write_memory(child_computer_idx, 0x0002, 0x00); // NOP
        
        // ----- 娘エージェントの分離 -----
        hull_detach(0, UNIT_TYPE_HULL, child_hull_idx);
        
        // エネルギー回復待機
        hull_set_energy_collect_state(0, true);
        
        // 自己複製に必要なエネルギー量を動的に計算
        uint32_t required_energy = 0;
        required_energy += hull_capacity * 2;        // HULL構成エネルギー
        required_energy += required_energy / 20;     // HULL生産エネルギー（5%）
        required_energy += 1000;                     // ASSEMBLER基本
        required_energy += assembler_power * 100;   // ASSEMBLER性能
        required_energy += required_energy / 5;      // ASSEMBLER生産（20%）
        required_energy += 500;                      // COMPUTER基本
        required_energy += computer_frequency * computer_frequency * 4; // 周波数コスト
        required_energy += computer_memory * 50;     // メモリコスト
        required_energy += required_energy / 5;      // COMPUTER生産（20%）
        
        while (hull_get_energy_amount(0) < ENERGY_LOW(required_energy)) {
            // エネルギー回収待機
        }
    }
}

/*
 * 実装上の特徴:
 * 
 * 1. 完全な自己スキャン
 *    - 自身のHULL容量、ASSEMBLER性能、COMPUTER仕様をすべて読み取る
 *    - 任意の仕様のエージェントが自己複製可能
 * 
 * 2. プログラムの自己転送
 *    - 自身のメモリ内容を娘COMPUTERへ完全にコピー
 *    - 真の意味での自己複製を実現
 * 
 * 3. 進化への対応
 *    - 親の変異（仕様変更）が自動的に娘へ継承される
 *    - 世代を重ねても情報が保存される
 * 
 * 4. 動的なエネルギー計算
 *    - スキャンした仕様に基づいて必要エネルギーを計算
 *    - 様々な仕様のエージェントに対応
 * 
 * 5. 制限事項
 *    - 単一のHULL[0]に接続されたASSEMBLER[0]とCOMPUTER[0]で構成される
 *      単純な構造のエージェントのみサポート（複数HULL非対応）
 *    - プログラムカウンタの直接制御ができないが、待機ループによるトラップで回避可能
 *    - メモリ権限変更に工夫が必要
 */