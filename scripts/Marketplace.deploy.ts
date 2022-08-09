import hre from 'hardhat';
const ethers = hre.ethers;

async function main() {
  const Marketplace = await ethers.getContractFactory('Marketplace');
  console.log("Deploying...")
  const marketplace = await Marketplace.deploy();
  await marketplace.deployed();
  console.log("Marketplace deployed at ", marketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
