import * as dotenv from "dotenv"

import { HardhatUserConfig } from "hardhat/config";
import '@nomiclabs/hardhat-ethers'
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat"
import "@nomicfoundation/hardhat-toolbox"
import "solidity-coverage"
import "hardhat-gas-reporter"
import "hardhat-contract-sizer"

dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',],
      allowUnlimitedContractSize: true
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    }
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
    gasPriceApi: "etherscan",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      }
    }
  }
};

export default config;