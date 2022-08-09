import chai from "chai"
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { upgrades } from "hardhat";
import { Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi } from "../artifacts/contracts/ERC1155.sol/ERC1155.json";
import proxyDeployData from "../.openzeppelin/unknown-31337.json";

describe("NFTFactory contract", function () {

  let NFTFactory;
  let NFTFactoryInstance : Contract;
  let ERC1155;
  let ERC1155Proxy : Contract;
  let Marketplace;
  let MarketplaceInstance: Contract;
  let Owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let newERC1155address: any;

  const implementation = proxyDeployData.impls["3108c483120870e6f6ca1b850f3002e98149389824612d55b71faff722607aff"].address

  const name = "GunGirls"
  const symbol = "GNG"
  const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
  const percentFee = 5000
  const salt = 1

  before(async function() {
    [Owner, user1, user2] = await ethers.getSigners();

    const args = [
      "GunGirls",
      "GNG",
      "Somestring",
      user1.address,
      100
    ]

    ERC1155 = await ethers.getContractFactory("ERC1155")
    ERC1155Proxy = await upgrades.deployProxy(ERC1155, args, { kind: 'uups'})
    await ERC1155Proxy.deployed();

    NFTFactory = await ethers.getContractFactory("NFTFactory");
    NFTFactoryInstance = await NFTFactory.deploy();
    await NFTFactoryInstance.deployed();

    Marketplace = await ethers.getContractFactory("Marketplace");
    MarketplaceInstance = await Marketplace.deploy();
    await MarketplaceInstance.deployed();

    await NFTFactoryInstance.setImplementation(implementation)
    await NFTFactoryInstance.setMarketplace(MarketplaceInstance.address)
  });

    it("Should return Owner addres as an 'owner'", async function() {
        expect(await NFTFactoryInstance.owner()).to.equal(Owner.address)
    })

    it("Anyone can create and deploy ERC1155 using 'createERC1155' function", async function () {
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
        newERC1155address = txInfo.events[6].args.newNFTAddress

        expect(newERC1155address).to.be.equal(predictedERC1155address)
    })

    it("Getting 'name' from created ERC1155 contract", async function () {
      const implementationInstance = await ethers.getContractAt(abi, newERC1155address, Owner)
      expect(await implementationInstance.name()).to.be.equal(name)
  })

    it("Minting tokens on new ERC1155 with 'mintBatch' function", async function () {
      const ids = [0,1,2,3,4,5]
      const amounts = [1,10,20,30,40,50]
      const implementationInstance = await ethers.getContractAt(abi, newERC1155address, user1)
      await implementationInstance.connect(user1).mintBatch(user1.address, ids, amounts)
      const batchOfaddresses = Array(6).fill(user1.address)
      let balanceOfBatch = await implementationInstance.balanceOfBatch(batchOfaddresses, ids)
      balanceOfBatch = balanceOfBatch.map((idBalance: any) => parseInt(idBalance._hex))
      expect(balanceOfBatch).to.deep.equal(amounts)
  })

  it("Can list tokens to Marketplace contract without 'setApprovalForAll'", async function () {
    const expectedOrderInfo = [25, 10000, percentFee, user1.address, "0x0000000000000000000000000000000000000000", false]

    await MarketplaceInstance.connect(user1).addOrder(newERC1155address, 5, expectedOrderInfo[0], expectedOrderInfo[1])
    const rawOrderInfo = await MarketplaceInstance.NFTOrders(newERC1155address, user1.address, 5)

    const formatedOrderInfo = []
    formatedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.amount,0))
    formatedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI,0))
    formatedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
    formatedOrderInfo.push(rawOrderInfo.seller)
    formatedOrderInfo.push(rawOrderInfo.buyer)
    formatedOrderInfo.push(rawOrderInfo.sellerAccepted)

    expect(expectedOrderInfo).to.deep.equal(formatedOrderInfo)
  })

})

