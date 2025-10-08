import { Vector } from "../../utility/Vector"
import { Agent } from "../agent/Agent"
import { AgentApi } from "../agent/AgentApi"

export const createSimpleSelfReplicationAgent = (position: Vector): Agent => {
  const agent = new Agent(position, {
    capacity: 100,
    accessControl: "Inaccessible",
    assemblePower: 5,
    disassemblePower: 5,
    numberOfConnectors: 2,
    movePower: 10,
    senseRange: 100,
    software: (api: AgentApi) => {
      api.say("👀")
    },
  })

  agent.energyAmount = agent.capacity * 0.8

  return agent
}
