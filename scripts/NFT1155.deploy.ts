import hre from 'hardhat';
import { upgrades } from "hardhat";
const ethers = hre.ethers;

async function main() {
  const ERC1155 = await ethers.getContractFactory('ERC1155');
  const nft = await upgrades.deployProxy(ERC1155, ["proxy1155", "P1155", "", "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509", 0, [], []], { kind: 'uups'});
  await nft.deployed();
  // console.log(nft);
  console.log("Proxy deployed at ", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
