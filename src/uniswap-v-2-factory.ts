import { PairCreated  } from "../generated/UniswapV2Factory/UniswapV2Factory"
import { Pair} from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"
import { UniswapV2Pair as PairTemplate } from "../generated/templates"
import {
  Sync
} from "../generated/templates/UniswapV2Pair/UniswapV2Pair"

export function handlePairCreated(event: PairCreated): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let pair = Pair.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!pair) {
    pair = new Pair(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    pair.count = BigInt.fromI32(0)

    //set reserves to 0
    pair.reserve0 = BigInt.fromI32(0)
    pair.reserve1 = BigInt.fromI32(0)
  }

  pair.count = pair.count.plus(BigInt.fromI32(1))

  //  fields can be set based on event parameters
  pair.token0 = event.params.token0
  pair.token1 = event.params.token1

  PairTemplate.create(event.params.pair)
  // Entities can be written to the store with `.save()`
  pair.save()

}

export function handleSync(event: Sync): void {
    
  let pair = Pair.load(event.address.toHex())
   
  if(pair) {
    pair.reserve0 = BigInt.fromI32(event.params.reserve0.toI32())
    pair.reserve1 = BigInt.fromI32(event.params.reserve1.toI32())
    pair.save()
  }
}
