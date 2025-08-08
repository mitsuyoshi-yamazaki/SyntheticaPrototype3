# SyntheticaPrototype2

自律エージェントが環境中で活動するMMOゲームのプロトタイプ。プレイヤーが作成したエージェントを観察し、オープンエンドな進化を実現することを目的としている。

## 概要

SyntheticaPrototype2は、2Dトーラス世界で自律エージェントが活動するシミュレーションゲームです。エージェントは独自のプログラム（Synthetica Script）を実行し、エネルギー収集、自己複製、進化を行います。

### 主な特徴

- **自律エージェント**: 16ビットVM上でSynthetica Scriptを実行
- **物理シミュレーション**: 衝突検出、力場、エネルギー拡散
- **自己複製**: エージェントがプログラムを通じて自己を複製
- **リアルタイム描画**: PixiJSによるWebGLベース高速レンダリング

## クイックスタート

```bash
# 依存関係のインストール
yarn install

# 開発サーバーの起動
yarn dev

# Storybookの起動（コンポーネントカタログ）
yarn storybook
```

## プロジェクト構成

- **フロントエンド**: Next.js + TypeScript + PixiJS
- **ゲームエンジン**: `/src/engine/` - シミュレーションコア
- **描画**: PixiJS（WebGL）による2Dグラフィックス
- **テスト**: Jest + Testing Library

詳細は[アーキテクチャドキュメント](docs/architecture.md)を参照。

## ドキュメント

- [要件定義](docs/requirements.md) - システム要件
- [アーキテクチャ](docs/architecture.md) - 技術構成
- [ゲーム仕様](docs/spec-v3/game-world-requirement.md) - ゲームワールド仕様
- [Synthetica Script](docs/spec-v3/synthetica-script.md) - VM命令セット
- [コーディング規約](docs/coding-guidelines.md) - 開発ガイドライン

## 開発

### 主要コマンド

```bash
yarn dev        # 開発サーバー起動（http://localhost:3000）
yarn build      # プロダクションビルド
yarn test       # テスト実行
yarn lint       # Lintチェック
yarn format     # コードフォーマット
yarn storybook  # Storybook起動（http://localhost:6006）
```

### 開発環境

- Node.js 20+
- Yarn 1.22+
- TypeScript 5.8+

### CI/CD

GitHub Actionsによる自動テスト実行（PR時）。詳細は[.github/workflows/ci.yml](.github/workflows/ci.yml)を参照。

## ライセンス

ISC License

## リンク

- [GitHub Repository](https://github.com/mitsuyoshi-yamazaki/SyntheticaPrototype2)
- [Issues](https://github.com/mitsuyoshi-yamazaki/SyntheticaPrototype2/issues)
