/**
 * オブジェクトプール実装
 * 頻繁な生成・破棄によるGCを避けるため
 */

export interface Poolable {
  reset(): void
}

export class ObjectPool<T extends Poolable> {
  private readonly _pool: T[] = []
  private readonly _factory: () => T
  private readonly _maxSize: number
  
  constructor(factory: () => T, initialSize = 10, maxSize = 1000) {
    this._factory = factory
    this._maxSize = maxSize
    
    // 初期プール作成
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory())
    }
  }
  
  /** オブジェクトを取得 */
  acquire(): T {
    if (this._pool.length > 0) {
      return this._pool.pop()!
    }
    return this._factory()
  }
  
  /** オブジェクトを返却 */
  release(obj: T): void {
    if (this._pool.length < this._maxSize) {
      obj.reset()
      this._pool.push(obj)
    }
  }
  
  /** プールサイズ */
  get size(): number {
    return this._pool.length
  }
  
  /** プールをクリア */
  clear(): void {
    this._pool.length = 0
  }
}

/** Vec2用のプーラブル実装 */
export class PoolableVec2 implements Poolable {
  x = 0
  y = 0
  
  set(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }
  
  reset(): void {
    this.x = 0
    this.y = 0
  }
}

/** 配列用のプーラブル実装 */
export class PoolableArray<T> implements Poolable {
  readonly items: T[] = []
  
  push(item: T): void {
    this.items.push(item)
  }
  
  reset(): void {
    this.items.length = 0
  }
}