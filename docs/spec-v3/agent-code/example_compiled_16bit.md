# example.c の16bit Synthetica Scriptコンパイル結果

## このファイルについて

- `example.c` のC言語コードを16bit Synthetica Scriptへコンパイルした結果
- 16bitアーキテクチャ仕様に基づく実装
- 最新のユニット操作メモリ領域仕様に準拠

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
  0x0206: temp_value (16bit) - 一時変数
0x0300-0x03FF: スタック領域（未使用）
0x0400-0xFFFF: 予約領域
```

## 定数定義

```
# ユニット種別
NONE                = 0x0000
HULL                = 0x0001
ASSEMBLER           = 0x0002
DISASSEMBLER        = 0x0003
COMPUTER            = 0x0004
UNIT_INDEX_NONE     = 0x00FF

# 容量・パラメータ定数
REPRODUCTION_HULL_CAPACITY  = 0x00C8  # 200
EXPAND_HULL_CAPACITY        = 0x0014  # 20
CHILD_HULL_CAPACITY         = 0x0064  # 100
CHILD_ASSEMBLER_POWER       = 0x0014  # 20
CHILD_COMPUTER_CPU_FREQUENCY = 0x000A  # 10
CHILD_COMPUTER_MEMORY_SIZE  = 0x0100  # 256

# オペコード定数
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
    JG growth_done             # 0x000A: if A > B goto growth_done

    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x000D: D = 0 (assembler_index = 0)
    LOAD_IMM_A 0x0001          # 0x0010: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x0E  # 0x0013: ASSEMBLER[D].reset_flag = True

    # assemble(0, HULL, UNIT_INDEX_NONE, EXPAND_HULL_CAPACITY)
    LOAD_IMM_A 0x0001          # 0x0016: A = HULL
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x0019: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x001C: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x001F: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0014          # 0x0022: A = EXPAND_HULL_CAPACITY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x02  # 0x0025: ASSEMBLER[D].param1 = A (capacity)
    LOAD_IMM_A 0x0001          # 0x0028: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x08  # 0x002B: ASSEMBLER[D].production_state = True

assemble_wait_1:               # 0x002E
    # while (is_assembling(0))
    LOAD_IMM_D 0x0000          # 0x002E: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x08  # 0x0031: A = ASSEMBLER[D].production_state
    LOAD_IMM_B 0x0001          # 0x0034: B = 1 (True)
    CMP_AB                     # 0x0037: flags = A - B
    JE assemble_wait_1         # 0x0038: if A == 1 goto assemble_wait_1

    # if (get_last_assembled_unit_type(0) == HULL)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0C  # 0x003B: A = ASSEMBLER[D].last_assembled_type
    LOAD_IMM_B 0x0001          # 0x003E: B = HULL
    CMP_AB                     # 0x0041: flags = A - B
    JNE skip_merge             # 0x0042: if A != B goto skip_merge

    # merge_hull(get_last_assembled_unit_index(0), 0)
    # 両方のHULLで相互指定が必要
    UNIT_MEM_READ_REG ASSEMBLER, 0x0D  # 0x0045: A = ASSEMBLER[D].last_assembled_index
    MOVE_AD                    # 0x0048: D = A (新HULL index)
    LOAD_IMM_A 0x0000          # 0x0049: A = 0 (メインHULL index)
    UNIT_MEM_WRITE_REG HULL, 0x04  # 0x004C: HULL[D].merge_target = 0
    
    LOAD_IMM_D 0x0000          # 0x004F: D = 0 (メインHULL)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0D  # 0x0052: A = last_assembled_index
    UNIT_MEM_WRITE_REG HULL, 0x04  # 0x0055: HULL[0].merge_target = A

skip_merge:                     # 0x0058
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x0058: D = 0
    LOAD_IMM_A 0x0001          # 0x005B: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x0E  # 0x005E: ASSEMBLER[D].reset_flag = True

    JMP growth_loop            # 0x0061: goto growth_loop

# === 自己複製ループ ===
growth_done:                   # 0x0064
reproduction_loop:             # 0x0064
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x0064: D = 0
    LOAD_IMM_A 0x0001          # 0x0067: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x0E  # 0x006A: ASSEMBLER[D].reset_flag = True

    # assemble(0, HULL, UNIT_INDEX_NONE, CHILD_HULL_CAPACITY)
    LOAD_IMM_A 0x0001          # 0x006D: A = HULL
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x0070: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x0073: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x0076: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0064          # 0x0079: A = CHILD_HULL_CAPACITY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x02  # 0x007C: ASSEMBLER[D].param1 = A
    LOAD_IMM_A 0x0001          # 0x007F: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x08  # 0x0082: ASSEMBLER[D].production_state = True

