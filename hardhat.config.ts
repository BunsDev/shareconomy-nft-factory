import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';

dotenv.config();

const proxyAddress = "0xb8726A1dc696f44E74cf47f8Bbd1b0056184C223"

task("upgrade", "Upgrades NFT contract")
    .setAction(async (taskArgs, hre) => {
        console.log("Starting upgrade...")
        const NFT2 = await hre.ethers.getContractFactory('NFT2')
        const nft = await hre.upgrades.upgradeProxy(proxyAddress, NFT2)
        await nft.deployed()
        console.log(nft)
        console.log("NFT contract has been upgraded", nft.address)
})

const config: HardhatUserConfig = {
  networks: {
    matic: {
      url: "https://matic-mumbai.chainstacklabs.com/",
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
  solidity: "0.8.9",
};

export default config;