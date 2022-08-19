import chai from "chai"
import {expect} from "chai";
import {ethers} from "hardhat";
import {upgrades} from "hardhat";
import {Contract} from "ethers"
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import proxyDeployData from "../.openzeppelin/unknown-31337.json";

describe("NFTFactory contract", function () {

    let NFTFactory;
    let NFTFactoryInstance: Contract;
    let ERC1155;
    let ERC1155Proxy: Contract;
    let ERC721;
    let ERC721Proxy: Contract;
    let Marketplace1155;
    let MarketplaceInstance1155: Contract;
    let Marketplace721;
    let MarketplaceInstance721: Contract;
    let Owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let newERC1155address: any;
    let newERC721address: any;

    const implementation1155 = Object.values(proxyDeployData.impls)[0].address
    const implementation721 = Object.values(proxyDeployData.impls)[1].address

    const name = "GunGirls"
    const symbol = "GNG"
    const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
    const percentFee = 5000
    const salt = 1
    const amount = 10
    const ids = [0, 1, 2, 3, 4, 5]
    const amounts = [1, 10, 20, 30, 40, 50]

    before(async function () {
        [Owner, user1, user2] = await ethers.getSigners();

        const args1155 = [
            "GunGirls",
            "GNG",
            "Somestring",
            user1.address,
            100,
            [],
            []
        ]

        const args721 = [
            "GunGirls",
            "GNG",
            "Somestring",
            user1.address,
            100,
            10
        ]

        ERC1155 = await ethers.getContractFactory("ERC1155")
        ERC1155Proxy = await upgrades.deployProxy(ERC1155, args1155, {kind: 'uups'})
        await ERC1155Proxy.deployed();

        ERC721 = await ethers.getContractFactory("ERC721")
        ERC721Proxy = await upgrades.deployProxy(ERC721, args721, {kind: 'uups'})
        await ERC721Proxy.deployed();

        Marketplace1155 = await ethers.getContractFactory("Marketplace1155");
        MarketplaceInstance1155 = await Marketplace1155.deploy();
        await MarketplaceInstance1155.deployed();

        Marketplace721 = await ethers.getContractFactory("Marketplace721");
        MarketplaceInstance721 = await Marketplace721.deploy();
        await MarketplaceInstance721.deployed();

        NFTFactory = await ethers.getContractFactory("NFTFactory");
        NFTFactoryInstance = await NFTFactory.deploy(implementation1155, implementation721, MarketplaceInstance1155.address, MarketplaceInstance721.address);
        await NFTFactoryInstance.deployed();
    });

    it("Should return Owner addres as an 'owner'", async function () {
        expect(await NFTFactoryInstance.owner()).to.equal(Owner.address)
    })

    it("Anyone can create and deploy ERC1155 using 'createContract' function", async function () {
        const predictedERC1155address = await NFTFactoryInstance.predictAddress(1155, salt)

        const tx = await NFTFactoryInstance.createContract(
            1155,
            name,
            symbol,
            baseURI,
            user1.address,
            percentFee,
            salt,
            amount,
            ids,
            amounts
        )
        const txInfo = await tx.wait();
        // console.log(txInfo.events)
        newERC1155address = txInfo.events[7].args.contractAddress

        expect(newERC1155address).to.be.equal(predictedERC1155address)
    })

    it("Anyone can create and deploy ERC721 using 'createContract' function", async function () {
        const predictedERC721address = await NFTFactoryInstance.predictAddress(721, salt)

        const tx = await NFTFactoryInstance.createContract(
            721,
            name,
            symbol,
            baseURI,
            user1.address,
            percentFee,
            salt,
            amount,
            ids,
            amounts
        )
        const txInfo = await tx.wait();
        // console.log(txInfo.events)
        newERC721address = txInfo.events[16].args.contractAddress

        expect(newERC721address).to.be.equal(predictedERC721address)
    })

    it("Getting 'name' from created ERC1155 contract", async function () {
        const implementationInstance = await ethers.getContractAt("ERC1155", newERC1155address, Owner)
        expect(await implementationInstance.name()).to.be.equal(name)
    })

    it("Getting 'name' from created ERC721 contract", async function () {
        const implementationInstance = await ethers.getContractAt("ERC721", newERC721address, Owner)
        expect(await implementationInstance.name()).to.be.equal(name)
    })

    it("Minting tokens on new ERC1155 with 'mintBatch' function", async function () {
        const ids = [0, 1, 2, 3, 4, 5]
        const amounts = [1, 10, 20, 30, 40, 50]
        const implementationInstance = await ethers.getContractAt("ERC1155", newERC1155address, user1)
        await implementationInstance.connect(user1).mintBatch(user2.address, ids, amounts)
        const batchOfaddresses = Array(6).fill(user2.address)
        let balanceOfBatch = await implementationInstance.balanceOfBatch(batchOfaddresses, ids)
        balanceOfBatch = balanceOfBatch.map((idBalance: any) => parseInt(idBalance._hex))
        expect(balanceOfBatch).to.deep.equal(amounts)
    })

    it("Minting tokens on new ERC721 with 'mintAmount' function", async function () {
        const amount = 10
        const implementationInstance = await ethers.getContractAt("ERC721", newERC721address, user1)
        await implementationInstance.connect(user1).mintAmount(user2.address, amount)
        let balanceOfUser2 = await implementationInstance.balanceOf(user2.address)
        balanceOfUser2 = parseInt(balanceOfUser2._hex)
        expect(balanceOfUser2).to.be.equal(amount)
    })


    it("Can list tokens to Marketplace1155 contract without 'setApprovalForAll'", async function () {
        const expectedOrderInfo = [25, 10000, percentFee, user2.address, "0x0000000000000000000000000000000000000000", false]

        const txId = await MarketplaceInstance1155.connect(user2).addOrder(newERC1155address, 5, expectedOrderInfo[0], expectedOrderInfo[1])
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, +ethers.utils.formatUnits(txInfo.events[1].args.orderId))
        // console.log(rawOrderInfo)

        const formattedOrderInfo = []
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.amount,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
        formattedOrderInfo.push(rawOrderInfo.seller)
        formattedOrderInfo.push(rawOrderInfo.buyer)
        formattedOrderInfo.push(rawOrderInfo.sellerAccepted)

        expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
    })

    it("Can list tokens to Marketplace721 contract without 'setApprovalForAll'", async function () {
        const expectedOrderInfo = [10, 10000, percentFee, user2.address, "0x0000000000000000000000000000000000000000", false]

        const txId = await MarketplaceInstance721.connect(user2).addOrder(newERC721address, expectedOrderInfo[0], expectedOrderInfo[1])
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawOrderInfo = await MarketplaceInstance721.getOrder(newERC721address, +ethers.utils.formatUnits(txInfo.events[2].args.orderId))
        // console.log(rawOrderInfo)

        const formattedOrderInfo = []
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.tokenId,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
        formattedOrderInfo.push(rawOrderInfo.seller)
        formattedOrderInfo.push(rawOrderInfo.buyer)
        formattedOrderInfo.push(rawOrderInfo.sellerAccepted)

        expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
    })

    it("Can list tokens to Marketplace1155 contract without 'setApprovalForAll'", async function () {
        const expectedOrderInfo = [25, 10000, percentFee, user2.address, "0x0000000000000000000000000000000000000000", false]

        const txId = await MarketplaceInstance1155.connect(user2).addOrder(newERC1155address, 5, expectedOrderInfo[0], expectedOrderInfo[1])
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, +ethers.utils.formatUnits(txInfo.events[1].args.orderId))
        // console.log(rawOrderInfo)

        const formattedOrderInfo = []
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.amount,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
        formattedOrderInfo.push(rawOrderInfo.seller)
        formattedOrderInfo.push(rawOrderInfo.buyer)
        formattedOrderInfo.push(rawOrderInfo.sellerAccepted)

        expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
    })

})

