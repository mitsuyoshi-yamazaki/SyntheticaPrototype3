# コミット bae34ab

## ユーザー指示

docs/TODO.md の `GameWorld.constructor()` にデモ用のForceField生成処理が書かれているので、アプリケーション層へ移す を実施する

どこへ移すべきか、xxクラスのxxメソッド、のように具体的に述べよ

## 実施内容

デモ用のForceField生成処理を、GameWorldクラスのコンストラクタから、GameCanvasPixiコンポーネントのinitPixiメソッドへ移動

1. GameWorldクラスの変更
   - コンストラクタから3つの力場生成コードを削除
   - addForceFieldメソッドを追加（Worldクラスのメソッドをラップ）

2. GameCanvasPixiコンポーネントの変更
   - initPixiメソッド内、GameWorld作成直後に力場生成処理を追加
   - 3つの力場（渦巻き、引力、斥力）をデモ用として生成

これにより、デモ設定の責務がアプリケーション層（UIコンポーネント）に適切に配置され、GameWorldクラスはドメインロジックに専念できるようになった。