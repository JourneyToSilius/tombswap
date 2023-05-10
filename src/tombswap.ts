import { PairCreated } from "../generated/UniswapV2Factory/UniswapV2Factory"
import { ERC20Token } from "../generated/UniswapV2Factory/ERC20Token"
import { UniswapV2Factory } from "../generated/UniswapV2Factory/UniswapV2Factory"
import { UniswapV2Pair } from "../generated/UniswapV2Factory/UniswapV2Pair"

import { Factory, Pair, Token0, Token1, Reserves } from "../generated/schema"
import { dataSource } from "@graphprotocol/graph-ts";

import { UniswapV2Pair as PairTemplate } from "../generated/templates"
import { Sync } from "../generated/templates/UniswapV2Pair/UniswapV2Pair"

import { BigInt } from "@graphprotocol/graph-ts"
import { BigDecimal } from '@graphprotocol/graph-ts';




export function handlePairCreated(event: PairCreated): void {

    PairTemplate.create(event.params.pair);

    const id = event.params.pair.toHex();

    // Add a new factory entity to the store if it doesn't exist
    let factory = Factory.load(dataSource.address().toHexString());
    if (factory == null) {
        factory = new Factory(dataSource.address().toHexString());
    }

    let pair = Pair.load(id);

    if (!pair) {
        pair = new Pair(id);

        // Load the ERC20 token contracts for each token in the pair
        let token0Contract = ERC20Token.bind(event.params.token0);
        let token1Contract = ERC20Token.bind(event.params.token1);

        // Get the symbol, name, and decimals for each token
        let token0Symbol = token0Contract.symbol();
        let token1Symbol = token1Contract.symbol();
        let token0Name = token0Contract.name();
        let token1Name = token1Contract.name();
        let token0Decimals = token0Contract.decimals();
        let token1Decimals = token1Contract.decimals();

        // Create new Token entities for each token in the pair
        let token0 = Token0.load(event.params.token0.toHex());
        if (!token0) {
            token0 = new Token0(event.params.token0.toHex());
            token0.symbol = token0Symbol;
            token0.name = token0Name;
            token0.decimals = token0Decimals;

        }

        let token1 = Token1.load(event.params.token1.toHex());
        if (!token1) {
            token1 = new Token1(event.params.token1.toHex());
            token1.symbol = token1Symbol;
            token1.name = token1Name;
            token1.decimals = token1Decimals;

        }
        // Save the Token entities to the store
        token0.save();
        token1.save();

        factory.name = "equalizer"

        let binded_pair = UniswapV2Pair.bind(event.params.pair)
        pair.symbol = binded_pair.symbol();
        pair.name = binded_pair.name();

        pair.token0 = token0.id;
        pair.token1 = token1.id;
        pair.factory = factory.id
        pair.reserves = []
   
        factory.save();
        pair.save();

    }
}

export function handleSync(event: Sync): void {
    // Load the Pair entity using the pair address
    let pair = Pair.load(event.address.toHex());

    // If the pair entity exists, create a new reserve object and append the corresponding pair to it
    if (pair != null) {
        let reserves = new Reserves(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
        reserves.reserve0 = event.params.reserve0;
        reserves.reserve1 = event.params.reserve1;
        reserves.timestamp = event.block.timestamp // Set the block timestamp
        reserves.block = event.block.number // Set the block number
        
        let token0ReserveDecimal = BigDecimal.fromString(reserves.reserve0.toString())
        let token1ReserveDecimal =  BigDecimal.fromString(reserves.reserve1.toString())
        
        reserves.token0xtoken1 = token0ReserveDecimal.div(token1ReserveDecimal);
        reserves.token1xtoken0 = token1ReserveDecimal.div(token0ReserveDecimal);
        //save reserves first
        reserves.save();
        // important create a new variable with the pair reserve entity, push and then assign
        let reserves_array = pair.reserves
        reserves_array.push(reserves.id)
        pair.reserves = reserves_array
        //save the pair
        pair.save()

    }
}
