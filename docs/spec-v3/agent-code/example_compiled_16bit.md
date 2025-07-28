# example.c の16bit Synthetica Scriptコンパイル結果

## このファイルについて

- `example.c` のC言語コードを16bit Synthetica Scriptへコンパイルした結果
- 16bitアーキテクチャ仕様に基づく実装
- レジスタベースアドレッシング命令を活用した効率的な実装

## コンパイル仕様

- 16bitアーキテクチャ（プログラムカウンタ、レジスタ、メモリアドレスすべて16bit）
- 変数はメモリへ格納（16bit値）
- ユニットインデックスはDレジスタ経由で動的指定
- テンプレートは`template_XX`形式で表現（XXは8bit値の16進数表現）

## メモリマップ

```
0x0000-0x01FF: プログラムコード領域
0x0200-0x02FF: 変数領域
  0x0200: child_hull_index (16bit)
  0x0202: memory_size (16bit)
  0x0204: memory_address (16bit)
0x0300-0x03FF: スタック領域（未使用）
0x0400-0xFFFF: 予約領域
```

## 定数定義

```
NONE                = 0x0000
HULL                = 0x0001
ASSEMBLER           = 0x0002
DISASSEMBLER        = 0x0003
COMPUTER            = 0x0004
UNIT_INDEX_NONE     = 0x00FF

REPRODUCTION_HULL_CAPACITY  = 0x00C8  # 200
EXPAND_HULL_CAPACITY        = 0x0014  # 20
CHILD_HULL_CAPACITY         = 0x0064  # 100
CHILD_ASSEMBLER_POWER       = 0x0014  # 20
CHILD_COMPUTER_CPU_FREQUENCY = 0x000A  # 10
CHILD_COMPUTER_MEMORY_SIZE  = 0x0100  # 256

ASSEMBLER_NOP0 = 0x00
ASSEMBLER_JMP  = 0x60
```

## コンパイル結果

