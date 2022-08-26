import {run, upgrades} from "hardhat"
import hre from 'hardhat';
const ethers = hre.ethers;

// const args: string[] = [
//   "0x4f2E92843822096518509700C418a31601E9cA51",
//   "0x861b7639aA220DE621428BeC338696ef0c231Aaf",
//   "0xFF58007B41399A5629922d1aBc6430d97371D64c",
//   "0xdEE581E5b5905F1cE77CeFd3cF7444aDA570D0ef"
// ]

const args: string[] = [
  "0x125281199964620d35d63886F492b79415926661",
  "0xA8547B1e8AD1ceFDC8C0833E711011F37983B96d",
  "0xC30e9c230f782a7A96b8c615f1276564F3d70724",
  "0x09801CF826d876E6cc2aa32f6127b099C8D0EA2C"
]

async function main() {
  const [owner] = await ethers.getSigners()
  const NFTFactory = await ethers.getContractFactory('NFTFactory', owner)
  console.log("Deploying contract...")
  const NFTFactoryProxy = await upgrades.deployProxy(
      NFTFactory,
      args,
      {kind: 'uups'}
  );
  await NFTFactoryProxy.deployed()
  console.log("NFTFactory contract has been deployed at", NFTFactoryProxy.address)

  await NFTFactoryProxy.deployTransaction.wait(6)
  await verify(NFTFactoryProxy.address, args)
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
