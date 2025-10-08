import { Vector } from "../../utility/Vector"
import { Agent } from "../agent/Agent"
import { AgentApi } from "../agent/AgentApi"
import { GameWorldApi } from "../game-world/GameWorldApi"

export const createSimpleSelfReplicationAgent = (position: Vector): Agent => {
  const agent = new Agent(position, {
    capacity: 100,
    accessControl: "Inaccessible",
    assemblePower: 5,
    disassemblePower: 5,
    numberOfConnectors: 2,
    movePower: 10,
    senseRange: 100,
    software: (agentApi: AgentApi, gameWorldApi: GameWorldApi) => {
      // const objectsInRange = gameWorldApi.searchObjects()
      // const energyInRange = objectsInRange.filter(obj => obj.objectType === "Energy")
      // if (energyInRange.length > 0) {
      //   agentApi.say(`${energyInRange.length}E`)
      // } else {
      //   agentApi.say("...")
      // }
      agentApi.say(`${agentApi.energyAmount}`)
      gameWorldApi
    },
  })

  agent.energyAmount = agent.capacity * 0.8

  return agent
}
