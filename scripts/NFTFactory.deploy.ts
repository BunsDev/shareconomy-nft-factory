import { run } from "hardhat"
import hre from 'hardhat';
const ethers = hre.ethers;

const args: string[] = [
  "0x4f2E92843822096518509700C418a31601E9cA51",
  "0x861b7639aA220DE621428BeC338696ef0c231Aaf",
  "0xFF58007B41399A5629922d1aBc6430d97371D64c",
  "0xdEE581E5b5905F1cE77CeFd3cF7444aDA570D0ef"
]

async function main() {
  const [owner] = await ethers.getSigners()
  const NFTFactory = await ethers.getContractFactory('NFTFactory', owner)
  console.log("Deploying contract...")
  const nftfactory = await NFTFactory.deploy(...args)
  await nftfactory.deployed()
  console.log("NFTFactory contract has been deployed at", nftfactory.address)

  await nftfactory.deployTransaction.wait(6)
  await verify(nftfactory.address, args)
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
