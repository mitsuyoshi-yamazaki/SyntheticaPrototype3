/**
 * 方向性力場システム - 環境要素として力場を管理
 */

import type { Vec2, DirectionalForceField, GameObject, ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

/** 力場システムのパラメータ */
export type ForceFieldSystemParameters = {
  /** 力場の減衰開始（中心からの距離比率） */
  readonly attenuationStart: number
  /** 摩擦係数 */
  readonly frictionCoefficient: number
}

/** デフォルトパラメータ */
export const DEFAULT_FORCE_FIELD_PARAMETERS: ForceFieldSystemParameters = {
  attenuationStart: 0.5, // 半径の50%から減衰開始
  frictionCoefficient: 0.98,
}

/** 力場による力の計算結果 */
export type ForceCalculationResult = {
  /** 適用される力 */
  readonly force: Vec2
  /** 力場ID */
  readonly fieldId: ObjectId
}

export class ForceFieldSystem {
  private readonly _parameters: ForceFieldSystemParameters

  public constructor(parameters: ForceFieldSystemParameters = DEFAULT_FORCE_FIELD_PARAMETERS) {
    this._parameters = parameters
  }

  /**
   * オブジェクトに影響する全ての力場からの力を計算
   * @param object 対象オブジェクト
   * @param forceFields アクティブな力場のマップ
   * @returns 合計の力ベクトル
   */
  public calculateTotalForce(
    object: GameObject,
    forceFields: Map<ObjectId, DirectionalForceField>
  ): Vec2 {
    let totalForce = Vec2Utils.create(0, 0)

    for (const field of forceFields.values()) {
      const force = this.calculateForceFromField(object.position, field)
      if (force != null) {
        totalForce = Vec2Utils.add(totalForce, force)
      }
    }

    return totalForce
  }

  /**
   * 単一の力場からの力を計算
   * @param position オブジェクトの位置
   * @param field 力場
   * @returns 力ベクトル（影響範囲外の場合null）
   */
  public calculateForceFromField(position: Vec2, field: DirectionalForceField): Vec2 | null {
    // 力場の中心からの距離を計算
    const delta = Vec2Utils.sub(position, field.position)
    const distance = Vec2Utils.magnitude(delta)

    // 影響範囲外
    if (distance > field.radius) {
      return null
    }

    // 減衰率の計算
    let attenuation = 1.0
    const attenuationThreshold = field.radius * this._parameters.attenuationStart
    if (distance > attenuationThreshold) {
      // 線形減衰: 閾値で1.0、端で0.5
      const t = (distance - attenuationThreshold) / (field.radius - attenuationThreshold)
      attenuation = 1.0 - t * 0.5
    }

    // 力場タイプに応じた力の計算
    let force: Vec2

    switch (field.type) {
      case "LINEAR": {
        // 線形力場: 一定方向の力
        force =
          field.direction !== undefined ? Vec2Utils.copy(field.direction) : Vec2Utils.create(0, 0)
        break
      }

      case "RADIAL": {
        // 放射状力場: 中心から外向き（正）または内向き（負）の力
        if (distance === 0) {
          // 中心点では任意の方向
          force = Vec2Utils.create(field.strength, 0)
        } else {
          const direction = Vec2Utils.normalize(delta)
          force = Vec2Utils.scale(direction, field.strength)
        }
        break
      }

      case "SPIRAL": {
        // 渦巻き力場: 接線方向と放射方向の組み合わせ
        if (distance === 0) {
          // 中心点では接線方向のみ
          force = Vec2Utils.create(0, field.strength)
        } else {
          const radialDir = Vec2Utils.normalize(delta)
          // 接線方向は放射方向を90度回転
          const tangentDir = Vec2Utils.create(-radialDir.y, radialDir.x)

          // 放射成分と接線成分の比率（中心に近いほど接線成分が強い）
          const radialRatio = (distance / field.radius) * 0.3
          const tangentRatio = 1.0 - radialRatio

          const radialForce = Vec2Utils.scale(radialDir, field.strength * radialRatio)
          const tangentForce = Vec2Utils.scale(tangentDir, field.strength * tangentRatio)

          force = Vec2Utils.add(radialForce, tangentForce)
        }
        break
      }

      default:
        // 未知のタイプ
        force = Vec2Utils.create(0, 0)
    }

    // 減衰を適用
    return Vec2Utils.scale(force, attenuation)
  }

  /**
   * 力場配置の生成（初期配置用）
   * @param worldWidth ワールド幅
   * @param worldHeight ワールド高さ
   * @param count 力場の数
   * @param idGenerator ID生成関数
   * @returns 生成された力場の配列
   */
  public generateForceFields(
    worldWidth: number,
    worldHeight: number,
    count: number,
    idGenerator: () => ObjectId
  ): DirectionalForceField[] {
    const fields: DirectionalForceField[] = []
    const minDistance = 200 // 力場間の最小距離

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let validPosition = false
      let position: Vec2 = Vec2Utils.create(0, 0)

      // 既存の力場から十分離れた位置を探す
      while (!validPosition && attempts < 100) {
        position = Vec2Utils.create(Math.random() * worldWidth, Math.random() * worldHeight)

        validPosition = true
        for (const existingField of fields) {
          const distance = Vec2Utils.distance(position, existingField.position)
          if (distance < minDistance) {
            validPosition = false
            break
          }
        }

        attempts++
      }

      // パラメータのランダム生成
      const radius = 50 + Math.random() * 250 // 50-300
      const strength = 10 + Math.random() * 40 // 10-50
      const types: DirectionalForceField["type"][] = ["LINEAR", "RADIAL", "SPIRAL"]
      const typeIndex = Math.floor(Math.random() * types.length)
      const type = types[typeIndex] ?? "LINEAR"

      // 方向ベクトル（LINEAR用）
      let direction: Vec2 | undefined
      if (type === "LINEAR") {
        const angle = Math.random() * Math.PI * 2
        direction = Vec2Utils.create(Math.cos(angle) * strength, Math.sin(angle) * strength)
      }

      const field: DirectionalForceField = {
        id: idGenerator(),
        type,
        position,
        radius,
        strength: type === "LINEAR" ? 1 : strength, // LINEARの場合はdirectionで強度を表現
      }

      if (direction !== undefined) {
        field.direction = direction
      }

      fields.push(field)
    }

    return fields
  }

  /**
   * 摩擦係数を取得
   */
  /**
   * 力場の可視化データを生成（デバッグ用）
   * @param field 力場
   * @param gridSize グリッドサイズ
   * @returns 可視化用の力ベクトル配列
   */
  public getVisualizationData(
    field: DirectionalForceField,
    gridSize = 30
  ): { position: Vec2; force: Vec2 }[] {
    const data: { position: Vec2; force: Vec2 }[] = []

    const startX = field.position.x - field.radius
    const startY = field.position.y - field.radius
    const endX = field.position.x + field.radius
    const endY = field.position.y + field.radius

    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        const position = Vec2Utils.create(x, y)
        const force = this.calculateForceFromField(position, field)

        if (force != null) {
          data.push({ position, force })
        }
      }
    }

    return data
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public get frictionCoefficient(): number {
    return this._parameters.frictionCoefficient
  }
}
