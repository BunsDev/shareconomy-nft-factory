import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
dotenv.config();

import "./tasks/Testing.task"

const config: HardhatUserConfig = {
  networks: {
    matic: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: 8000000
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN_KEY !== undefined ? process.env.ETHERSCAN_KEY : "",
    }
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: process.env.COINMARKET_KEY,
    currency: 'USD',
    token: 'ETH',
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
};

export default config;