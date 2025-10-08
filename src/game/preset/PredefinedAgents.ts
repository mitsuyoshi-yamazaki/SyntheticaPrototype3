import { Vector } from "../../utility/Vector"
import { Agent } from "../agent/Agent"
import { AgentApi } from "../agent/AgentApi"

export const createSimpleSelfReplicationAgent = (position: Vector): Agent => {
  return new Agent(
    position,
    {
      capacity: 100,
      accessControl: "Inaccessible",
      assemblePower: 5,
      disassemblePower: 5,
      numberOfConnectors: 2,
      movePower: 10,
      senseRange: 100,
    },
    (api: AgentApi) => {
      api.say("👀")
    }
  )
}
