# b37b3ad - ゲーム法則パラメータとローカルパラメータの分離を完了

## ユーザー指示

GameWorldへ設定するパラメータは、「ゲーム世界の物理法則に起因するパラメータ（A）」と、「GameWorldが表現する、ゲーム世界の切り取った一部分がどのような性質かを表すパラメータ（B）」の２種類がある。

1. EnergyParametersに物理法則(A)は残したままEnergyParametersを「energy」を含まない名前に変更せよ
2. WorldParametersから物理法則(A)を削除し、EnergyParametersへ移動させよ
3. WorldParametersにはBのみが残る
4. コンストラクタにPartial<WorldParameter>引数を再度追加せよ

## 実施内容

1. `/src/config/energy-parameters.ts` を `/src/config/game-law-parameters.ts` に改名
2. `EnergyParameters` 型を `GameLawParameters` に改名
3. 物理法則パラメータ（maxForce, forceScale, friction）を GameLawParameters に移動
4. WorldParameters にはローカル設定のみを残す（energySourceCount, energySourceMinRate, energySourceMaxRate, ticksPerFrame, maxFPS）
5. WorldStateManager と WorldConfig のコンストラクタに `Partial<WorldParameters>` 引数を追加
6. テスト用パラメータ `TEST_PARAMETERS` を追加してテストを修正
7. 関連する全ての参照を更新

## 変更の目的

ゲーム世界全体に適用される普遍的な物理法則と、特定のワールドインスタンスに固有のローカル設定を明確に分離することで、パラメータ管理の概念的な整合性を向上させました。
