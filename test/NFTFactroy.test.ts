import chai from "chai"
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { upgrades } from "hardhat";
import { BigNumber, Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi } from "../artifacts/contracts/ERC1155.sol/ERC1155.json"

describe("NFTFactory contract", function () {

  let NFTFactory;
  let NFTFactoryInstance : Contract;
  let ERC1155;
  let ERC1155Proxy : Contract;
  let Owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const args = [
    "GunGirls",
    "GNG",
    "Somestring",
    "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509",
    100
  ]

  before(async function() {
    [Owner, user1, user2] = await ethers.getSigners();

    ERC1155 = await ethers.getContractFactory("ERC1155")
    ERC1155Proxy = await upgrades.deployProxy(ERC1155, args, { kind: 'uups'})
    await ERC1155Proxy.deployed();

    NFTFactory = await ethers.getContractFactory("NFTFactory");
    NFTFactoryInstance = await NFTFactory.deploy({ gasLimit: 30000000});
    await NFTFactoryInstance.deployed();
  });

    it("Should return Owner addres as an 'owner'", async function() {
        expect(await NFTFactoryInstance.owner()).to.equal(Owner.address)
    })

    it("Anyone can create and deploy ERC1155 using 'createERC1155' function", async function () {
        const name = "GunGirls"
        const symbol = "GNG"
        const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
        const percentFee = 5000
        const salt = 1

        await NFTFactoryInstance.setImplementation("0x5FbDB2315678afecb367f032d93F642f64180aa3")
        const predictedERC1155address = await NFTFactoryInstance.predictAddress(salt)

        const tx = await NFTFactoryInstance.createERC1155(
            name,
            symbol,
            baseURI,
            user1.address,
            percentFee,
            salt
        )
        const txInfo = await tx.wait();
        const newERC1155address = txInfo.events[6].args.newNFTAddress
      
        expect(newERC1155address).to.be.equal(predictedERC1155address)
    })

    it("Getting 'name' from created ERC1155 contract", async function () {
      const name = "GunGirls"
      const symbol = "GNG"
      const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
      const percentFee = 5000
      const salt = 1

      await NFTFactoryInstance.setImplementation("0x5FbDB2315678afecb367f032d93F642f64180aa3")

      const tx = await NFTFactoryInstance.createERC1155(
          name,
          symbol,
          baseURI,
          user1.address,
          percentFee,
          salt
      )
      const txInfo = await tx.wait();
      const newERC1155address = txInfo.events[6].args.newNFTAddress

      console.log(newERC1155address)
      const newERC1155instance = await ethers.getContractAt(abi, newERC1155address, Owner)
      console.log(newERC1155instance)
      expect(await newERC1155instance.name()).to.be.equal(name)
  })
})

