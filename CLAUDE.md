# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

SyntheticaPrototype2は、自律エージェントが環境中で活動するMMOゲームのプロトタイプです。プレイヤーが作成したエージェントを観察し、オープンエンドな進化を実現することを目的としています。

## アーキテクチャ

- **フロントエンド**: Next.js + TypeScript + PixiJS + Tailwind CSS
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
├── architecture.md         # 実装アーキテクチャ
├── coding-guidelines.md    # コーディング規約
├── static-code-analysis.md # 静的コード解析設定ガイド
├── vibe-coding-guide.md    # AIアシスタント利用ガイド
├── TODO.md                 # TODO / 実装状況
├── commit-notes/           # コミットノート（各コミットの指示記録）
└── spec-v3/                # v3仕様書
    ├── game-world-requirement.md  # ゲーム仕様
    ├── TODO.md             # v3実装タスク
    └── （各種仕様書）

/src/                       # ソースコード
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # メインページ
│   └── globals.css        # グローバルスタイル
├── components/             # Reactコンポーネント
│   ├── GameCanvas.tsx     # p5.jsゲームキャンバス（旧版）
│   └── GameCanvasPixi.tsx # PixiJSゲームキャンバス
├── lib/                    # ライブラリ・ユーティリティ
│   ├── GameWorld.ts       # ゲーム世界ブリッジクラス
│   └── GameWorld.test.ts  # GameWorldテスト
├── engine/                 # ゲームエンジンコア
│   ├── world.ts           # 世界統合管理
│   ├── world-state.ts     # 世界状態管理
│   ├── game-loop.ts       # ゲームループ制御
│   ├── object-factory.ts  # オブジェクト生成
│   └── index.ts           # エクスポート
├── utils/                  # ユーティリティ関数
│   ├── vec2.ts            # 2次元ベクトル演算
│   ├── torus-math.ts      # トーラス世界用数学
│   └── object-pool.ts     # オブジェクトプール
└── types/                  # TypeScript型定義
    └── game.ts             # ゲーム関連型定義

設定ファイル:
├── next.config.js         # Next.js設定（静的エクスポート）
├── tsconfig.json          # TypeScript設定
├── tailwind.config.js     # Tailwind CSS設定
├── jest.config.js         # Jest設定
├── eslint.config.mjs      # ESLint設定（Flat Config）
├── .prettierrc            # Prettier設定
├── .prettierignore        # Prettierで除外するファイル
└── .vscode/               # VSCode設定
    ├── settings.json      # エディタ設定（保存時フォーマット）
    └── extensions.json    # 推奨拡張機能
```

## コミットワークフロー

**重要**: 以下のワークフローを必ず実行すること

- **ユーザー指示を受けてファイルを変更した場合**、変更完了後に必ず以下を実行：
  - 変更をgit addしてコミット（「🤖 Generated with [Claude Code]」を含むコミットメッセージ付き）
  - **AIによるコミットの場合のみ**以下を実行：
    - コミットハッシュを取得
    - `docs/commit-notes/<コミットハッシュ>.md`ファイルを作成
      - 内容：そのコミットを生み出したユーザープロンプト（指示）を記載
    - 「<コミットハッシュ>のコミットノートを作成」メッセージでコミット

## GitHub Issue/PR作成時の識別

**重要**: GitHub issue/PR作成時は以下を必ず実行すること

1. **タイトルに識別子追加**: `[Claude] <元のタイトル>`
2. **本文末尾に識別子追加**: `🤖 Created by Claude Code`
3. **専用ラベル適用**: `claude-created` ラベルを追加
4. **例**:
   ```bash
   gh issue create --title "[Claude] 機能追加" --body "内容...\n\n🤖 Created by Claude Code" --label "claude-created"
   ```

## GitHub Issue実施手順

**重要**: issueを実施する際は以下の手順を必ず実行すること

1. **アサイン**: 自身をアサインしたことをissueにコメントで記録

   ```bash
   gh issue comment <issue番号> --body "🤖 Claude がこのissueの実装を開始します"
   ```

2. **要件確認**: issueの情報が十分か確認
   - 不足があれば人間に確認を求める
   - 情報更新があればissueを更新する

3. **ブランチ作成**: issue番号を含む簡潔な名前でブランチを作成

   ```bash
   git checkout -b "#<issue番号>-<簡潔な説明>"
   # 例: git checkout -b "#2-setup-ci"
   ```

4. **作業実行**: 作成したブランチ上で作業を行う

5. **PR作成**: 作業完了後、pushしてPull Requestを作成
   ```bash
   git push -u origin <ブランチ名>
   gh pr create --title "[Claude] <PR タイトル>" --body "Closes #<issue番号>\n\n🤖 Created by Claude Code" --label "claude-created"
   ```

**注意**: 対応できない問題や自信がない場合は必ず人間に指示を仰ぐこと

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
- **ユニット種別**: HULL, ASSEMBLER, COMPUTER（v3では限定実装）
- **資源システム**: 1024進法エネルギーシステム、質量保存の原則
- **物理**: 円形オブジェクトのみ、衝突検出、反発力（tanh制限）
- **詳細仕様**: `docs/spec-v3/`ディレクトリを参照

## 技術仕様

- PixiJSによるWebGLベース高速描画（10,000+オブジェクト対応）
- ゲームエンジンコアによる世界管理（World、WorldStateManager）
- 固定タイムステップゲームループ（GameLoopController）
- 空間ハッシュグリッドによる衝突判定最適化（セルサイズ100）
- 1024進法エネルギーシステム（spec-v3準拠）
- トーラス世界での座標系
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
