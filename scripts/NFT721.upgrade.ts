import hre, {run} from 'hardhat';
import { upgrades } from "hardhat";
const ethers = hre.ethers;
import proxyDeployData from "../.openzeppelin/polygon.json";

async function main() {
  const ERC721ProxyAddress = Object.values(proxyDeployData.proxies)[1].address
  const ERC721= await ethers.getContractFactory('ERC721');
  console.log("Upgrading...")
  const nft = await upgrades.upgradeProxy(ERC721ProxyAddress, ERC721);
  console.log("New implementation deployed, proxy at", nft.deployTransaction.);
}

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...")
  try {
    await run("verify:verify",
        {
          address: contractAddress,
          constructorArguments: args,
        })
  } catch(e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!")
    } else {
      console.log(e)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
