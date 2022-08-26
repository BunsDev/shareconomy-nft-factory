import chai from "chai"
import {expect} from "chai";
import {ethers} from "hardhat";
import {upgrades} from "hardhat";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import proxyDeployData from "../.openzeppelin/unknown-31337.json";

describe("Upgradeable NFTFactory contract", function () {

    let NFTFactory;
    let NFTFactoryProxy: Contract;
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
    let user3: SignerWithAddress;

    let newERC1155address: any;
    let newERC721address: any;

    // const implementation1155 = "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509"
    // const implementation721 = "0xa162B39F86A7341948A2E0A8DaC3f0DFf071D509"

    const implementation1155 = Object.values(proxyDeployData.impls)[0].address
    const implementation721 = Object.values(proxyDeployData.impls)[1].address
    // const implementationNFTFactory = Object.values(proxyDeployData.impls)[2].address

    const name = "GunGirls"
    const symbol = "GNG"
    const baseURI = "https://gateway.pinata.cloud/ipfs/QmcCnCPnptuxd8b7FWvRuqBMXbxuyVKopp4fTSiXdwUXPU/1"
    const percentFee = 5000
    const salt = 1
    const salt2 = 2
    const amount = 10
    const ids = [0, 1, 2, 3, 4, 5]
    const amounts = [1, 10, 20, 30, 40, 50]

    before(async function () {
        [Owner, user1, user2, user3] = await ethers.getSigners();

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

        const argsNFTFactory = [
            MarketplaceInstance1155.address,
            MarketplaceInstance721.address
        ]

        NFTFactory = await ethers.getContractFactory("NFTFactory");
        NFTFactoryProxy = await upgrades.deployProxy(
            NFTFactory,
            argsNFTFactory,
            {kind: 'uups'}
        );
        await NFTFactoryProxy.deployed();

        await NFTFactoryProxy.setImplementation(1155, implementation1155)
        await NFTFactoryProxy.setImplementation(721, implementation721)
    });

    it("Should return Owner address as an 'owner'", async function () {
        expect(await NFTFactoryProxy.owner()).to.equal(Owner.address)
    })

    it("Anyone can create and deploy ERC1155 using 'createContract' function", async function () {
        const predictedERC1155address = await NFTFactoryProxy.predictAddress(1155, salt)

        const tx = await NFTFactoryProxy.createContract(
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
        const predictedERC721address = await NFTFactoryProxy.predictAddress(721, salt)

        const tx = await NFTFactoryProxy.createContract(
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

    it("First implementation of NFTFactory returns '1' with getVersion() function", async function() {
        expect(parseInt(await NFTFactoryProxy.getVersion())).to.be.equal(1)
    })

    it("Owner can upgrade implementation of NFTFactory, getVersion() function returns '2'", async function() {
        const NFTFactory2 = await ethers.getContractFactory("NFTFactory2")
        await upgrades.upgradeProxy(NFTFactoryProxy.address, NFTFactory2)
        expect(parseInt(await NFTFactoryProxy.getVersion())).to.be.equal(2)
    })


    describe("Testing upgraded NFTFactory V2", function () {
        it("getVersion() function returns '2'", async function() {
            expect(parseInt(await NFTFactoryProxy.getVersion())).to.be.equal(2)
        })

        it("Anyone can create and deploy ERC1155 using 'createContract' function", async function () {
            const predictedERC1155address = await NFTFactoryProxy.predictAddress(1155, salt2)

            const tx = await NFTFactoryProxy.createContract(
                1155,
                name,
                symbol,
                baseURI,
                user1.address,
                percentFee,
                salt2,
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
            const predictedERC721address = await NFTFactoryProxy.predictAddress(721, salt2)

            const tx = await NFTFactoryProxy.createContract(
                721,
                name,
                symbol,
                baseURI,
                user1.address,
                percentFee,
                salt2,
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
            const batchOfAddresses = Array(6).fill(user2.address)
            let balanceOfBatch = await implementationInstance.balanceOfBatch(batchOfAddresses, ids)
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

        it("Can list tokens to Marketplace721 contract without 'setApprovalForAll'", async function () {
            const expectedOrderInfo = [10, 10000, percentFee, user2.address, "0x0000000000000000000000000000000000000000", false]

            const txId = await MarketplaceInstance721.connect(user2).addOrder(newERC721address, expectedOrderInfo[0], expectedOrderInfo[1])
            const txInfo = await txId.wait()
            // console.log(txInfo.events)

            const rawOrderInfo = await MarketplaceInstance721.getOrder(newERC721address, +ethers.utils.formatUnits(txInfo.events[2].args.orderId))
            // console.log(rawOrderInfo)

            const formattedOrderInfo = []
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.tokenId, 0))
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI, 0))
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee, 0))
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
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.amount, 0))
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.priceWEI, 0))
            formattedOrderInfo.push(+ethers.utils.formatUnits(rawOrderInfo.percentFee, 0))
            formattedOrderInfo.push(rawOrderInfo.seller)
            formattedOrderInfo.push(rawOrderInfo.buyer)
            formattedOrderInfo.push(rawOrderInfo.sellerAccepted)

            expect(expectedOrderInfo).to.deep.equal(formattedOrderInfo)
        })
    })

    it("Buyer can not pay overprice or underprice", async function () {
        expect(MarketplaceInstance1155.connect(user1).redeemOrder(newERC1155address, 0, {value: 10001})).to.be.revertedWith("Incorrect funds to redeem")
        expect(MarketplaceInstance1155.connect(user1).redeemOrder(newERC1155address, 0, {value: 9999})).to.be.revertedWith("Incorrect funds to redeem")
    })

    it("Seller or buyer can not decline order if there is no buyer at order", async function () {
        expect(MarketplaceInstance1155.connect(user1).declineOrder(newERC1155address, 0)).to.be.revertedWith("Nothing to decline")
        expect(MarketplaceInstance1155.connect(user2).declineOrder(newERC1155address, 0)).to.be.revertedWith("Only seller or buyer can decline")
    })

    it("Another user can redeem 1155 order with MATIC", async function () {
        let rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)
        const price = +ethers.utils.formatUnits(rawOrderInfo.priceWEI, 0)
        await MarketplaceInstance1155.connect(user3).redeemOrder(newERC1155address, 0, {value: price})

        rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)

        expect(rawOrderInfo.buyer).to.equal(user3.address)
    })

    it("If order redeemed, it can not be funded", async function () {
        let rawOrderInfo = await MarketplaceInstance1155.getOrder(newERC1155address, 0)
        const price = +ethers.utils.formatUnits(rawOrderInfo.priceWEI, 0)
        expect(MarketplaceInstance1155.connect(user1).redeemOrder(newERC1155address, 0, {value: price})).to.be.revertedWith("Order has been funded")
    })

    it("Getting correct info from getContractMetadata() at ERC1155", async function () {
        const expectedContractMetadata1155 = [
            'GunGirls',
            'GNG',
            'ERC1155',
            'Somestring'
        ]
        expect(await ERC1155Proxy.getContractMetadata()).to.be.deep.equal(expectedContractMetadata1155)
    })

    it("Getting correct info from getContractMetadata() at ERC721", async function () {
        const expectedContractMetadata721 = [
            'GunGirls',
            'GNG',
            'ERC721',
            'Somestring'
        ]
        expect(await ERC721Proxy.getContractMetadata()).to.be.deep.equal(expectedContractMetadata721)
    })
})

