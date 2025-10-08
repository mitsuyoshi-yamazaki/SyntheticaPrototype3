import { Vector } from "../../utility/Vector"
import { Physics } from "../physics/Physics"
import { Agent } from "./Agent"
import { AgentActionResolver } from "./AgentActionResolver"

describe("AgentActionResolver", () => {
  describe("resolveMove", () => {
    const createPhysics = (): Physics => {
      return new Physics({
        inertia: 1.0,
        frictionForVelocity: (velocity: number) => velocity * 0.1,
        energyConsumption: {
          moveWeight: 0.5,
        },
      })
    }

    const createAgent = (weight: number, energyAmount: number): Agent => {
      const agent = new Agent(
        new Vector(0, 0), // position
        {
          movePower: 10,
          capacity: 100,
          accessControl: "Accessible",
          assemblePower: 5,
          disassemblePower: 5,
          numberOfConnectors: 2,
          senseRange: 50,
        },
        () => {}
      )
      agent.energyAmount = energyAmount
      return agent
    }

    test("エネルギーが十分な場合、要求された力をそのまま適用し、必要なエネルギーを消費する", () => {
      const physics = createPhysics()
      const agent = createAgent(2.0, 100)
      const power = new Vector(3, 4) // length = 5

      const result = AgentActionResolver.resolveMove(physics, agent, power)

      // 必要エネルギー = power.length * weight * moveWeight = 5 * 2 * 0.5 = 5
      expect(result.energyConsumption).toBe(5)
      expect(result.forceToApply.x).toBe(3)
      expect(result.forceToApply.y).toBe(4)
    })

    test("エネルギーが不足する場合、全エネルギーを消費し、利用可能なエネルギーに応じた力を適用する", () => {
      const physics = createPhysics()
      const agent = createAgent(2.0, 3)
      const power = new Vector(6, 8) // length = 10

      const result = AgentActionResolver.resolveMove(physics, agent, power)

      // 全エネルギーを消費
      expect(result.energyConsumption).toBe(3)
      // 最大パワー = availableEnergy / (weight * moveWeight) = 3 / (2 * 0.5) = 3
      // 適用される力 = power.normalized * maxPower = (0.6, 0.8) * 3 = (1.8, 2.4)
      expect(result.forceToApply.x).toBeCloseTo(1.8)
      expect(result.forceToApply.y).toBeCloseTo(2.4)
    })

    test("必要エネルギーと保有エネルギーが等しい場合、要求された力をそのまま適用する", () => {
      const physics = createPhysics()
      const agent = createAgent(2.0, 5)
      const power = new Vector(3, 4) // length = 5

      const result = AgentActionResolver.resolveMove(physics, agent, power)

      // 必要エネルギー = 5 * 2 * 0.5 = 5
      expect(result.energyConsumption).toBe(5)
      expect(result.forceToApply.x).toBe(3)
      expect(result.forceToApply.y).toBe(4)
    })

    test("ゼロベクトルが入力された場合、エネルギー消費なしで力も発生しない", () => {
      const physics = createPhysics()
      const agent = createAgent(2.0, 100)
      const power = Vector.zero()

      const result = AgentActionResolver.resolveMove(physics, agent, power)

      expect(result.energyConsumption).toBe(0)
      expect(result.forceToApply.x).toBe(0)
      expect(result.forceToApply.y).toBe(0)
    })

    test("エージェントのエネルギーがゼロの場合、力を発生させない", () => {
      const physics = createPhysics()
      const agent = createAgent(2.0, 0)
      const power = new Vector(3, 4)

      const result = AgentActionResolver.resolveMove(physics, agent, power)

      expect(result.energyConsumption).toBe(0)
      expect(result.forceToApply.x).toBe(0)
      expect(result.forceToApply.y).toBe(0)
    })

    test("異なる重さのエージェントで必要エネルギーが変わる", () => {
      const physics = createPhysics()
      const power = new Vector(3, 4) // length = 5

      const lightAgent = createAgent(1.0, 100)
      const heavyAgent = createAgent(4.0, 100)

      const lightResult = AgentActionResolver.resolveMove(physics, lightAgent, power)
      const heavyResult = AgentActionResolver.resolveMove(physics, heavyAgent, power)

      // 軽いエージェント: 5 * 1 * 0.5 = 2.5
      expect(lightResult.energyConsumption).toBe(2.5)
      // 重いエージェント: 5 * 4 * 0.5 = 10
      expect(heavyResult.energyConsumption).toBe(10)
    })
  })
})
