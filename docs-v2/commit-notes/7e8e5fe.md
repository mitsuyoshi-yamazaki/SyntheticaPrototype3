# コミットノート: 7e8e5fe

## ユーザー指示

各テストケースでspのexpected値が正しいか確認し、誤っているものがあれば修正せよ

例えば、 PUSH_A実行 - 16bit値のプッシュ のテストケースのように、spのexpected値が、実装修正前のVMState初期化時の値 0xffff を元にしているテストケースがある

## 実施内容

VM命令テストのsp期待値を確認し、誤っていた箇所を修正：

1. PUSH命令（PUSH_A, PUSH_B, PUSH_C, PUSH_D）のsp期待値修正
   - VMState(0x100)の場合、sp初期値は0xff
   - 実行前: sp=0x0f → sp=0xff に修正
   - 実行後: sp=0xfffd → sp=0xfd に修正
   - メモリアドレス: 0xfffd/0xfffe → 0xfd/0xfe に修正

2. POP命令（POP_A, POP_B, POP_C, POP_D）のsp期待値修正
   - PUSH後のsp: 0xfffd → 0xfd に修正
   - POP後のsp: 0xff（変更なし、正しい）

3. CALL命令のsp期待値修正
   - 実行前: sp=0x0f → sp=0xff に修正
   - 実行後: sp=0x0f → sp=0xff に修正

4. 他のVMState初期化パターンを確認
   - VMState(0x10)の場合: sp=0x0f（正しい）
   - VMState(0x0a)の場合: sp=0x09（正しい）

これにより、すべてのテストケースでsp期待値が正しく設定されるようになった。