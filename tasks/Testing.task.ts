import { task } from "hardhat/config";

const contractAddress = "0xdc76F706178CBbbcf919f6BAfC44447Da4172430"

task("getOrdersView", "")
    .setAction(async (taskArgs, hre) => {
        const Instance = await hre.ethers.getContractAt("Testing", contractAddress)
        const info = await Instance.getOrdersView();
        console.log(info)
    })