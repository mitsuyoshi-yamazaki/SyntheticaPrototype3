/**
 * energy-constants.h
 * 
 * Synthetica エネルギー定数定義ヘッダー
 * 1024進法エネルギーシステムの共通定数
 */

#ifndef ENERGY_CONSTANTS_H
#define ENERGY_CONSTANTS_H

/* ========================================
 * 基本定義
 * ======================================== */

// エネルギー型（32bit）
typedef uint32_t energy_t;

// 基本単位
#define E_KILO        1024U      // 1kE = 1024E
#define E_MAX     67108863U      // 最大エネルギー値

/* ========================================
 * エネルギー操作マクロ
 * ======================================== */

// 上位/下位分離
#define ENERGY_HIGH(e)      ((uint16_t)((e) >> 10))
#define ENERGY_LOW(e)       ((uint16_t)((e) & 0x3FFU))
#define MAKE_ENERGY(h, l)   ((energy_t)(((uint32_t)(h) << 10) | ((l) & 0x3FFU)))

// エネルギー定数生成ヘルパー
#define E(n)                ((energy_t)(n))           // nE
#define KE(n)               ((energy_t)((n) * E_KILO)) // n×1024E

/* ========================================
 * COMPUTER命令実行コスト
 * ======================================== */

#define COST_INST_1BYTE     1    // 1バイト命令: 1E
#define COST_INST_3BYTE     3    // 3バイト命令: 3E
#define COST_INST_4BYTE     4    // 4バイト命令: 4E
#define COST_INST_5BYTE     5    // 5バイト命令: 5E
#define COST_INST_ABSOLUTE  6    // 絶対アドレス: 6E
#define COST_INST_REG_BASE  3    // レジスタベース: 3E（3.5E → 3E）
#define COST_INST_INDIRECT  4    // 間接アドレス: 4E
#define COST_UNIT_OPERATION 10   // ユニット操作追加: 10E

/* ========================================
 * ユニット生成コスト定数
 * ======================================== */

// HULL
#define HULL_COST_PER_CAPACITY      E(2)      // 容量あたり2E
#define HULL_PRODUCTION_RATIO       0.05      // 生産エネルギー比率

// ASSEMBLER（新コスト: 1/10削減）
#define ASSEMBLER_BASE_COST         E(800)    // 基本コスト800E
#define ASSEMBLER_POWER_COST        E(200)    // power当たり200E
#define ASSEMBLER_PRODUCTION_RATIO  0.2       // 生産エネルギー比率（調整後）

// DISASSEMBLER（新コスト: 1/10削減）
#define DISASSEMBLER_BASE_COST      E(200)    // 基本コスト200E
#define DISASSEMBLER_POWER_COST     E(100)    // power当たり100E
#define DISASSEMBLER_PRODUCTION_RATIO 0.2     // 生産エネルギー比率

// COMPUTER（新コスト: 1/10削減）
#define COMPUTER_BASE_COST          E(500)    // 基本コスト500E
#define COMPUTER_FREQ_DIVISOR       5         // 周波数除数
#define COMPUTER_FREQ_MULTIPLIER    E(100)    // 周波数倍率100E
#define COMPUTER_MEMORY_COST        E(50)     // メモリコスト50E/B（1/10削減）
#define COMPUTER_PRODUCTION_RATIO   0.1       // 生産エネルギー比率（調整後）

// 生産中ユニット
#define PRODUCING_UNIT_RATIO        0.05      // 構成エネルギーの5%（削減）

/* ========================================
 * 熱ダメージ関連
 * ======================================== */

#define HEAT_DAMAGE_THRESHOLD       100       // 熱ダメージ閾値（度）
#define HEAT_DAMAGE_RATE           0.1        // ダメージ率
#define HEAT_DAMAGE_MULTIPLIER_DAMAGED  2    // 損傷時の倍率
#define HEAT_DAMAGE_MULTIPLIER_PRODUCING 3   // 生産中の倍率

/* ========================================
 * よく使用するエネルギー値
 * ======================================== */

#define ENERGY_1E           E(1)
#define ENERGY_10E          E(10)
#define ENERGY_100E         E(100)
#define ENERGY_1000E        E(1000)
#define ENERGY_1KE          KE(1)
#define ENERGY_10KE         KE(10)
#define ENERGY_100KE        KE(100)

/* ========================================
 * サンプル用定数（example.c用）
 * ======================================== */

#define REPRODUCTION_HULL_CAPACITY      100
#define EXPAND_HULL_CAPACITY            20
#define CHILD_HULL_CAPACITY             100
#define CHILD_ASSEMBLER_POWER           1
#define CHILD_COMPUTER_CPU_FREQUENCY    1
#define CHILD_COMPUTER_MEMORY_SIZE      256

// エネルギー計算済み定数
#define REPRODUCTION_HULL_ENERGY        E(200)    // 100×2E
#define CHILD_HULL_TOTAL_COST          E(210)    // 200E + ceil(200×0.05)
#define CHILD_ASSEMBLER_TOTAL_COST     E(1200)   // 800+200 + ceil(1000×0.2)
#define CHILD_COMPUTER_TOTAL_COST      E(13520)  // 500+20+12800 + ceil(13320×0.1)

#endif /* ENERGY_CONSTANTS_H */