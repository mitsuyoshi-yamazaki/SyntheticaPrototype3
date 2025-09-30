// synthetica_api.h
// Synthetica v3.0.0 C言語API
// COMPUTERから外部ユニットへアクセスするためのAPI定義

#ifndef SYNTHETICA_API_H
#define SYNTHETICA_API_H

// ========================================
// 型定義
// ========================================
typedef unsigned int uint16_t;  // 16bit unsigned integer
typedef int int16_t;            // 16bit signed integer
typedef unsigned int uint8_t;   // 8bit unsigned integer (下位8bitのみ使用)
typedef unsigned int bool;      // 0 | 1

// ========================================
// ユニット種別定義
// ========================================
// ユニット種別コード（メモリマップドI/Oの上位4bit）
#define UNIT_TYPE_NONE          0x0000
#define UNIT_TYPE_HULL          0x0001
#define UNIT_TYPE_ASSEMBLER     0x0002
#define UNIT_TYPE_DISASSEMBLER  0x0003  // v3では廃止、v4で実装予定
#define UNIT_TYPE_COMPUTER      0x0004
#define UNIT_TYPE_CONNECTOR     0x0005  // v4で実装予定
#define UNIT_TYPE_SENSOR        0x0006  // v4で実装予定
#define UNIT_TYPE_MOVER         0x0007  // v4で実装予定

// メモリマップドI/O用ユニット種別コード（上位4bit）
#define UNIT_CODE_HULL          0x00    // 0x0? = HULL[0-15]
#define UNIT_CODE_ASSEMBLER     0x40    // 0x4? = ASSEMBLER[0-15]
#define UNIT_CODE_DISASSEMBLER  0x80    // 0x8? = DISASSEMBLER[0-15]
#define UNIT_CODE_COMPUTER      0xC0    // 0xC? = COMPUTER[0-15]

// 特殊値
#define UNIT_INDEX_NONE         0x00FF  // ユニットインデックスのnull値
#define MEMORY_ACCESS_ERROR     0xFFFF  // メモリアクセスエラー時の戻り値

// ========================================
// HULL操作メモリ領域 (0x00-0x07)
// ========================================
#define HULL_MEM_CAPACITY       0x0000  // [R] uint HULL容量（スペック）
#define HULL_MEM_CURRENT_SIZE   0x0001  // [R] uint 現在の格納量
#define HULL_MEM_ENERGY_AMOUNT  0x0002  // [R] uint エネルギー格納量
#define HULL_MEM_ENERGY_COLLECT 0x0003  // [RW] bool エネルギー回収状態
#define HULL_MEM_MERGE_TARGET   0x0004  // [RW] uint マージ対象指定
#define HULL_MEM_DETACH_TYPE    0x0005  // [RW] uint 分離対象ユニット種別
#define HULL_MEM_DETACH_INDEX   0x0006  // [RW] uint 分離対象ユニットindex
#define HULL_MEM_DETACH_EXECUTE 0x0007  // [RW] bool 分離実行フラグ

// ========================================
// ASSEMBLER操作メモリ領域 (0x00-0x0E)
// ========================================
#define ASSEMBLER_MEM_POWER     0x0000  // [R] uint assemble_power（スペック）
#define ASSEMBLER_MEM_UNIT_TYPE 0x0001  // [RW] uint 生産ユニット種別
#define ASSEMBLER_MEM_CONNECT   0x0002  // [RW] uint 生産ユニット接続HULL index
#define ASSEMBLER_MEM_PARAM1    0x0003  // [RW] uint 生産パラメータ1
#define ASSEMBLER_MEM_PARAM2    0x0004  // [RW] uint 生産パラメータ2
#define ASSEMBLER_MEM_PARAM3    0x0005  // [RW] uint 生産パラメータ3（予約）
#define ASSEMBLER_MEM_PARAM4    0x0006  // [RW] uint 生産パラメータ4（予約）
#define ASSEMBLER_MEM_PARAM5    0x0007  // [RW] uint 生産パラメータ5（予約）
#define ASSEMBLER_MEM_PARAM6    0x0008  // [RW] uint 生産パラメータ6（予約）
#define ASSEMBLER_MEM_PRODUCE   0x0009  // [RW] bool 生産状態
#define ASSEMBLER_MEM_REPAIR_TYPE  0x000A  // [RW] uint 修理ユニット種別
#define ASSEMBLER_MEM_REPAIR_INDEX 0x000B  // [RW] uint 修理ユニットindex
#define ASSEMBLER_MEM_REPAIR    0x000C  // [RW] bool 修理状態
#define ASSEMBLER_MEM_LAST_TYPE 0x000D  // [R] uint 最後に生産したユニット種別
#define ASSEMBLER_MEM_LAST_INDEX 0x000E  // [R] uint 最後に生産したユニットindex

