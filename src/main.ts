import axios, { AxiosResponse } from "axios";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import fs from "fs";
const TokenSetABI = require(`../abi/TokenSetABI.json`);
const ERC20ABI = require(`../abi/ERC20.json`);
const TOKENSET_ADDRESS = "0xf2aa5ccea80c246a71e97b418173fcc956408d3f";
const ADDRESSES = [
  "0x25ad32265c9354c29e145c902ae876f6b69806f2", //# Alpha Portfolio
  "0x71b41b3b19aac53ca4063aec2d17fc3caeb38026", //# Macro Trend BTC
  "0x72Ca52512b93E8D67309aF0C14C1A225bcbd3548", //# Macro Trend ETH
  "0xabcc2102065ba01c6df1a5a5a57158f452403b70", //# Quantum Momentum BTC
  "0x9984d846a3dc77aa0488f3758976b149e8475995", //# Quantum Momentum ETH
  "0x20ab4cb8f8da39582bc92da954ab1bb128f4e244", //# Quantum Momentum MATIC
  "0x58f7C5707Ba8E09B5e61ceBe8821f65434372344", //# Buy the Dip BTC
  "0x07A79127182a1c303d11eCDa951310EC1C2E1444", //# Buy the Dip ETH
  "0xb87352B4C3EB9daEd09cD4996dFf85c122394912", //# Buy the Dip MATIC
  "0xf2aa5ccea80c246a71e97b418173fcc956408d3f", //# Discretionary BTC
  "0x72b467cacbdbec5918d8eec0371ca33e6fd42421", //# Discretionary ETH
  "0xab80a6e2909c8089ebd84f331c05bbefa3276cd2", //# Discretionary MATIC
  "0x62135f85899d97aed95f4405d710208e68b99f39", //# DeFi Value Index
  "0xB4f78a05ab16CD3e6d0100112D0CC431942859Bb", //# BTC Momentum Index
  "0xd3ef811331a98d24a2B2FB64cEBeEa5aF31b2568", //# ETH Momentum Index
  "0xDFdDd9811796F72bA32a031724f5B1403CD48B91", //# MATIC Momentum Index
  "0xB5253C58b8a361d9901922b23eC9fB9E7d38C98a", //# DPI Momentum Index
  "0xad2b726fd2bd3a7f8f4b3929152438eba637ef19", //# SWD Momentum Index
  "0x55a40b33CFf2eb062e7aa76506B7De711F2B2aff", //# Polygon Ecosystem Index
]; //# contract addresS

// Init new web3 Client with Ankr
const web3 = new Web3(
  "wss://rpc.ankr.com/polygon/ws/4bacdd2101497335fad3edece2dfef08b2dbf1a88a57b4764761590bb3fa1544"
);

// Get curent TokenSet Psitions
const getTokenSetPositions = (contract_addr: string) => {
  const token = new web3.eth.Contract(TokenSetABI as AbiItem[], contract_addr);

  const res = token.methods.getPositions().call(function (err: any, res: any) {
    if (err) {
      console.log("An error occured", err);
    }
    return res;
  });
  return res;
};

// Loop trough TokenSets Positions, get size and address of asset
const processTSRes = async (res: any): Promise<number> => {
  var total = 0;
  if (res.lenght == 0) {
    return 0;
  }
  for (const t of res) {
    var addr = t[0];
    var size = t[2];
    // Getting price for said asset
    if (size == 0) {
    } else if (addr == "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
      // if addr == USDC... No need to catch USDC price
      total += size / 10 ** 6;
    } else {
      const sum = await getTokenPrice(addr)
        .then((tokenPrice: number[]) => {
          return +tokenPrice[0] * (size / tokenPrice[1]);
        })
        .catch((err) => console.log(err));
      total += sum || 0; // Adding sum to total
    }
  }
  return total;
};

// Get TokenPrice for address
const getTokenPrice = async (addr: string): Promise<any> => {
  const contract = new web3.eth.Contract(ERC20ABI as AbiItem[], addr);
  const decimals = await contract.methods
    .decimals()
    .call(function (err: any, res: any) {
      if (err) {
        console.log("An error occured", err);
      }
      return res;
    });
  var n = 10 ** decimals;
  const price = axios
    .get(
      `https://polygon.api.0x.org/swap/v1/price?buyToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&sellToken=${addr}&sellAmount=${n}`
    )
    .then((response) => {
      const res = response;
      return [res["data"]["price"], n]; // return price and decimals
    })
    .catch((err) => console.log(err.response.data));
  return price; // returns [price, decimals] returned from const price = axios
};

// Main function => Get TokenSet Porsitions, parse to pricessTSRes and then print result
const main = () => {
  for (const address of ADDRESSES) {
    getTokenSetPositions(address)
      .then(async (res: any) => {
        const result = await processTSRes(res);
        console.log(`${address}: ${result}`);
      })
      .catch((err: any) => console.log(err));
  }
};
main();
