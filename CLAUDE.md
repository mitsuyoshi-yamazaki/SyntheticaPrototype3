# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

SyntheticaPrototype2は、自律エージェントが環境中で活動するMMOゲームのプロトタイプです。プレイヤーが作成したエージェントを観察し、オープンエンドな進化を実現することを目的としています。

## アーキテクチャ

- **フロントエンド**: Next.js + TypeScript + p5.js + Tailwind CSS
- **デプロイ**: Vercel（静的HTML）
- **テスト**: Jest
- **リント**: ESLint
- **フォーマッタ**: Prettier
- **パッケージ管理**: yarn

## 開発コマンド

```bash
# 依存関係インストール
yarn install

# 開発サーバー起動
yarn dev

# ビルド
yarn build

# 静的エクスポート
yarn export

# テスト実行
yarn test

# テスト（ウォッチモード）
yarn test:watch

# リント実行
yarn lint

# フォーマット実行
yarn format

# フォーマットチェック
yarn format:check
```

## プロジェクト構造

```
/docs/                      # プロジェクト資料
├── requirements.md         # アプリケーション要件
├── game-world-requirements.md  # ゲーム仕様（作成中）
├── coding-guidelines.md    # コーディング規約
├── static-code-analysis.md # 静的コード解析設定ガイド
├── vibe-coding-guide.md    # AIアシスタント利用ガイド
└── commit-notes/           # コミットノート（各コミットの指示記録）

/src/                       # ソースコード
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # メインページ
│   └── globals.css        # グローバルスタイル
├── components/             # Reactコンポーネント
│   └── GameCanvas.tsx     # p5.jsゲームキャンバス
├── lib/                    # ライブラリ・ユーティリティ
│   ├── GameWorld.ts       # ゲーム世界クラス
│   └── GameWorld.test.ts  # GameWorldテスト
└── types/                  # TypeScript型定義

設定ファイル:
├── next.config.js         # Next.js設定（静的エクスポート）
├── tsconfig.json          # TypeScript設定
├── tailwind.config.js     # Tailwind CSS設定
├── jest.config.js         # Jest設定
├── eslint.config.mjs      # ESLint設定（Flat Config）
├── .prettierrc            # Prettier設定
└── .prettierignore        # Prettierで除外するファイル
```

## コミットワークフロー

**重要**: 以下のワークフローを必ず実行すること

1. **ユーザー指示を受けてファイルを変更した場合**、変更完了後に必ず以下を実行：
   - 変更をgit addしてコミット（「🤖 Generated with [Claude Code]」を含むコミットメッセージ付き）
   - **AIによるコミットの場合のみ**以下を実行：
     - コミットハッシュを取得
     - `docs/commit-notes/<コミットハッシュ>.md`ファイルを作成
       - 内容：そのコミットを生み出したユーザープロンプト（指示）を記載
     - 「<コミットハッシュ>のコミットノートを作成」メッセージでコミット

2. **コミット識別**:
   - **AIコミット**: 必ず「🤖 Generated with [Claude Code]」を含む → コミットノート作成
   - **ユーザーコミット**: この文言を含まない → コミットノート作成なし

3. **1コミット = 1ユーザー指示**の原則を厳守

4. **ユーザーからの明示的なコミット指示は不要** - ファイル変更があれば自動実行

## GitHub Issue/PR作成時の識別

**重要**: GitHub issue/PR作成時は以下を必ず実行すること

1. **タイトルに識別子追加**: `[Claude] <元のタイトル>`
2. **本文末尾に識別子追加**: `🤖 Created by Claude Code`
3. **専用ラベル適用**: `claude-created` ラベルを追加
4. **例**:
   ```bash
   gh issue create --title "[Claude] 機能追加" --body "内容...\n\n🤖 Created by Claude Code" --label "claude-created"
   ```

## 開発ルール

### コーディング規約（docs/coding-guidelines.md より）

- Nominal Typeを積極使用
- 変数・メンバはimmutable推奨
- 関数定義は`const`を優先（`function`ではなく）
- Enumは使わず、Literal Union型またはDiscriminated Union型を使用
- private変数は`_`プレフィックス
- ドキュメント・コメント・テストは日本語

### テスト

- テストファイル: `<対象ファイル名>.test.ts`
- `it()`ではなく`test()`を使用

## ゲーム仕様概要

- **世界**: 2Dトーラス、連続座標系、離散時間
- **エージェント**: 複数ユニットの組み合わせで構成
- **ユニット種別**: HULL, ASSEMBLER, DISASSEMBLER, CONNECTOR, COMPUTER, SENSOR, MOVER
- **資源システム**: 質量保存の原則
- **物理**: 衝突検出、力学計算

## 実装状況

### 完了済み

- ✅ Next.js + TypeScript + Tailwind CSSの基本セットアップ
- ✅ p5.jsインスタンスモード統合
- ✅ GameWorldクラス基本実装
- ✅ GameCanvasコンポーネント（ゲームループ付き）
- ✅ Jest + ESLint + Prettierによるテスト・品質管理環境
- ✅ 静的エクスポート設定

### 技術仕様

- p5.js `draw()`ごとに指定tick数だけゲーム進行
- ゲームロジック（GameWorld）と描画（p5.js）の分離
- 1ゲーム座標 = 1ピクセル（将来的にズーム機能予定）
- Reactコンポーネントでのゲーム外UI

## CI/CD

- GitHub Actions設定（PRでのテスト実行）
- 自動デプロイは現状未設定

## 設定

- Claude Code権限: bash操作、GitHub CLI
- GitHubリポジトリ: `git@github.com:mitsuyoshi-yamazaki/SyntheticaPrototype2.git`

## Claude Code通知音設定

Claudeがタスクを実行する際の音声通知：

- **タスク中断時**（確認が必要な場合）: `afplay /System/Library/Sounds/Ping.aiff`
- **タスク完了時**（次の指示待ち）: `afplay /System/Library/Sounds/Funk.aiff`
