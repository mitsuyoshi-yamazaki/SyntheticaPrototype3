/**
 * エージェント生成ファクトリ
 */

import type { GameObject, ObjectId, Vec2, Computer } from "@/types/game"
import type { AgentPreset } from "./presets/types"
import { ObjectFactory } from "./object-factory"
import { ComputerVMSystem } from "./computer-vm-system"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AgentFactory {
  /**
   * プリセットからエージェントを生成
   * @param preset エージェントプリセット
   * @param position 配置位置
   * @param worldWidth 世界の幅
   * @param worldHeight 世界の高さ
   * @param generateId ID生成関数
   * @returns 生成されたゲームオブジェクト群
   */
  public static createFromPreset(
    preset: AgentPreset,
    position: Vec2,
    worldWidth: number,
    worldHeight: number,
    generateId: () => ObjectId
  ): GameObject[] {
    const factory = new ObjectFactory(worldWidth, worldHeight)
    const objects: GameObject[] = []

    // 1. HULLを検索（最初のHULLユニットを使用）
    const hullDef = preset.units.find(unit => unit.type === "HULL")
    if (hullDef == null) {
      throw new Error("プリセットにHULLが含まれていません")
    }

    // 2. HULLを生成
    const hullId = generateId()
    const hull = factory.createHull(
      hullId,
      position,
      hullDef.parameters.type === "HULL" ? hullDef.parameters.capacity : 0
    )
    objects.push(hull)

    // 3. 他のユニットを生成して配置
    let computerUnit: GameObject | null = null

    for (const unitDef of preset.units) {
      if (unitDef.type === "HULL") {
        continue // HULLは既に生成済み
      }

      const unitId = generateId()
      let unit: GameObject

      switch (unitDef.type) {
        case "ASSEMBLER":
          if (unitDef.parameters.type !== "ASSEMBLER") {
            throw new Error("ユニットタイプとパラメータタイプが一致しません")
          }
          unit = factory.createAssembler(
            unitId,
            position, // HULLと同じ位置に配置
            unitDef.parameters.assemblePower,
            unitDef.isAttached ? hullId : undefined
          )
          break

        case "COMPUTER":
          if (unitDef.parameters.type !== "COMPUTER") {
            throw new Error("ユニットタイプとパラメータタイプが一致しません")
          }
          unit = factory.createComputer(
            unitId,
            position, // HULLと同じ位置に配置
            unitDef.parameters.processingPower,
            unitDef.parameters.memorySize,
            unitDef.isAttached ? hullId : undefined,
            Vec2Utils.create(0, 0), // 相対位置は0
            preset.program
          )
          computerUnit = unit
          break

        default:
          throw new Error(`未対応のユニットタイプ: ${String(unitDef.type)}`)
      }

      objects.push(unit)

      // 4. attachedフラグに基づいて接続
      // 注: 実際の接続は後で createAttachedUnitsInfo を使用して行う必要がある
      // ここでは単にparentHullを設定するだけ
    }

    // 5. COMPUTERにプログラムがロード済みなので、実行を開始
    if (computerUnit != null && computerUnit.type === "COMPUTER") {
      ComputerVMSystem.startProgram(computerUnit as Computer)
    }

    return objects
  }
}
