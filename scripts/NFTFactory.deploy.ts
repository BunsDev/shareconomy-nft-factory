import { run } from "hardhat"
import hre from 'hardhat';
const ethers = hre.ethers;

async function main() {
  const [owner] = await ethers.getSigners()

  const NFTFactory = await ethers.getContractFactory('NFTFactory', owner)
  const nftfactory = await NFTFactory.deploy()
  await nftfactory.deployed()
  console.log("NFTFactory contract has been deployed at", nftfactory.address)
}

async function verify(contractAddress: string, args: any) {
  console.log("Verifying contract...")
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (e) {
    let errorMessage = "Failed to verified";
    if (e instanceof Error) {
      errorMessage = e.message;

      if (e.message.toLowerCase().includes("already veridied")) {
        errorMessage = "Already verified!"
      }
      console.log(errorMessage)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
