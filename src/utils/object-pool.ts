/**
 * オブジェクトプール実装
 * 頻繁な生成・破棄によるGCを避けるため
 */

export type Poolable = {
  reset(): void
}

export class ObjectPool<T extends Poolable> {
  private readonly _pool: T[] = []
  private readonly _factory: () => T
  private readonly _maxSize: number
  
  /** プールサイズ */
  public get size(): number {
    return this._pool.length
  }
  
  public constructor(factory: () => T, initialSize = 10, maxSize = 1000) {
    this._factory = factory
    this._maxSize = maxSize
    
    // 初期プール作成
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory())
    }
  }
  
  /** オブジェクトを取得 */
  public acquire(): T {
    if (this._pool.length > 0) {
      const item = this._pool.pop()
      if (item === undefined) {
        throw new Error("Pool is empty")
      }
      return item
    }
    return this._factory()
  }
  
  /** オブジェクトを返却 */
  public release(obj: T): void {
    if (this._pool.length < this._maxSize) {
      obj.reset()
      this._pool.push(obj)
    }
  }
  
  /** プールをクリア */
  public clear(): void {
    this._pool.length = 0
  }
}

/** Vec2用のプーラブル実装 */
export class PoolableVec2 implements Poolable {
  public x = 0
  public y = 0
  
  public set(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }
  
  public reset(): void {
    this.x = 0
    this.y = 0
  }
}

/** 配列用のプーラブル実装 */
export class PoolableArray<T> implements Poolable {
  public readonly items: T[] = []
  
  public push(item: T): void {
    this.items.push(item)
  }
  
  public reset(): void {
    this.items.length = 0
  }
}