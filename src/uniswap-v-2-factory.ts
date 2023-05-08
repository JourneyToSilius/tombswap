import { PairCreated as PairCreatedEvent } from "../generated/UniswapV2Factory/UniswapV2Factory"
import { PairCreated, Pair } from "../generated/schema"
import { BigInt, ethereum } from "@graphprotocol/graph-ts"
import { UniswapV2Pair as PairTemplate } from "../generated/templates"

export function handlePairCreated(event: PairCreatedEvent): void {
  // Create a new PairCreated entity
  let pairCreated = new PairCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  pairCreated.token0 = event.params.token0
  pairCreated.token1 = event.params.token1
  pairCreated.pair = event.params.pair
  pairCreated.param3 = event.params.param3
  pairCreated.blockNumber = event.block.number
  pairCreated.blockTimestamp = event.block.timestamp
  pairCreated.transactionHash = event.transaction.hash
  pairCreated.save()

  // Create a new Pair entity and assign it to the PairTemplate
  let pair = new Pair(event.params.pair.toHex())
  PairTemplate.create(event.params.pair)

  if (!pair) {
    pair = new Pair(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    pair.count = BigInt.fromI32(0)

    //set reserves to 0
    pair.reserve0 = BigInt.fromI32(0)
    pair.reserve1 = BigInt.fromI32(0)
  }

  //  fields can be set based on event parameters
  pair.token0 = event.params.token0
  pair.token1 = event.params.token1

  PairTemplate.create(event.params.pair)
  // Entities can be written to the store with `.save()`
  pair.save()

}

