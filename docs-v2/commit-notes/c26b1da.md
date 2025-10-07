# c26b1da のコミットノート

## ユーザープロンプト

docs/spec-v3/synthetica-script.md に仕様を記載した命令セットの各命令のテストを src/engine/vm-instructions.test.ts に記載している（このファイルは行数が多いため、読み込む際はルートレベルにあるそれぞれの命令の describe() （ `describe("0xc8 CMOV_NC"` など）で検索して読み込むようにせよ）に記載している。

命令セットのテストは src/engine/vm-bitwise.test.ts にも記述があるので、vm-instructions.test.ts へ統合したい
vm-instructions.test.ts に記載のない条件のテストケースがあれば、 vm-instructions.test.ts へ追加せよ。また、追加する際は vm-instructions.test.ts 冒頭のコメント（ `/*〜*/` ）に記載のテスト実装方法に従って書き直せ

実装の変更はせず、命令の仕様は仕様書のみを確認せよ。質問があれば私に聞け

## 実施内容

1. vm-bitwise.test.tsとvm-instructions.test.tsの内容を比較分析
2. 仕様書を確認し、0x76-0x78の命令が存在しないことを確認
3. vm-instructions.test.tsに追加すべきテストケースを特定
4. 以下のテストケースをvm-instructions.test.tsに追加：
   - XOR_AB: 「同じ値でゼロ」とビット反転パターンのテスト
   - AND_AB: ビットマスク（特定ビットクリア）とビットテストのテスト
   - OR_AB: ビットマスク（特定ビットセット）のテスト
   - NOT_A: 「ゼロの否定」のテスト
5. vm-bitwise.test.tsから統合済みテストを削除（コメントのみ残す）
