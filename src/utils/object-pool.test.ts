/**
 * オブジェクトプール実装のテスト
 */

import { ObjectPool, PoolableVec2, PoolableArray } from "./object-pool"
import type { Poolable } from "./object-pool"

// テスト用のPoolableオブジェクト
class TestPoolable implements Poolable {
  public value = 0
  public resetCount = 0

  public reset(): void {
    this.value = 0
    this.resetCount++
  }
}

describe("ObjectPool", () => {
  describe("constructor", () => {
    test("初期サイズ分のオブジェクトが作成される", () => {
      const factory = jest.fn(() => new TestPoolable())
      const pool = new ObjectPool(factory, 5)

      expect(factory).toHaveBeenCalledTimes(5)
      expect(pool.size).toBe(5)
    })

    test("初期サイズが0でも正常に動作する", () => {
      const factory = jest.fn(() => new TestPoolable())
      const pool = new ObjectPool(factory, 0)

      expect(factory).not.toHaveBeenCalled()
      expect(pool.size).toBe(0)
    })

    test("デフォルトの初期サイズは10", () => {
      const factory = jest.fn(() => new TestPoolable())
      const pool = new ObjectPool(factory)

      expect(factory).toHaveBeenCalledTimes(10)
      expect(pool.size).toBe(10)
    })
  })

  describe("acquire", () => {
    test("プールからオブジェクトを取得できる", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 3)
      const initialSize = pool.size

      const obj = pool.acquire()

      expect(obj).toBeInstanceOf(TestPoolable)
      expect(pool.size).toBe(initialSize - 1)
    })

    test("プールが空の場合は新しいオブジェクトを作成する", () => {
      const factory = jest.fn(() => new TestPoolable())
      const pool = new ObjectPool(factory, 0)

      const obj = pool.acquire()

      expect(obj).toBeInstanceOf(TestPoolable)
      expect(factory).toHaveBeenCalledTimes(1)
    })

    test("取得したオブジェクトはリセットされていない", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 1)
      pool.acquire() // プールを空にする

      const obj = new TestPoolable()
      obj.value = 100
      pool.release(obj)

      const acquired = pool.acquire()
      expect(acquired.value).toBe(0) // releaseでリセットされている
    })
  })

  describe("release", () => {
    test("オブジェクトをプールに返却できる", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 0)
      const obj = new TestPoolable()

      pool.release(obj)

      expect(pool.size).toBe(1)
    })

    test("返却時にオブジェクトがリセットされる", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 0)
      const obj = new TestPoolable()
      obj.value = 100

      pool.release(obj)

      expect(obj.resetCount).toBe(1)
      expect(obj.value).toBe(0)
    })

    test("最大サイズを超える場合はプールに追加されない", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 0, 2)

      pool.release(new TestPoolable())
      pool.release(new TestPoolable())
      pool.release(new TestPoolable()) // 3つ目

      expect(pool.size).toBe(2)
    })

    test("最大サイズを超えてもオブジェクトはリセットされる", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 0, 1)
      pool.release(new TestPoolable()) // プールを満杯にする

      const obj = new TestPoolable()
      obj.value = 100

      pool.release(obj)

      expect(obj.resetCount).toBe(1)
      expect(obj.value).toBe(0)
      expect(pool.size).toBe(1) // サイズは増えない
    })
  })

  describe("clear", () => {
    test("プールを空にできる", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 5)

      pool.clear()

      expect(pool.size).toBe(0)
    })

    test("クリア後も正常に動作する", () => {
      const pool = new ObjectPool(() => new TestPoolable(), 5)
      pool.clear()

      const obj = pool.acquire()
      expect(obj).toBeInstanceOf(TestPoolable)

      pool.release(obj)
      expect(pool.size).toBe(1)
    })
  })

  describe("acquire/release サイクル", () => {
    test("複数回の取得・返却が正常に動作する", () => {
      const factory = jest.fn(() => new TestPoolable())
      const pool = new ObjectPool(factory, 2)

      // 初期作成で2回呼ばれている
      expect(factory).toHaveBeenCalledTimes(2)

      // 2つ取得
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      expect(pool.size).toBe(0)

      // プールが空なので新規作成される
      const obj3 = pool.acquire()
      expect(factory).toHaveBeenCalledTimes(3)

      // 返却
      pool.release(obj1)
      pool.release(obj2)
      pool.release(obj3)

      // 最大サイズ1000なので3つとも格納される
      expect(pool.size).toBe(3)

      // 再取得時は新規作成されない
      pool.acquire()
      expect(factory).toHaveBeenCalledTimes(3)
    })
  })
})

