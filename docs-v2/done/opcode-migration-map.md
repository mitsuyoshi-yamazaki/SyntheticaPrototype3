# Opcode Migration Map

This file documents the mapping from old opcodes to new opcodes following the specification.

## Changes Made

### 3-byte instructions (immediate values moved to 5-byte)

- OLD 0x70 MOV_A_IMM → NEW 0xE0 LOAD_IMM (5-byte)
- OLD 0x71 MOV_B_IMM → NEW 0xE1 LOAD_IMM_B (5-byte)
- OLD 0x72 MOV_C_IMM → REMOVED (not in spec)
- OLD 0x73 MOV_D_IMM → REMOVED (not in spec)
- OLD 0x74 ADD_A_IMM → REMOVED (not in spec)
- OLD 0x75 SUB_A_IMM → REMOVED (not in spec)
- OLD 0x76 AND_A_IMM → REMOVED (not in spec)
- OLD 0x77 OR_A_IMM → REMOVED (not in spec)
- OLD 0x78 XOR_A_IMM → REMOVED (not in spec)
- OLD 0x79 CMP_A_IMM → REMOVED (not in spec)

### 4-byte instructions (opcodes changed)

- OLD 0x80 LOAD_ABS → NEW 0xA0 LOAD_ABS
- OLD 0x81 STORE_ABS → NEW 0xA1 STORE_ABS
- OLD 0x82 LOAD_ABS_W → NEW 0xA2 LOAD_ABS_W
- OLD 0x83 STORE_ABS_W → NEW 0xA3 STORE_ABS_W
- OLD 0x90 JMP_ABS → NEW 0xB1 JMP_ABS
- OLD 0x91 CALL_ABS → REMOVED (not in spec, use CALL instead)
- OLD 0xA0 UNIT_MEM_READ → NEW 0x90 UNIT_MEM_READ
- OLD 0xA1 UNIT_MEM_WRITE → NEW 0x91 UNIT_MEM_WRITE

### 5-byte instructions (opcodes changed)

- OLD 0xC0 (not used) → NEW 0xC0 MUL_AB
- OLD 0xC1 (not used) → NEW 0xC1 DIV_AB
- OLD 0xC2 (was used for SCANM?) → NEW 0xC2 SHL
- OLD 0xC3 ASSEMBLE → REMOVED (not in core instruction set)
- OLD 0xD0 MUL_AB → NEW 0xC0 MUL_AB
- OLD 0xD1 DIV_AB → NEW 0xC1 DIV_AB
- OLD 0xD2 SHL → NEW 0xC2 SHL
- OLD 0xD3 SHR → NEW 0xC3 SHR

### 3-byte instructions (RET changed)

- OLD 0x66 RET (3-byte) → NEW 0xB2 RET (4-byte)

### Added new instructions

- 0x52 LOAD_IND_REG
- 0x53 STORE_IND_REG
- 0x66-0x69 JG, JLE, JGE, JL
- 0x80-0x83 SEARCH_F, SEARCH_B, etc.
- 0x92-0x94 Advanced unit operations
- 0x95-0x99, 0x9B Energy and unit operations
- 0xC4 SAR
- 0xC5-0xC8 CMOV\_\*
- 0xF0 NOP5
