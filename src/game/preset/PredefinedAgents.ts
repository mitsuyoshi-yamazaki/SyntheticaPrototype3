import { Vector } from "../../utility/Vector"
import { Agent } from "../agent/Agent"
import { AgentApi } from "../agent/AgentApi"
import { Energy } from "../energy/Energy"
import { GameWorldApi } from "../game-world/GameWorldApi"
import { Id } from "../object/ObjectId"

export const createSimpleSelfReplicationAgent = (position: Vector, capacity = 100): Agent => {
  const agent = new Agent(position, {
    capacity,
    accessControl: "Inaccessible",
    assemblePower: 5,
    disassemblePower: 5,
    numberOfConnectors: 2,
    movePower: 10,
    senseRange: 100,
    software: (agentApi: AgentApi, gameWorldApi: GameWorldApi) => {
      const objectsInRange = gameWorldApi.searchObjects()
      const energyInRange = objectsInRange.filter(obj => obj.objectType === "Energy") as {
        id: Id<Energy>
        objectType: "Energy"
        position: Vector
      }[]

      energyInRange.sort((lhs, rhs) => lhs.position.length - rhs.position.length)
      const closestEnergy = energyInRange[0]

      if (closestEnergy != null) {
        if (closestEnergy.position.length < agent.radius * 2) {
          agentApi.absorb(closestEnergy.id, agentApi.capacity)
        } else {
          agentApi.move(closestEnergy.position)
        }
      }

      agentApi.say(`${agentApi.energyAmount}`)

      // if (energyInRange.length > 0) {
      //   agentApi.say(`${energyInRange.length}E`)
      // } else {
      //   agentApi.say("...")
      // }
    },
  })

  agent.energyAmount = agent.capacity * 0.8

  return agent
}
