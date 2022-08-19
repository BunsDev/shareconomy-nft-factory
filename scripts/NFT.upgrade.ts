import hre from 'hardhat';
import { upgrades } from "hardhat";
const ethers = hre.ethers;

async function main() {
  const ERC1155 = await ethers.getContractFactory('ERC1155');
  console.log("Upgrading...")
  const nft = await upgrades.upgradeProxy("0x516DEC8F97D926942070Fc55679Bcc364A95641D", ERC1155);
  const tx = await nft.wait()
  console.log(tx)
  console.log("New implementation deployed at ", tx.events);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
