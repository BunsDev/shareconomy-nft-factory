import hre from 'hardhat';
const ethers = hre.ethers;
import {run} from "hardhat";

async function main() {
  const Marketplace721 = await ethers.getContractFactory('Marketplace721');
  console.log("Deploying...")
  const marketplace = await Marketplace721.deploy();
  await marketplace.deployed();
  console.log("Marketplace deployed at", marketplace.address);

  await marketplace.deployTransaction.wait(6)
  await verify(marketplace.address, [])
}

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...")
  try {
    await run("verify:verify", {
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
