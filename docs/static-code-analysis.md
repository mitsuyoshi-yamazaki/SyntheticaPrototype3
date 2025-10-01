# 静的コード解析設定ガイド

## このファイルについて

このファイルは新しいTypeScript/Next.jsプロジェクトで高品質な静的コード解析を設定するためのガイドです。AIアシスタントと協力してプロジェクトセ
ットアップを行う際に、このファイルを参照して適切なツール設定を行うことを目的としています。

## Claudeへの指示

- 本プロジェクトではtsc、ESLint、Prettierは既に設定済みである
- 実装ファイルに変更を加えた際は、これらのツールによる静的解析を通すこと
- その上で、本ファイルに記載された設定内容に従うこと

## 必須ツールとパッケージ

### ESLint関連

```bash
# 基本パッケージ
yarn add -D eslint @eslint/js
yarn add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
yarn add -D @eslint/eslintrc

# Next.js用
yarn add -D eslint-config-next

# Prettier統合
yarn add -D prettier eslint-config-prettier
```

### TypeScript

```bash
yarn add -D typescript @types/node
```

## ESLint設定（eslint.config.mjs）

以下の設定をeslint.config.mjsに適用する：

### 必須ルールセット

1. **JavaScript基本ルール**

- `js.configs.recommended`

2. **TypeScript厳格ルール**

- `tseslint.configs.strict`
- `tseslint.configs["recommended-type-checked"]`
- `tseslint.configs["stylistic-type-checked"]`

3. **フレームワーク固有ルール**

- Next.js: `next/core-web-vitals`, `next/typescript`
- React: プロジェクトに応じて追加

4. **フォーマッタ統合**

- `prettier` (ESLintとPrettierの競合回避)

### 推奨カスタムルール

```javascript
rules: {
  // 基本的なコード品質
  "prefer-const": "error",
  "no-var": "error",
  "eqeqeq": ["error", "always", { null: "ignore" }],
  "curly": "error",

  // TypeScript固有
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/prefer-function-type": "error",
  "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/explicit-member-accessibility": "error",

  // 関数定義
  "prefer-arrow-callback": "error",

  // 厳格な真偽値チェック
  "@typescript-eslint/strict-boolean-expressions": [
    "error",
    {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowNullableEnum: false,
      allowAny: false,
    },
  ],
}
```

## TypeScript設定（tsconfig.json）

### 必須コンパイラオプション

```json
{
  "compilerOptions": {
    // 基本設定
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,

    // 型チェック強化
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,

    // 未使用コード検出
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // より厳密な型チェック
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // 到達不能コード検出
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

## Prettier設定（.prettierrc）

### 推奨設定

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## package.jsonスクリプト

```json
{
  "scripts": {
    "lint": "next lint", // または "eslint ."
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}
```

## 設定時の注意事項

### 1. 段階的導入

厳格なルールは段階的に導入することを推奨：

1. 基本ルール（recommended）から開始
2. strict/type-checkedルールを追加
3. プロジェクト固有のカスタムルールを追加

### 2. 既存プロジェクトへの適用

既存プロジェクトに適用する場合：

1. `yarn lint`でエラーを確認
2. 一つずつエラーを修正
3. 修正困難なルールは一時的に無効化も検討

### 3. フレームワーク固有の調整

- **Next.js**: `next/core-web-vitals`, `next/typescript`
- **React**: `@typescript-eslint/recommended-requiring-type-checking`
- **Node.js**: `@typescript-eslint/recommended`

## AIアシスタントへの指示例

```
このプロジェクトで静的コード解析を設定してください。
docs/static-code-analysis.mdの設定に従って、以下を実装してください：

1. ESLintの設定（js.configs.recommended, TypeScript strict rules含む）
2. TypeScriptの厳格な型チェック設定
3. Prettierとの統合
4. 必要なパッケージのインストール
5. package.jsonスクリプトの追加

エラーが発生した場合は修正もお願いします。
```

## ツール間の相互作用

- **ESLint + TypeScript**: 型チェックと合わせてコード品質を向上
- **ESLint + Prettier**: フォーマットの競合を避けるため、eslint-config-prettierで調整
- **IDE統合**: VS Code等のエディタでリアルタイム検証を活用

## トラブルシューティング

### よくあるエラーと対処法

ESLintルールに関するエラーについては、ESLintの公式ドキュメントを参照してください。

ここには、tsconfigやESLintの導入・設定に関して特に対処法を記述すべき問題がある場合に記載します。

現在、特に記載すべき問題はありません。