assemble_wait_2:               # 0x0085
    LOAD_IMM_D 0x0000          # 0x0085: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x08  # 0x0088: A = ASSEMBLER[D].production_state
    LOAD_IMM_B 0x0001          # 0x008B: B = 1 (True)
    CMP_AB                     # 0x008E: flags = A - B
    JE assemble_wait_2         # 0x008F: if A == 1 goto assemble_wait_2

    # if (get_last_assembled_unit_type(0) != HULL)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0C  # 0x0092: A = ASSEMBLER[D].last_assembled_type
    LOAD_IMM_B 0x0001          # 0x0095: B = HULL
    CMP_AB                     # 0x0098: flags = A - B
    JE save_child_hull         # 0x0099: if A == B goto save_child_hull

    # detach失敗した生成物
    UNIT_MEM_READ_REG ASSEMBLER, 0x0C  # 0x009C: A = last_assembled_type
    UNIT_MEM_READ_REG ASSEMBLER, 0x0D  # 0x009F: B = last_assembled_index (Aに読み込んだ後Bに移動)
    MOVE_AB                    # 0x00A2: B = last_assembled_index
    LOAD_IMM_D 0x0000          # 0x00A3: D = 0 (hull_index)
    UNIT_MEM_WRITE_REG HULL, 0x05  # 0x00A6: HULL[D].detach_unit_type = A
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x00A9: HULL[D].detach_unit_index = B
    LOAD_IMM_A 0x0001          # 0x00AC: A = 1 (True)
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x00AF: HULL[D].detach_action = True
    JMP reproduction_loop      # 0x00B2: continue

save_child_hull:               # 0x00B5
    # child_hull_index = get_last_assembled_unit_index(0)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0D  # 0x00B5: A = last_assembled_index
    STORE_IMM_A 0x0200         # 0x00B8: child_hull_index = A

    # === 娘ASSEMBLER作成 ===
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x00BB: D = 0
    LOAD_IMM_A 0x0001          # 0x00BE: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x0E  # 0x00C1: ASSEMBLER[D].reset_flag = True

    # assemble(0, ASSEMBLER, UNIT_INDEX_NONE, CHILD_ASSEMBLER_POWER)
    LOAD_IMM_A 0x0002          # 0x00C4: A = ASSEMBLER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x00C7: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x00CA: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x00CD: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x0014          # 0x00D0: A = CHILD_ASSEMBLER_POWER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x02  # 0x00D3: ASSEMBLER[D].param1 = A
    LOAD_IMM_A 0x0001          # 0x00D6: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x08  # 0x00D9: ASSEMBLER[D].production_state = True

assemble_wait_3:               # 0x00DC
    LOAD_IMM_D 0x0000          # 0x00DC: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x08  # 0x00DF: A = ASSEMBLER[D].production_state
    LOAD_IMM_B 0x0001          # 0x00E2: B = 1 (True)
    CMP_AB                     # 0x00E5: flags = A - B
    JE assemble_wait_3         # 0x00E6: if A == 1 goto assemble_wait_3

    # if (get_last_assembled_unit_type(0) != ASSEMBLER)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0C  # 0x00E9: A = last_assembled_type
    LOAD_IMM_B 0x0002          # 0x00EC: B = ASSEMBLER
    CMP_AB                     # 0x00EF: flags = A - B
    JE create_computer         # 0x00F0: if A == B goto create_computer

    # detach失敗時の処理
    LOAD_IMM_D 0x0000          # 0x00F3: D = 0
    LOAD_IMM_A 0x0001          # 0x00F6: A = HULL
    UNIT_MEM_WRITE_REG HULL, 0x05  # 0x00F9: HULL[D].detach_unit_type = A
    LOAD_IMM_A 0x0200          # 0x00FC: A = &child_hull_index
    LOAD_REG A, A              # 0x00FF: A = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x0101: HULL[D].detach_unit_index = A
    LOAD_IMM_A 0x0001          # 0x0104: A = 1 (True)
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x0107: HULL[D].detach_action = True
    JMP reproduction_loop      # 0x010A: continue

create_computer:               # 0x010D
    # === 娘COMPUTER作成 ===
    # reset_last_assembled_unit(0)
    LOAD_IMM_D 0x0000          # 0x010D: D = 0
    LOAD_IMM_A 0x0001          # 0x0110: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x0E  # 0x0113: ASSEMBLER[D].reset_flag = True

    # assemble(0, COMPUTER, UNIT_INDEX_NONE, CHILD_COMPUTER_CPU_FREQUENCY, CHILD_COMPUTER_MEMORY_SIZE)
    LOAD_IMM_A 0x0004          # 0x0116: A = COMPUTER
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x00  # 0x0119: ASSEMBLER[D].unit_type = A
    LOAD_IMM_A 0x00FF          # 0x011C: A = UNIT_INDEX_NONE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x01  # 0x011F: ASSEMBLER[D].connect_hull_index = A
    LOAD_IMM_A 0x000A          # 0x0122: A = CHILD_COMPUTER_CPU_FREQUENCY
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x02  # 0x0125: ASSEMBLER[D].param1 = A
    LOAD_IMM_A 0x0100          # 0x0128: A = CHILD_COMPUTER_MEMORY_SIZE
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x03  # 0x012B: ASSEMBLER[D].param2 = A
    LOAD_IMM_A 0x0001          # 0x012E: A = 1 (True)
    UNIT_MEM_WRITE_REG ASSEMBLER, 0x08  # 0x0131: ASSEMBLER[D].production_state = True

