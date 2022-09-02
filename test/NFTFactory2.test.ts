import {expect} from "chai";
import {ethers} from "hardhat";
import {upgrades} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import proxyDeployData from "../.openzeppelin/unknown-31337.json";

describe("Upgradeable NFTFactory contract", function () {

    let NFTFactory;
    let NFTFactoryProxy: Contract;
    let ERC1155;
    let ERC1155Proxy: Contract;
    let ERC721;
    let ERC721Proxy: Contract;
    let ERC20;
    let ERC20Proxy: Contract;
    let Marketplace1155;
    let MarketplaceInstance1155: Contract;
    let Marketplace721;
    let MarketplaceInstance721: Contract;
    let Owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    let newERC1155address: any;
    let newERC721address: any;
    let newERC20address: any;

    // const implementation1155 = "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509"
    // const implementation721 = "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509"
    // const implementation20 = "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509"

    const implementation1155 = Object.values(proxyDeployData.impls)[0].address
    const implementation721 = Object.values(proxyDeployData.impls)[1].address
    const implementation20 = Object.values(proxyDeployData.impls)[2].address
    const implementationNFTFactory = Object.values(proxyDeployData.impls)[3].address

    const name = "GunGirls"
    const symbol = "GNG"
    const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
    const percentFee = 5000
    const salt = 1
    const salt2 = 2
    const amount = 10
    const quantity = BigNumber.from("1000000000000000000")
    const zeroAddress = "0x0000000000000000000000000000000000000000"
    const ids = [0, 1, 2, 3, 4, 5]
    const amounts = [1, 10, 20, 30, 40, 50]
    const secondsToEnd = 10000

    before(async function () {
        [Owner, user1, user2, user3] = await ethers.getSigners();

        const args1155 = [
            name,
            symbol,
            baseURI,
            user1.address,
            zeroAddress,
            100,
            [],
            []
        ]

        const args721 = [
            name,
            symbol,
            baseURI,
            user1.address,
            zeroAddress,
            100,
            10
        ]

        const args20 = [
            name,
            symbol,
            user1.address,
            quantity
        ]

        ERC1155 = await ethers.getContractFactory("ERC1155")
        ERC1155Proxy = await upgrades.deployProxy(ERC1155, args1155, {kind: 'uups'})
        await ERC1155Proxy.deployed();

        ERC721 = await ethers.getContractFactory("ERC721")
        ERC721Proxy = await upgrades.deployProxy(ERC721, args721, {kind: 'uups'})
        await ERC721Proxy.deployed();

        ERC20 = await ethers.getContractFactory("ERC20")
        ERC20Proxy = await upgrades.deployProxy(ERC20, args20, {kind: 'uups'})
        await ERC20Proxy.deployed();

        Marketplace1155 = await ethers.getContractFactory("Marketplace1155");
        MarketplaceInstance1155 = await Marketplace1155.deploy();
        await MarketplaceInstance1155.deployed();

        Marketplace721 = await ethers.getContractFactory("Marketplace721");
        MarketplaceInstance721 = await Marketplace721.deploy();
        await MarketplaceInstance721.deployed();

        const argsNFTFactory = [
            MarketplaceInstance1155.address,
            MarketplaceInstance721.address
        ]

        NFTFactory = await ethers.getContractFactory("NFTFactory2");
        NFTFactoryProxy = await upgrades.deployProxy(
            NFTFactory,
            argsNFTFactory,
            {kind: 'uups'}
        );
        await NFTFactoryProxy.deployed();

        await NFTFactoryProxy.setImplementation(1155, implementation1155)
        await NFTFactoryProxy.setImplementation(721, implementation721)
        await NFTFactoryProxy.setImplementation(20, implementation20)
    });

    it("Should return Owner address as an 'owner' of NFTFactory", async function () {
        expect(await NFTFactoryProxy.owner()).to.equal(Owner.address)
    })

    it("'supportInterface' function in ERC20 should return 'true' by passing IERC20 interface id '0x01ffc9a7'", async function () {
        expect(await ERC20Proxy.supportsInterface(0x01ffc9a7)).to.equal(true)
    })

    it("Anyone can create and deploy ERC1155 using 'createContract' function", async function () {
        const predictedERC1155address = await NFTFactoryProxy.predictAddress(1155, salt)

        const tx = await NFTFactoryProxy.createContract(
            1155,
            name,
            symbol,
            baseURI,
            user1.address,
            ERC20Proxy.address,
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
        const predictedERC721address = await NFTFactoryProxy.predictAddress(721, salt)

        const tx = await NFTFactoryProxy.createContract(
            721,
            name,
            symbol,
            baseURI,
            user1.address,
            ERC20Proxy.address,
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

    it("Anyone can create and deploy ERC20 using 'createContract' function", async function () {
        const predictedERC20address = await NFTFactoryProxy.predictAddress(20, salt)

        const tx = await NFTFactoryProxy.createContract(
            20,
            name,
            symbol,
            baseURI,
            user1.address,
            zeroAddress,
            percentFee,
            salt,
            quantity,
            ids,
            amounts
        )
        const txInfo = await tx.wait();
        // console.log(txInfo.events)
        newERC20address = txInfo.events[5].args.contractAddress

        expect(newERC20address).to.be.equal(predictedERC20address)
    })

    it("name' should be equal to name value at created ERC1155 contract", async function () {
        const createdContractInstance = await ethers.getContractAt("ERC1155", newERC1155address, Owner)
        expect(await createdContractInstance.name()).to.be.equal(name)
    })

    it("name' should be equal to name value at created ERC721 contract", async function () {
        const createdContractInstance = await ethers.getContractAt("ERC721", newERC721address, Owner)
        expect(await createdContractInstance.name()).to.be.equal(name)
    })

    it("'name' should be equal to name value at created ERC20 contract", async function () {
        const createdContractInstance = await ethers.getContractAt("ERC20", newERC20address, Owner)
        expect(await createdContractInstance.name()).to.be.equal(name)
    })

    it("Total supply  should be equal to 'quantity' value at created ERC20 contract", async function () {
        const createdContractInstance = await ethers.getContractAt("ERC20", newERC20address, Owner)
        expect(await createdContractInstance.totalSupply()).to.be.equal(quantity)
    })

    it("Owner of created ERC20 contract should be user1 address", async function () {
        const createdContractInstance = await ethers.getContractAt("ERC20", newERC20address, Owner)
        expect(await createdContractInstance.owner()).to.be.equal(user1.address)
    })

    it("Can list ERC1155 NFTs to Marketplace1155 for ERC20 tokens", async function () {
        const expectedOrderInfo = [
            0,
            10000,
            5,
            25,
            percentFee,
            user1.address,
            "0x0000000000000000000000000000000000000000",
            ERC20Proxy.address,
            false
        ]

        const txId = await MarketplaceInstance1155.connect(user1).addOrder(
            newERC1155address,
            expectedOrderInfo[2],
            expectedOrderInfo[3],
            expectedOrderInfo[1],
            "erc20"
        )
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawOrderInfo = await MarketplaceInstance1155.getOrder(
            newERC1155address,
            +ethers.utils.formatUnits(txInfo.events[1].args.orderId)
        )
        // console.log(rawOrderInfo)

        const formattedOrderInfo = []
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.orderId,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.price,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.tokenId,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.amount,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
        formattedOrderInfo.push(rawOrderInfo.seller)
        formattedOrderInfo.push(rawOrderInfo.buyer)
        formattedOrderInfo.push(rawOrderInfo.erc20)
        formattedOrderInfo.push(rawOrderInfo.sellerAccepted)
        // console.log(formattedOrderInfo)

        expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
    })

    it("Can list ERC721 NFTs to Marketplace721 for ERC20 tokens", async function () {
        const expectedOrderInfo = [
            0,
            10000,
            5,
            percentFee,
            user1.address,
            "0x0000000000000000000000000000000000000000",
            ERC20Proxy.address,
            false
        ]

        const txId = await MarketplaceInstance721.connect(user1).addOrder(
            newERC721address,
            expectedOrderInfo[2],
            expectedOrderInfo[1],
            "erc20"
        )
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawOrderInfo = await MarketplaceInstance721.getOrder(
            newERC721address,
            +ethers.utils.formatUnits(txInfo.events[2].args.orderId)
        )
        // console.log(rawOrderInfo)

        const formattedOrderInfo = []
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.orderId,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.price,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.tokenId,0))
        formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee,0))
        formattedOrderInfo.push(rawOrderInfo.seller)
        formattedOrderInfo.push(rawOrderInfo.buyer)
        formattedOrderInfo.push(rawOrderInfo.erc20)
        formattedOrderInfo.push(rawOrderInfo.sellerAccepted)
        // console.log(formattedOrderInfo)

        expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
    })

    it("Another user can redeem order with ERC20 of ERC1155 collection at Marketplace1155", async function () {
        let rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)
        await ERC20Proxy.transfer(user2.address, +ethers.utils.formatUnits(rawOrderInfo.price,0))
        await ERC20Proxy.connect(user2).approve(MarketplaceInstance1155.address, +ethers.utils.formatUnits(rawOrderInfo.price,0))
        await MarketplaceInstance1155.connect(user2).redeemOrder(newERC1155address, 0)

        rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)

        expect(rawOrderInfo.buyer).to.equal(user2.address)
    })

    it("Another user can redeem order with ERC20 of ERC721 collection at Marketplace721", async function () {
        let rawOrderInfo = await MarketplaceInstance721.getOrder(newERC721address, 0)
        await ERC20Proxy.transfer(user2.address, +ethers.utils.formatUnits(rawOrderInfo.price,0))
        await ERC20Proxy.connect(user2).approve(MarketplaceInstance721.address, +ethers.utils.formatUnits(rawOrderInfo.price,0))
        await MarketplaceInstance721.connect(user2).redeemOrder(newERC721address, 0)

        rawOrderInfo = await MarketplaceInstance721.getOrder(newERC721address, 0)

        expect(rawOrderInfo.buyer).to.equal(user2.address)
    })

    it("If order redeemed Seller can accept it on Marketplace1155", async function () {
        await MarketplaceInstance1155.connect(user1).acceptOrder(newERC1155address, 0, true)
        const rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)

        expect(rawOrderInfo.sellerAccepted).to.equal(true)
    })

    it("If order redeemed Seller can accept it on Marketplace721", async function () {
        await MarketplaceInstance721.connect(user1).acceptOrder(newERC721address, 0, true)
        const rawOrderInfo = await MarketplaceInstance721.getOrder(newERC721address, 0)

        expect(rawOrderInfo.sellerAccepted).to.equal(true)
    })

    it("If Seller accepted order, it can be completed by anyone on Marketplace1155", async function () {
        await MarketplaceInstance1155.completeOrder(newERC1155address, 0)

        const sellerBalanceERC20 = await ERC20Proxy.balanceOf(user1.address)
        expect(sellerBalanceERC20).to.equal("10000")

        const createdContractInstance = await ethers.getContractAt("ERC1155", newERC1155address, Owner)
        const buyerBalanceERC1155 = await createdContractInstance.balanceOf(user2.address, 5)
        expect(buyerBalanceERC1155).to.equal("25")
    })

    it("If Seller accepted order, it can be completed by anyone on Marketplace721", async function () {
        await MarketplaceInstance721.completeOrder(newERC721address, 0)

        const sellerBalanceERC20 = await ERC20Proxy.balanceOf(user1.address)
        expect(sellerBalanceERC20).to.equal("20000")

        const createdContractInstance = await ethers.getContractAt("ERC721", newERC721address, Owner)
        const ownerOfNFT = await createdContractInstance.ownerOf(5)
        expect(ownerOfNFT).to.equal(user2.address)
    })

    it("Can list ERC1155 NFTs on auction to Marketplace1155 for ERC20 tokens", async function () {
        const expectedAuctionInfo = [
            0,
            10000,
            5,
            25,
            percentFee,
            "0x0000000000000000000000000000000000000000",
            user1.address,
            ERC20Proxy.address,
        ]

        const txId = await MarketplaceInstance1155.connect(user1).startAuction(
            newERC1155address,
            expectedAuctionInfo[2],
            expectedAuctionInfo[3],
            expectedAuctionInfo[1],
            secondsToEnd,
            "erc20"
        )
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawAuctionInfo = await MarketplaceInstance1155.getAuction(
            newERC1155address,
            +ethers.utils.formatUnits(txInfo.events[1].args.auctionId)
        )
        // console.log(rawAuctionInfo)

        const formattedAuctionInfo = []
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.auctionId,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.bestBid,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.tokenId,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.amount,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.percentFee,0))
        formattedAuctionInfo.push(rawAuctionInfo.bestBidder)
        formattedAuctionInfo.push(rawAuctionInfo.seller)
        formattedAuctionInfo.push(rawAuctionInfo.erc20)
        // console.log(formattedAuctionInfo)

        expect(expectedAuctionInfo).to.deep.equal(formattedAuctionInfo)
    })

    it("Can list ERC721 NFTs on auction to Marketplace721 for ERC20 tokens", async function () {
        const expectedAuctionInfo = [
            0,
            10000,
            4,
            percentFee,
            "0x0000000000000000000000000000000000000000",
            user1.address,
            ERC20Proxy.address,
        ]

        const txId = await MarketplaceInstance721.connect(user1).startAuction(
            newERC721address,
            expectedAuctionInfo[2],
            expectedAuctionInfo[1],
            secondsToEnd,
            "erc20"
        )
        const txInfo = await txId.wait()
        // console.log(txInfo.events)

        const rawAuctionInfo = await MarketplaceInstance721.getAuction(
            newERC721address,
            +ethers.utils.formatUnits(txInfo.events[2].args.auctionId)
        )
        // console.log(rawAuctionInfo)

        const formattedAuctionInfo = []
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.auctionId,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.bestBid,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.tokenId,0))
        formattedAuctionInfo.push(+ethers.utils.formatUnits(rawAuctionInfo.percentFee,0))
        formattedAuctionInfo.push(rawAuctionInfo.bestBidder)
        formattedAuctionInfo.push(rawAuctionInfo.seller)
        formattedAuctionInfo.push(rawAuctionInfo.erc20)
        // console.log(formattedAuctionInfo)

        expect(expectedAuctionInfo).to.deep.equal(formattedAuctionInfo)
    })

    it("Another user can make a bid for an auction with ERC20 of ERC1155 NFTs at Marketplace1155", async function () {
        let rawAuctionInfo = await MarketplaceInstance1155.getAuction(newERC1155address, 0)
        const betterBid = 1 + ethers.utils.formatUnits(rawAuctionInfo.bestBid,0)
        await ERC20Proxy.transfer(user2.address, betterBid)
        await ERC20Proxy.connect(user2).approve(MarketplaceInstance1155.address, betterBid)
        await MarketplaceInstance1155.connect(user2).makeBid(newERC1155address, 0)

        rawAuctionInfo = await MarketplaceInstance1155.getAuction(newERC1155address, 0)

        expect(rawAuctionInfo.bestBidder).to.equal(user2.address)
        expect(rawAuctionInfo.bestBid).to.equal(betterBid)
    })

    it("Another user can make a bid for an auction with ERC20 of ERC721 NFTs at Marketplace721", async function () {
        let rawAuctionInfo = await MarketplaceInstance721.getAuction(newERC721address, 0)
        const betterBid = 1 + ethers.utils.formatUnits(rawAuctionInfo.bestBid,0)
        await ERC20Proxy.transfer(user2.address, betterBid)
        await ERC20Proxy.connect(user2).approve(MarketplaceInstance721.address, betterBid)
        await MarketplaceInstance721.connect(user2).makeBid(newERC721address, 0)

        rawAuctionInfo = await MarketplaceInstance721.getAuction(newERC721address, 0)

        expect(rawAuctionInfo.bestBidder).to.equal(user2.address)
        expect(rawAuctionInfo.bestBid).to.equal(betterBid)
    })

    it("After auction time is passed anyone can complete auction at Marketplace1155 with ERC20 currency", async function () {
        await ethers.provider.send("evm_increaseTime", [secondsToEnd]) // passing auction time
        await ethers.provider.send("evm_mine", []) // mining block with changed 'blocktimestamp'

        await MarketplaceInstance1155.completeAuction(newERC1155address, 0)

        const sellerBalanceERC20 = await ERC20Proxy.balanceOf(user1.address)
        expect(sellerBalanceERC20).to.equal("130000")

        const createdContractInstance = await ethers.getContractAt("ERC1155", newERC1155address, Owner)
        const buyerBalanceERC1155 = await createdContractInstance.balanceOf(user2.address, 5)
        expect(buyerBalanceERC1155).to.equal("50")
    })

    it("After auction time is passed anyone can complete auction at Marketplace721 with ERC20 currency", async function () {
        await ethers.provider.send("evm_increaseTime", [secondsToEnd]) // passing auction time
        await ethers.provider.send("evm_mine", []) // mining block with changed 'blocktimestamp'

        await MarketplaceInstance721.completeAuction(newERC721address, 0)

        const sellerBalanceERC20 = await ERC20Proxy.balanceOf(user1.address)
        expect(sellerBalanceERC20).to.equal("240000")

        const createdContractInstance = await ethers.getContractAt("ERC721", newERC721address, Owner)
        const ownerOfNFT = await createdContractInstance.ownerOf(4)
        expect(ownerOfNFT).to.equal(user2.address)
    })

})