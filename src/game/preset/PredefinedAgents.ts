import { Vector } from "../../utility/Vector"
import { Agent } from "../agent/Agent"
import { AgentApi } from "../agent/AgentApi"
import { AgentSoftware } from "../agent/AgentSpec"
import { Energy } from "../energy/Energy"
import { GameWorldApi } from "../game-world/GameWorldApi"
import { Id } from "../object/ObjectId"

const software1: AgentSoftware = (agentApi: AgentApi, gameWorldApi: GameWorldApi) => {
  if (agentApi.energyAmount > agentApi.capacity * 0.9) {
    agentApi.say("✅")
    agentApi.assemble(
      {
        capacity: agentApi.capacity,
        accessControl: "Inaccessible",
        assemblePower: agentApi.assemblePower,
        disassemblePower: agentApi.disassemblePower,
        numberOfConnectors: agentApi.numberOfConnectors,
        movePower: agentApi.movePower,
        senseRange: agentApi.senseRange,
        software: software1,
      },
      Math.floor(agentApi.energyAmount * 0.1)
    )
    return
  }

  const objectsInRange = gameWorldApi.searchObjects()
  const energyInRange = objectsInRange.filter(obj => obj.objectType === "Energy") as {
    id: Id<Energy>
    objectType: "Energy"
    position: Vector
  }[]

  energyInRange.sort((lhs, rhs) => lhs.position.length - rhs.position.length)
  const closestEnergy = energyInRange[0]

  if (closestEnergy != null) {
    if (closestEnergy.position.length < agentApi.radius * 2) {
      agentApi.absorb(closestEnergy.id, agentApi.capacity)
    } else {
      agentApi.move(closestEnergy.position.normalized.multiply(0.0001))
    }
  }

  agentApi.say(`${Math.ceil(agentApi.energyAmount)}`)
}

export const createSimpleSelfReplicationAgent = (position: Vector, capacity = 100): Agent => {
  const agent = new Agent(position, {
    capacity,
    accessControl: "Inaccessible",
    assemblePower: 5,
    disassemblePower: 5,
    numberOfConnectors: 2,
    movePower: 10,
    senseRange: 100,
    software: software1,
  })

  agent.energyAmount = agent.capacity * 0.8

  return agent
}