```assembly
# === main関数開始 ===
# アドレス: 0x0000

# === 成長ループ ===
growth_loop:                    # 0x0000
    # if (get_capacity(0) > REPRODUCTION_HULL_CAPACITY)
    LOAD_IMM_D 0x0000          # 0x0000: D = 0 (hull_index = 0)
    UNIT_MEM_READ_REG HULL, 0x00  # 0x0003: A = HULL[D].capacity
    LOAD_IMM_B 0x00C8          # 0x0006: B = 200 (REPRODUCTION_HULL_CAPACITY)
    CMP_AB                     # 0x0009: flags = A - B
    JG growth_done             # 0x000A: if A > B goto growth_done (0x0072)

    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x000D: D = 0 (assembler_index = 0)
    LOAD_IMM_A 0x0000          # 0x0010: A = NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x0013: ASSEMBLER[D].last_assembled_type = A
    LOAD_IMM_A 0x00FF          # 0x0016: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x04  # 0x0019: ASSEMBLER[D].last_assembled_index = A

    # assemble(0, HULL, EXPAND_HULL_CAPACITY)
    LOAD_IMM_A 0x0001          # 0x001C: A = HULL
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x001F: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x0022: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x0025: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0014          # 0x0028: A = EXPAND_HULL_CAPACITY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x05  # 0x002B: ASSEMBLER[D].param1 = A (capacity)

assemble_wait_1:               # 0x002E
    # while (is_assembling(0))
    LOAD_IMM_D 0x0000          # 0x002E: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x02  # 0x0031: A = ASSEMBLER[D].is_assembling
    LOAD_IMM_B 0x0000          # 0x0034: B = 0
    CMP_AB                     # 0x0037: flags = A - B
    JNE assemble_wait_1        # 0x0038: if A != 0 goto assemble_wait_1

    # if (get_last_assembled_unit_type(0) == HULL)
    UNIT_MEM_READ_REG ASSEMBLER, 0x03  # 0x003B: A = ASSEMBLER[D].last_assembled_type
    LOAD_IMM_B 0x0001          # 0x003E: B = HULL
    CMP_AB                     # 0x0041: flags = A - B
    JNE skip_merge             # 0x0042: if A != B goto skip_merge

    # merge_hull(get_last_assembled_unit_index(0), 0)
    UNIT_MEM_READ_REG ASSEMBLER, 0x04  # 0x0045: A = ASSEMBLER[D].last_assembled_index
    MOVE_AB                    # 0x0048: B = A (source_hull_index)
    LOAD_IMM_A 0x0000          # 0x0049: A = 0 (target_hull_index)
    LOAD_IMM_D 0x0000          # 0x004C: D = 0 (target_hull)
    UNIT_MEM_WRITE_REG HULL, 0x03  # 0x004F: HULL[D].merge_source_index = B
    UNIT_MEM_WRITE_REG HULL, 0x04  # 0x0052: HULL[D].merge_action = 1 (merge)

skip_merge:                     # 0x0055
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x0055: D = 0
    LOAD_IMM_A 0x0000          # 0x0058: A = NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x005B: ASSEMBLER[D].last_assembled_type = A
    LOAD_IMM_A 0x00FF          # 0x005E: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x04  # 0x0061: ASSEMBLER[D].last_assembled_index = A

    JMP growth_loop            # 0x0064: goto growth_loop

# === 自己複製ループ ===
growth_done:                   # 0x0067
reproduction_loop:             # 0x0067
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x0067: D = 0
    LOAD_IMM_A 0x0000          # 0x006A: A = NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x006D: ASSEMBLER[D].last_assembled_type = A
    LOAD_IMM_A 0x00FF          # 0x0070: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x04  # 0x0073: ASSEMBLER[D].last_assembled_index = A

    # assemble(0, HULL, CHILD_HULL_CAPACITY)
    LOAD_IMM_A 0x0001          # 0x0076: A = HULL
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x0079: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x007C: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x007F: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0064          # 0x0082: A = CHILD_HULL_CAPACITY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x05  # 0x0085: ASSEMBLER[D].param1 = A

assemble_wait_2:               # 0x0088
    LOAD_IMM_D 0x0000          # 0x0088: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x02  # 0x008B: A = ASSEMBLER[D].is_assembling
    LOAD_IMM_B 0x0000          # 0x008E: B = 0
    CMP_AB                     # 0x0091: flags = A - B
    JNE assemble_wait_2        # 0x0092: if A != 0 goto assemble_wait_2

    # if (get_last_assembled_unit_type(0) != HULL)
    UNIT_MEM_READ_REG ASSEMBLER, 0x03  # 0x0095: A = ASSEMBLER[D].last_assembled_type
    LOAD_IMM_B 0x0001          # 0x0098: B = HULL
    CMP_AB                     # 0x009B: flags = A - B
    JE save_child_hull         # 0x009C: if A == B goto save_child_hull

    # detach失敗した生成物
    UNIT_MEM_READ_REG ASSEMBLER, 0x03  # 0x009F: A = last_assembled_type
    MOVE_AB                    # 0x00A2: B = A
    UNIT_MEM_READ_REG ASSEMBLER, 0x04  # 0x00A3: A = last_assembled_index
    MOVE_AC                    # 0x00A6: C = A
    LOAD_IMM_D 0x0000          # 0x00A7: D = 0 (hull_index)
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x00AA: HULL[D].detach_unit_type = B
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x00AD: HULL[D].detach_unit_index = C
    UNIT_MEM_WRITE_REG HULL, 0x08  # 0x00B0: HULL[D].detach_action = 1
    JMP reproduction_loop      # 0x00B3: continue

save_child_hull:               # 0x00B6
    # child_hull_index = get_last_assembled_unit_index(0)
    UNIT_MEM_READ_REG ASSEMBLER, 0x04  # 0x00B6: A = last_assembled_index
    STORE_IMM_A 0x0200         # 0x00B9: child_hull_index = A

    # === 娘ASSEMBLER作成 ===
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x00BC: D = 0
    LOAD_IMM_A 0x0000          # 0x00BF: A = NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x00C2: ASSEMBLER[D].last_assembled_type = A
    LOAD_IMM_A 0x00FF          # 0x00C5: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x04  # 0x00C8: ASSEMBLER[D].last_assembled_index = A

    # assemble(0, ASSEMBLER, CHILD_ASSEMBLER_POWER)
    LOAD_IMM_A 0x0002          # 0x00CB: A = ASSEMBLER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x00CE: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x00D1: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x00D4: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0014          # 0x00D7: A = CHILD_ASSEMBLER_POWER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x05  # 0x00DA: ASSEMBLER[D].param1 = A

assemble_wait_3:               # 0x00DD
    LOAD_IMM_D 0x0000          # 0x00DD: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x02  # 0x00E0: A = ASSEMBLER[D].is_assembling
    LOAD_IMM_B 0x0000          # 0x00E3: B = 0
    CMP_AB                     # 0x00E6: flags = A - B
    JNE assemble_wait_3        # 0x00E7: if A != 0 goto assemble_wait_3

    # if (get_last_assembled_unit_type(0) != ASSEMBLER)
    UNIT_MEM_READ_REG ASSEMBLER, 0x03  # 0x00EA: A = last_assembled_type
    LOAD_IMM_B 0x0002          # 0x00ED: B = ASSEMBLER
    CMP_AB                     # 0x00F0: flags = A - B
    JE create_computer         # 0x00F1: if A == B goto create_computer

    # detach失敗時の処理
    LOAD_IMM_D 0x0000          # 0x00F4: D = 0
    LOAD_IMM_B 0x0001          # 0x00F7: B = HULL
    LOAD_IMM_A 0x0200          # 0x00FA: A = &child_hull_index
    LOAD_IND_REG C, A          # 0x00FD: C = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x0100: HULL[D].detach_unit_type = B
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x0103: HULL[D].detach_unit_index = C
    UNIT_MEM_WRITE_REG HULL, 0x08  # 0x0106: HULL[D].detach_action = 1
    JMP reproduction_loop      # 0x0109: continue

create_computer:               # 0x010C
    # === 娘COMPUTER作成 ===
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x010C: D = 0
    LOAD_IMM_A 0x0000          # 0x010F: A = NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x0112: ASSEMBLER[D].last_assembled_type = A
    LOAD_IMM_A 0x00FF          # 0x0115: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x04  # 0x0118: ASSEMBLER[D].last_assembled_index = A

    # assemble(0, COMPUTER, CHILD_COMPUTER_CPU_FREQUENCY, CHILD_COMPUTER_MEMORY_SIZE)
    LOAD_IMM_A 0x0004          # 0x011B: A = COMPUTER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x011E: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x0121: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x0124: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x000A          # 0x0127: A = CHILD_COMPUTER_CPU_FREQUENCY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x05  # 0x012A: ASSEMBLER[D].param1 = A
    LOAD_IMM_A 0x0100          # 0x012D: A = CHILD_COMPUTER_MEMORY_SIZE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x06  # 0x0130: ASSEMBLER[D].param2 = A

assemble_wait_4:               # 0x0133
    LOAD_IMM_D 0x0000          # 0x0133: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x02  # 0x0136: A = ASSEMBLER[D].is_assembling
    LOAD_IMM_B 0x0000          # 0x0139: B = 0
    CMP_AB                     # 0x013C: flags = A - B
    JNE assemble_wait_4        # 0x013D: if A != 0 goto assemble_wait_4

    # if (get_last_assembled_unit_type(0) != COMPUTER)
    UNIT_MEM_READ_REG ASSEMBLER, 0x03  # 0x0140: A = last_assembled_type
    LOAD_IMM_B 0x0004          # 0x0143: B = COMPUTER
    CMP_AB                     # 0x0146: flags = A - B
    JE copy_memory             # 0x0147: if A == B goto copy_memory

    # detach失敗時の処理
    LOAD_IMM_D 0x0000          # 0x014A: D = 0
    LOAD_IMM_B 0x0001          # 0x014D: B = HULL
    LOAD_IMM_A 0x0200          # 0x0150: A = &child_hull_index
    LOAD_IND_REG C, A          # 0x0153: C = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x0156: HULL[D].detach_unit_type = B
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x0159: HULL[D].detach_unit_index = C
    UNIT_MEM_WRITE_REG HULL, 0x08  # 0x015C: HULL[D].detach_action = 1
    JMP reproduction_loop      # 0x015F: continue

copy_memory:                   # 0x0162
    # === 娘COMPUTERへのメモリ書き込み ===
    # write_computer_memory(1, 0, ASSEMBLER_JMP)
    LOAD_IMM_D 0x0001          # 0x0162: D = 1 (computer_index)
    LOAD_IMM_A 0x0000          # 0x0165: A = 0 (memory_address)
    LOAD_IMM_B 0x0060          # 0x0168: B = ASSEMBLER_JMP
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x016B: COMPUTER[D].write_address = A
    UNIT_MEM_WRITE_REG COMPUTER, 0x03  # 0x016E: COMPUTER[D].write_value = B
    UNIT_MEM_WRITE_REG COMPUTER, 0x04  # 0x0171: COMPUTER[D].write_request = 1

    # memory_size = search_template(0xCC)
    TEMPLATE_SEARCH 0xCC       # 0x0174: A = template_CC address
    STORE_IMM_A 0x0202         # 0x0177: memory_size = A

    # for (memory_address = 2; memory_address <= memory_size; memory_address++)
    LOAD_IMM_A 0x0002          # 0x017A: A = 2
    STORE_IMM_A 0x0204         # 0x017D: memory_address = A

copy_loop:                     # 0x0180
    # memory_address <= memory_size のチェック
    LOAD_IMM_A 0x0204          # 0x0180: A = &memory_address
    LOAD_REG A, A              # 0x0183: A = memory_address
    LOAD_IMM_B 0x0202          # 0x0185: B = &memory_size
    LOAD_REG B, B              # 0x0188: B = memory_size
    CMP_AB                     # 0x018A: flags = A - B
    JG copy_done               # 0x018B: if A > B goto copy_done

    # write_computer_memory(1, memory_address, read_my_memory(memory_address))
    LOAD_IMM_A 0x0204          # 0x018E: A = &memory_address
    LOAD_REG A, A              # 0x0191: A = memory_address
    LOAD_REG B, A              # 0x0193: B = memory[memory_address]
    LOAD_IMM_D 0x0001          # 0x0195: D = 1 (computer_index)
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x0198: COMPUTER[D].write_address = A
    UNIT_MEM_WRITE_REG COMPUTER, 0x03  # 0x019B: COMPUTER[D].write_value = B
    UNIT_MEM_WRITE_REG COMPUTER, 0x04  # 0x019E: COMPUTER[D].write_request = 1

    # memory_address++
    LOAD_IMM_A 0x0204          # 0x01A1: A = &memory_address
    LOAD_REG B, A              # 0x01A4: B = memory_address
    LOAD_IMM_A 0x0001          # 0x01A6: A = 1
    ADD_AB                     # 0x01A9: A = B + 1
    LOAD_IMM_B 0x0204          # 0x01AA: B = &memory_address
    STORE_REG B, A             # 0x01AD: memory_address = A
    JMP copy_loop              # 0x01AF: goto copy_loop

copy_done:                     # 0x01B2
    # write_computer_memory(1, 0, ASSEMBLER_NOP0)
    LOAD_IMM_D 0x0001          # 0x01B2: D = 1
    LOAD_IMM_A 0x0000          # 0x01B5: A = 0 (address)
    LOAD_IMM_B 0x0000          # 0x01B8: B = ASSEMBLER_NOP0
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x01BB: COMPUTER[D].write_address = A
    UNIT_MEM_WRITE_REG COMPUTER, 0x03  # 0x01BE: COMPUTER[D].write_value = B
    UNIT_MEM_WRITE_REG COMPUTER, 0x04  # 0x01C1: COMPUTER[D].write_request = 1

    # detach(0, HULL, child_hull_index)
    LOAD_IMM_D 0x0000          # 0x01C4: D = 0
    LOAD_IMM_B 0x0001          # 0x01C7: B = HULL
    LOAD_IMM_A 0x0200          # 0x01CA: A = &child_hull_index
    LOAD_IND_REG C, A          # 0x01CD: C = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x01D0: HULL[D].detach_unit_type = B
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x01D3: HULL[D].detach_unit_index = C
    UNIT_MEM_WRITE_REG HULL, 0x08  # 0x01D6: HULL[D].detach_action = 1

    JMP reproduction_loop      # 0x01D9: goto reproduction_loop

# === テンプレート領域 ===
template_CC:                   # 0x01DC
    NOP0                       # 0x01DC: 11001100
    NOP0                       # 0x01DD: 11001100
    NOP0                       # 0x01DE: 11001100
    NOP0                       # 0x01DF: 11001100
    NOP1                       # 0x01E0: 00110011
    NOP1                       # 0x01E1: 00110011
    NOP1                       # 0x01E2: 00110011
    NOP1                       # 0x01E3: 00110011
```

## 主な改善点

1. **16bitアドレス空間**: 64KBまでのメモリアドレスをサポート
2. **レジスタベースアドレッシング**: 動的なメモリアクセスとユニット操作が可能
3. **効率的な変数管理**: 16bit変数を専用メモリ領域に配置
4. **動的ユニット操作**: Dレジスタを使用した動的ユニットインデックス指定
5. **間接アドレッシング**: LOAD_IND_REG命令による変数の間接参照

## エネルギーコスト概算

- プログラムサイズ: 約484バイト (0x01E4)
- 基本エネルギー消費: 約600E/サイクル（成長・複製フェーズ合計）
- メモリコピー時追加消費: 約3E/バイト × コード長

## 注意事項

- ユニットメモリマップは仮定値（実際の仕様に応じて調整が必要）
- エラー処理は最小限（生成失敗時のdetachのみ）
- テンプレートサーチは簡略化（実際の実装では最大検索距離の考慮が必要）