describe("PoolableVec2", () => {
  test("初期値は0", () => {
    const vec = new PoolableVec2()
    expect(vec.x).toBe(0)
    expect(vec.y).toBe(0)
  })

  test("setで値を設定できる", () => {
    const vec = new PoolableVec2()
    vec.set(10, 20)

    expect(vec.x).toBe(10)
    expect(vec.y).toBe(20)
  })

  test("setはメソッドチェーンできる", () => {
    const vec = new PoolableVec2()
    const result = vec.set(5, 10).set(15, 20)

    expect(result).toBe(vec)
    expect(vec.x).toBe(15)
    expect(vec.y).toBe(20)
  })

  test("resetで初期値に戻る", () => {
    const vec = new PoolableVec2()
    vec.set(100, 200)

    vec.reset()

    expect(vec.x).toBe(0)
    expect(vec.y).toBe(0)
  })

  test("ObjectPoolで使用できる", () => {
    const pool = new ObjectPool(() => new PoolableVec2(), 2)

    const vec1 = pool.acquire()
    vec1.set(10, 20)

    pool.release(vec1)

    const vec2 = pool.acquire()
    // リセットされているので初期値
    expect(vec2.x).toBe(0)
    expect(vec2.y).toBe(0)
  })
})

describe("PoolableArray", () => {
  test("初期状態は空配列", () => {
    const arr = new PoolableArray<number>()
    expect(arr.items).toHaveLength(0)
  })

  test("pushで要素を追加できる", () => {
    const arr = new PoolableArray<string>()
    arr.push("a")
    arr.push("b")
    arr.push("c")

    expect(arr.items).toEqual(["a", "b", "c"])
  })

  test("resetで空になる", () => {
    const arr = new PoolableArray<number>()
    arr.push(1)
    arr.push(2)
    arr.push(3)

    arr.reset()

    expect(arr.items).toHaveLength(0)
  })

  test("ObjectPoolで使用できる", () => {
    const pool = new ObjectPool(() => new PoolableArray<string>(), 2)

    const arr1 = pool.acquire()
    arr1.push("test1")
    arr1.push("test2")

    pool.release(arr1)

    const arr2 = pool.acquire()
    // リセットされているので空
    expect(arr2.items).toHaveLength(0)

    // 新しいデータを追加できる
    arr2.push("new")
    expect(arr2.items).toEqual(["new"])
  })

  test("異なる型のPoolableArrayを作成できる", () => {
    const numberArray = new PoolableArray<number>()
    const objectArray = new PoolableArray<{ id: number; name: string }>()

    numberArray.push(42)
    objectArray.push({ id: 1, name: "test" })

    expect(numberArray.items[0]).toBe(42)
    expect(objectArray.items[0]).toEqual({ id: 1, name: "test" })
  })
})

describe("ObjectPool パフォーマンス", () => {
  test("大量のオブジェクトを効率的に管理できる", () => {
    const pool = new ObjectPool(() => new TestPoolable(), 100)
    const objects: TestPoolable[] = []

    // 1000個のオブジェクトを取得
    for (let i = 0; i < 1000; i++) {
      objects.push(pool.acquire())
    }

    // すべて返却
    for (const obj of objects) {
      pool.release(obj)
    }

    // 最大サイズは1000なので、すべて格納される
    expect(pool.size).toBe(1000)
  })

  test("プールが満杯でも正常に動作する", () => {
    const pool = new ObjectPool(() => new TestPoolable(), 0, 100)

    // 200個返却（最大100個まで）
    for (let i = 0; i < 200; i++) {
      pool.release(new TestPoolable())
    }

    expect(pool.size).toBe(100)

    // 100個取得できる
    for (let i = 0; i < 100; i++) {
      const obj = pool.acquire()
      expect(obj).toBeInstanceOf(TestPoolable)
    }

    expect(pool.size).toBe(0)
  })
})
