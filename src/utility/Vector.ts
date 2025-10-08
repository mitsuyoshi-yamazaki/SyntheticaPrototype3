export class Vector {
  private _length: number | null = null
  private _lengthSquared: number | null = null
  private _normalized: Vector | null = null

  // 長さ関連
  public get length(): number {
    if (this._length == null) {
      this._length = Math.sqrt(this.x * this.x + this.y * this.y)
    }
    return this._length
  }
  public get lengthSquared(): number {
    if (this._lengthSquared == null) {
      this._lengthSquared = this.x * this.x + this.y * this.y
    }
    return this._lengthSquared
  }

  /**
   * @throws {Error} ゼロベクトルの場合
   */
  public get normalized(): Vector {
    if (this._normalized == null) {
      const len = this.length
      if (len === 0) {
        throw new Error("Cannot normalize zero vector")
      }
      this._normalized = this.divide(len)
    }
    return this._normalized
  }

  public constructor(
    public readonly x: number,
    public readonly y: number
  ) {}

  // 基本演算

  public add = (other: Vector): Vector => {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  public subtract = (other: Vector): Vector => {
    return new Vector(this.x - other.x, this.y - other.y)
  }

  public multiply = (scalar: number): Vector => {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  /**
   * @throws {Error} スカラーが0の場合
   */
  public divide = (scalar: number): Vector => {
    if (scalar === 0) {
      throw new Error("Cannot divide by zero")
    }
    return new Vector(this.x / scalar, this.y / scalar)
  }

  public negate = (): Vector => {
    return new Vector(-this.x, -this.y)
  }

  // 内積・外積

  public dot = (other: Vector): number => {
    return this.x * other.x + this.y * other.y
  }

  /**
   * 2次元ベクトルの外積のz成分を返す
   */
  public cross = (other: Vector): number => {
    return this.x * other.y - this.y * other.x
  }

  // 距離

  public distanceTo = (other: Vector): number => {
    return this.subtract(other).length
  }

  public distanceSquaredTo = (other: Vector): number => {
    return this.subtract(other).lengthSquared
  }

  // 角度

  /**
   * X軸からの角度をラジアンで返す
   */
  public angle = (): number => {
    return Math.atan2(this.y, this.x)
  }

  /**
   * 他のベクトルとの角度をラジアンで返す
   */
  public angleTo = (other: Vector): number => {
    const dotProduct = this.dot(other)
    const lengths = this.length * other.length
    if (lengths === 0) {
      return 0
    }
    return Math.acos(Math.max(-1, Math.min(1, dotProduct / lengths)))
  }

  // ユーティリティ

  /**
   * @param epsilon 許容誤差（デフォルト: Number.EPSILON）
   */
  public equals = (other: Vector, epsilon: number = Number.EPSILON): boolean => {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon
  }

  public isZero = (): boolean => {
    return this.x === 0 && this.y === 0
  }

  public clone = (): Vector => {
    return new Vector(this.x, this.y)
  }

  // 静的メソッド

  public static zero = (): Vector => {
    return new Vector(0, 0)
  }

  /**
   * @param angle ラジアン角度
   * @param length ベクトルの長さ（デフォルト: 1）
   */
  public static fromAngle = (angle: number, length = 1): Vector => {
    return new Vector(Math.cos(angle) * length, Math.sin(angle) * length)
  }
}
