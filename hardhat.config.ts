import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import '@openzeppelin/hardhat-upgrades';
import '@nomicfoundation/hardhat-toolbox'
import "hardhat-contract-sizer";
dotenv.config();

import "./tasks/Testing.task"

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_KEY}`,
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: 8000000
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_KEY}`,
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    },
    hardhat: {
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN_KEY !== undefined ? process.env.ETHERSCAN_KEY : "",
      polygon: process.env.ETHERSCAN_KEY !== undefined ? process.env.ETHERSCAN_KEY : ""
    }
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: process.env.COINMARKET_KEY,
    currency: 'USD',
    token: 'MATIC',
    gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
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