assemble_wait_4:               # 0x0134
    LOAD_IMM_D 0x0000          # 0x0134: D = 0
    UNIT_MEM_READ_REG ASSEMBLER, 0x08  # 0x0137: A = ASSEMBLER[D].production_state
    LOAD_IMM_B 0x0001          # 0x013A: B = 1 (True)
    CMP_AB                     # 0x013D: flags = A - B
    JE assemble_wait_4         # 0x013E: if A == 1 goto assemble_wait_4

    # if (get_last_assembled_unit_type(0) != COMPUTER)
    UNIT_MEM_READ_REG ASSEMBLER, 0x0C  # 0x0141: A = last_assembled_type
    LOAD_IMM_B 0x0004          # 0x0144: B = COMPUTER
    CMP_AB                     # 0x0147: flags = A - B
    JE copy_memory             # 0x0148: if A == B goto copy_memory

    # detach失敗時の処理
    LOAD_IMM_D 0x0000          # 0x014B: D = 0
    LOAD_IMM_A 0x0001          # 0x014E: A = HULL
    UNIT_MEM_WRITE_REG HULL, 0x05  # 0x0151: HULL[D].detach_unit_type = A
    LOAD_IMM_A 0x0200          # 0x0154: A = &child_hull_index
    LOAD_REG A, A              # 0x0157: A = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x0159: HULL[D].detach_unit_index = A
    LOAD_IMM_A 0x0001          # 0x015C: A = 1 (True)
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x015F: HULL[D].detach_action = True
    JMP reproduction_loop      # 0x0162: continue

copy_memory:                   # 0x0165
    # === 娘COMPUTERへのメモリ書き込み ===
    # 最後に生産したユニットのindex（娘COMPUTER）を取得
    UNIT_MEM_READ_REG ASSEMBLER, 0x0D  # 0x0165: A = last_assembled_index
    STORE_IMM_A 0x0206         # 0x0168: temp_value = A (computer_index)
    
    # write_computer_memory(computer_index, 0, ASSEMBLER_JMP)
    LOAD_IMM_A 0x0206          # 0x016B: A = &temp_value
    LOAD_REG A, A              # 0x016E: A = computer_index
    MOVE_AD                    # 0x0170: D = computer_index
    LOAD_IMM_A 0x0000          # 0x0171: A = 0 (memory_address)
    UNIT_MEM_WRITE_REG COMPUTER, 0x01  # 0x0174: COMPUTER[D].memory_address = A
    LOAD_IMM_A 0x0060          # 0x0177: A = ASSEMBLER_JMP
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x017A: COMPUTER[D].memory_value = A

    # JMP命令の次バイトに0を書き込む（自己ループ）
    LOAD_IMM_A 0x0001          # 0x017D: A = 1 (memory_address)
    UNIT_MEM_WRITE_REG COMPUTER, 0x01  # 0x0180: COMPUTER[D].memory_address = A
    LOAD_IMM_A 0x0000          # 0x0183: A = 0
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x0186: COMPUTER[D].memory_value = A

    # memory_size = search_template(0xCC)
    TEMPLATE_SEARCH 0xCC       # 0x0189: A = template_CC address
    STORE_IMM_A 0x0202         # 0x018C: memory_size = A

    # for (memory_address = 2; memory_address <= memory_size; memory_address++)
    LOAD_IMM_A 0x0002          # 0x018F: A = 2
    STORE_IMM_A 0x0204         # 0x0192: memory_address = A

