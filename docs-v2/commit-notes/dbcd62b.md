# コミット dbcd62b

## ユーザー指示

熱の処理（エネルギー消費による熱の追加、熱拡散のセルオートマトン、放熱による熱値の下降）は実装されているか

実装を進めよ

## 実施内容

1. 熱システムの実装状況を確認
   - HeatSystemクラスは実装済みだが、WorldStateManagerへの統合が未完了だった

2. WorldStateManagerへのHeatSystem統合
   - HeatSystemインスタンスを作成・管理
   - addHeatToCellメソッドを実装

3. ゲームループへの熱処理追加
   - updateHeatSystemメソッドを追加
   - 熱拡散（updateDiffusion）と放熱（updateRadiation）を毎tick実行

4. 熱によるダメージ処理を実装
   - applyHeatDamageメソッドを追加
   - 高温セルのユニットにダメージを適用
   - 損傷/生産中のユニットへの追加ダメージ倍率
   - ユニット破壊時の熱生成

5. 統合テストの作成
   - エネルギー消費による熱生成
   - セルオートマトンによる熱拡散
   - 放熱による熱減少
   - 熱ダメージの動作確認