// ========================================
// COMPUTER操作メモリ領域 (0x00-0x04)
// ========================================
#define COMPUTER_MEM_FREQUENCY  0x0000  // [R] int 動作周波数（スペック）
#define COMPUTER_MEM_CAPACITY   0x0001  // [R] uint メモリ容量（スペック）
#define COMPUTER_MEM_PERMISSION 0x0002  // [RW] bool メモリ領域の外部書き換え・読み取り許可状態
#define COMPUTER_MEM_ADDRESS    0x0003  // [RW] uint メモリ指定アドレス
#define COMPUTER_MEM_VALUE      0x0004  // [RW] uint メモリ値

// ========================================
// C言語API関数定義
// ========================================
// 注: これらの関数はCコンパイラによってSynthetica Script命令に変換される

// ---- HULL API ----
uint16_t hull_get_capacity(uint8_t hull_index);
uint16_t hull_get_current_size(uint8_t hull_index);
uint16_t hull_get_energy_amount(uint8_t hull_index);
bool hull_get_energy_collect_state(uint8_t hull_index);
void hull_set_energy_collect_state(uint8_t hull_index, bool state);
void hull_merge(uint8_t from_hull_index, uint8_t to_hull_index);
void hull_detach(uint8_t hull_index, uint16_t unit_type, uint8_t unit_index);

// ---- ASSEMBLER API ----
uint16_t assembler_get_power(uint8_t assembler_index);
void assembler_produce_hull(uint8_t assembler_index, uint8_t connect_hull_index, uint16_t capacity);
void assembler_produce_assembler(uint8_t assembler_index, uint8_t connect_hull_index, uint16_t power);
void assembler_produce_computer(uint8_t assembler_index, uint8_t connect_hull_index, int16_t frequency, uint16_t memory_size);
bool assembler_is_producing(uint8_t assembler_index);
void assembler_stop_production(uint8_t assembler_index);
uint16_t assembler_get_last_produced_type(uint8_t assembler_index);
uint8_t assembler_get_last_produced_index(uint8_t assembler_index);
void assembler_repair(uint8_t assembler_index, uint16_t unit_type, uint8_t unit_index);
bool assembler_is_repairing(uint8_t assembler_index);
void assembler_stop_repair(uint8_t assembler_index);

// ---- COMPUTER API (自身) ----
int16_t computer_get_my_frequency(void);
uint16_t computer_get_my_capacity(void);
bool computer_get_my_permission(void);
void computer_set_my_permission(bool permission);
uint16_t computer_read_my_memory(uint16_t address);
uint16_t computer_search_template(uint8_t template);

// ---- COMPUTER API (他COMPUTER) ----
int16_t computer_get_frequency(uint8_t computer_index);
uint16_t computer_get_capacity(uint8_t computer_index);
bool computer_get_permission(uint8_t computer_index);
uint16_t computer_read_memory(uint8_t computer_index, uint16_t address);
void computer_write_memory(uint8_t computer_index, uint16_t address, uint16_t value);

// ---- 汎用ユニットアクセスAPI ----
uint16_t unit_mem_read(uint8_t unit_type_code, uint8_t unit_index, uint16_t address);
void unit_mem_write(uint8_t unit_type_code, uint8_t unit_index, uint16_t address, uint16_t value);
bool unit_exists(uint8_t unit_type_code, uint8_t unit_index);

// ========================================
// エネルギー計算用マクロ
// ========================================
// エネルギーは32bit（上位16bit: 1024E単位、下位16bit: 1E単位）
#define ENERGY_MAKE(high, low)  ((high << 16) | low)
#define ENERGY_HIGH(energy)     (energy >> 16)
#define ENERGY_LOW(energy)      (energy & 0xFFFF)

// ========================================
// テンプレート定義（__attribute__拡張）
// ========================================
// 使用例:
// __attribute__((template(0xC5))) 
// loop_start:
//     // ここにテンプレート 11000101 が配置される

#endif // SYNTHETICA_API_H