## 概要

- 各ユニットの容量や、ユニットの個数をargで増減できるように変更する

## 変更内容

- 現在argに入っている `width` と `height` は不要なため削除する
- Hull with Assembler
  - argへ以下を追加する
    - Hullの容積
    - Assemblerの個数（1以上）
    - ひとつめのAssemblerの容積（1以上、「Hull容積 - 他のAssemblerの容積の合計」以下）
- Hull with Computer
  - argへ以下を追加する
    - Hullの容積
    - Computerの個数（1以上）
    - ひとつめのComputerの容積（1以上、「Hull容積 - 他のComputerの容積の合計」以下）
- Hull with Both
  - argへ以下を追加する
    - Hullの容積
    - Assemblerの個数（1以上）
    - Computerの個数（1以上）
- Nested Hulls
  - Connected Hulls へタイトルを変更する

### 備考

- 記載しているarg値の範囲については、実行時にその範囲をとるように修正する形とせよ（例：argが1以上100以下である場合： `max(100, min(1, value))` ）
