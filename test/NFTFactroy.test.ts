import chai from "chai"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";



describe("ChainBridge contract", function () {

  let NFTFactory
  let NFTFactoryInstance : Contract
  let Owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function() {
    [Owner, user1, user2] = await ethers.getSigners();

    NFTFactory = await ethers.getContractFactory("NFTFactory");
    NFTFactoryInstance = await NFTFactory.deploy({ gasLimit: 30000000});
    await NFTFactoryInstance.deployed();

    await NFTFactoryInstance
  });

    describe("Functions tests", function() {
        it("Should return Owner addres as an 'owner'", async function() {
            expect(await NFTFactoryInstance.owner()).to.equal(Owner.address)
        })

        it("Only Owner can set 'tradeAddress' using setTradeAdress function", async function () {
            expect(NFTFactoryInstance.connect(user1).setTradeAddress(user1.address)).to.be.reverted
        })

        it("Owner can set 'tradeAddress' using 'setTradeAdress' function", async function () {
            await NFTFactoryInstance.connect(Owner).setTradeAddress(user1.address)
            expect(await NFTFactoryInstance.tradeAddress()).to.be.equal(user1.address)
        })

        it("Anyone can create and deploy ERC721 using 'createERC721' function", async function () {
            // first it needs to set 'tradeAddress' 
            await NFTFactoryInstance.connect(Owner).setTradeAddress(user1.address)

            const name = "GunGirls"
            const symbol = "GNG"
            const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
            const price = 100
            const percentFee = 5000
            const amount = 1
            const salt = 1

            const predictedERC721address = await NFTFactoryInstance.predictAddress(
                name,
                symbol,
                baseURI,
                user1.address,
                price,
                percentFee,
                amount,
                salt
            )

            const tx = await NFTFactoryInstance.createERC721(
                name,
                symbol,
                baseURI,
                user1.address,
                price,
                percentFee,
                amount,
                salt
            )
            const txInfo = await tx.wait();
            const newERC721address = txInfo.events[5].args.newNFTAddress
            
            console.log(newERC721address)
            expect(newERC721address).to.be.equal(predictedERC721address)
        })
    })
})
