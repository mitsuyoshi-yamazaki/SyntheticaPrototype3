## 概要

- Hullに接続されたユニットの描画用データであるvisualDataの扱いを再検討する

## 課題

- visualDataは、Hullへ接続している場合のみ必要な情報であり、接続していないユニットには関係ない。また、visualDataはそのユニット以外へも影響するため、Hull接続ユニットが変更されたら、接続しているユニット全体でvisualDataを更新しなければならないが、そのような構造にはなっていない（個々のユニットがvisualDataを持っている）

## 解決案

- そのオブジェクトの情報だけでは表示内容が決まらないオブジェクトは、HULLに接続しているユニットのみである
- そのため、表示内容を表す情報はHULLの接続情報とセットで格納するようにすることで、
  - 接続されたユニットは個々に描画するのではなく、接続されたHULLを描画する際に一緒に描画されるようにする
  - HULLへ接続するユニットに変化があったときには、表示内容を表す情報も更新されるようにする

### データ構造の変更

- 表示内容を表す情報
  - `Assembler`, `Computer` から `visualData` を削除する
  - `Hull` の `attachedUnits` を以下の型定義に変更する
    - `attachedUnits` の各項目がreadonlyと指定されていることから分かる通り、一箇所でも変更があれば全体のvisualDataを再計算する想定である
    - 現状では `ObjectId` からはそのIDがどの種別のオブジェクトを示すかわからないため、IDは `Id<T>` 型として定義し、利用箇所では `Id<Hull>` や `Id<Unit>` などと、IDを持つ対象を表す型に変更したい。このとき、 `World.state.objects.get()` の型定義は `get<T>(id: Id<T>): T | null` となる
    - 視覚上（アプリケーション層）のみに影響するvisualDataが、ゲームロジックと分離できない問題がある

```typescript
type Hull = {
  readonly attachedUnits: {
    readonly hulls: {
      readonly id: ObjectId // ObjectIdが Id<Hull> と表現できればなお良い
    }[],
    readonly assemblers: {
      readonly id: ObjectId
      readonly visualData: {
        readonly angle: number
      }
    }[],
    readonly computers: {
      readonly id: ObjectId
      readonly visualData: {
        readonly startAngle: number
        readonly endAngle: number
      }
    }
  }
  ...
}
```
