# cc2ffb9dcab9ac9a0a5ad98c5040fc736e5f38b7

## ユーザープロンプト

Find all if, for, while, and do-while statements without curly braces in TypeScript files under the src/ directory and fix them by adding curly braces. Use the Grep tool to find patterns like "if (" followed by no "{" on the same line, etc. Then use MultiEdit to fix all occurrences in each file.

## 実行内容

TypeScriptコードベースで中括弧が省略されているif/for/while文を検索し、すべてに中括弧を追加：

1. **検索対象パターン**:
   - `if (condition) statement` → `if (condition) { statement }`
   - 主にcontinue/return/breakを伴う単一行if文

2. **修正したファイル**:
   - `src/utils/torus-math.ts`: 4箇所のif文
   - `src/utils/vec2.ts`: 2箇所のif文  
   - `src/engine/energy-system.ts`: 3箇所のif文
   - `src/engine/energy-collector.ts`: 3箇所のif文
   - `src/engine/heat-system.ts`: 5箇所のif文
   - `src/engine/energy-system.test.ts`: 1箇所のif文

3. **検証**:
   - 全345個のテストが正常に通ることを確認
   - Prettierによるコード整形を実行
   - ESLintエラーなしを確認

コードスタイルの一貫性向上とベストプラクティスの適用を実現。