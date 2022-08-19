import hre from 'hardhat';
import { upgrades } from "hardhat";
const ethers = hre.ethers;

async function main() {
  const ERC721 = await ethers.getContractFactory('ERC721');
  const nft = await upgrades.deployProxy(ERC721, ["proxy721", "P721", "", "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509", 0, 0], { kind: 'uups'});
  await nft.deployed();
  // console.log(nft);
  console.log("Implementation deployed at ", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