copy_loop:                     # 0x0195
    # memory_address <= memory_size のチェック
    LOAD_IMM_A 0x0204          # 0x0195: A = &memory_address
    LOAD_REG A, A              # 0x0198: A = memory_address
    LOAD_IMM_B 0x0202          # 0x019A: B = &memory_size
    LOAD_REG B, B              # 0x019D: B = memory_size
    CMP_AB                     # 0x019F: flags = A - B
    JG copy_done               # 0x01A0: if A > B goto copy_done

    # read_my_memory(memory_address)
    LOAD_IMM_A 0x0204          # 0x01A3: A = &memory_address
    LOAD_REG A, A              # 0x01A6: A = memory_address
    LOAD_REG B, A              # 0x01A8: B = memory[memory_address]
    
    # write_computer_memory(computer_index, memory_address, value)
    LOAD_IMM_A 0x0206          # 0x01AA: A = &temp_value
    LOAD_REG A, A              # 0x01AD: A = computer_index
    MOVE_AD                    # 0x01AF: D = computer_index
    LOAD_IMM_A 0x0204          # 0x01B0: A = &memory_address
    LOAD_REG A, A              # 0x01B3: A = memory_address
    UNIT_MEM_WRITE_REG COMPUTER, 0x01  # 0x01B5: COMPUTER[D].memory_address = A
    MOVE_BA                    # 0x01B8: A = B (value)
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x01B9: COMPUTER[D].memory_value = A

    # memory_address++
    LOAD_IMM_A 0x0204          # 0x01BC: A = &memory_address
    LOAD_REG B, A              # 0x01BF: B = memory_address
    LOAD_IMM_A 0x0001          # 0x01C1: A = 1
    ADD_AB                     # 0x01C4: A = B + 1
    LOAD_IMM_B 0x0204          # 0x01C5: B = &memory_address
    STORE_REG B, A             # 0x01C8: memory_address = A
    JMP copy_loop              # 0x01CA: goto copy_loop

copy_done:                     # 0x01CD
    # write_computer_memory(computer_index, 0, ASSEMBLER_NOP0)
    LOAD_IMM_A 0x0206          # 0x01CD: A = &temp_value
    LOAD_REG A, A              # 0x01D0: A = computer_index
    MOVE_AD                    # 0x01D2: D = computer_index
    LOAD_IMM_A 0x0000          # 0x01D3: A = 0 (address)
    UNIT_MEM_WRITE_REG COMPUTER, 0x01  # 0x01D6: COMPUTER[D].memory_address = A
    LOAD_IMM_A 0x0000          # 0x01D9: A = ASSEMBLER_NOP0
    UNIT_MEM_WRITE_REG COMPUTER, 0x02  # 0x01DC: COMPUTER[D].memory_value = A

    # detach(0, HULL, child_hull_index)
    LOAD_IMM_D 0x0000          # 0x01DF: D = 0
    LOAD_IMM_A 0x0001          # 0x01E2: A = HULL
    UNIT_MEM_WRITE_REG HULL, 0x05  # 0x01E5: HULL[D].detach_unit_type = A
    LOAD_IMM_A 0x0200          # 0x01E8: A = &child_hull_index
    LOAD_REG A, A              # 0x01EB: A = child_hull_index
    UNIT_MEM_WRITE_REG HULL, 0x06  # 0x01ED: HULL[D].detach_unit_index = A
    LOAD_IMM_A 0x0001          # 0x01F0: A = 1 (True)
    UNIT_MEM_WRITE_REG HULL, 0x07  # 0x01F3: HULL[D].detach_action = True

    JMP reproduction_loop      # 0x01F6: goto reproduction_loop

# === テンプレート領域 ===
template_CC:                   # 0x01F9
    NOP0                       # 0x01F9: 11001100
    NOP0                       # 0x01FA: 11001100
    NOP0                       # 0x01FB: 11001100
    NOP0                       # 0x01FC: 11001100
    NOP1                       # 0x01FD: 00110011
    NOP1                       # 0x01FE: 00110011
    NOP1                       # 0x01FF: 00110011
    NOP1                       # 0x0200: 00110011
```

## 主な変更点（現在の仕様への対応）

1. **HULL操作**
   - 容量読み取り: 0x00アドレス
   - マージ: 0x04アドレスで相互指定方式
   - 分離: 0x05-0x07アドレス

2. **ASSEMBLER操作**
   - 生産状態: 0x08アドレス（True=生産中、False=完了/待機）
   - 最後の生産情報: 0x0C-0x0Dアドレス
   - リセット: 0x0Eアドレス

3. **COMPUTER操作**
   - メモリアドレス指定: 0x01アドレス
   - メモリ値読み書き: 0x02アドレス
   - 外部書き換え許可: 0x00アドレス（デフォルトTrue）

## エネルギーコスト概算

- プログラムサイズ: 約512バイト (0x0200)
- 基本エネルギー消費: 約700E/サイクル（成長・複製フェーズ合計）
- メモリコピー時追加消費: 約3E/バイト × コード長

## 注意事項

- ユニットインデックスは固定値を仮定（HULL=0, ASSEMBLER=0, 新規COMPUTER=1）
- エラー処理は最小限（生成失敗時のdetachのみ）
- マージ操作は両HULLでの相互指定が必要
- 外部COMPUTERへの書き込みは許可状態を前提