// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/// @title NFTFactory
/// @author AkylbekAD
/// @notice This contract allows you predict address and deploy ERC1155 token contract

import "./NFTProxy.sol";
import "./ERC1155.sol";

contract NFTFactory {
    /// @notice Contact owner address
    address public owner;

    /// @notice Address for implementation of NFT
    address public implementation;

    event Deployed(address newNFTAddress);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deploys ERC1155 standart non-fungble token contract and returns its address.
     *        For matching predicted address nad actually deployed one, all parameters need to be exactly the same
     * @param name Name of NFT collection
     * @param symbol Symbol of NFT collection
     * @param baseURI Basic URI for all NFTs metadata
     * @param newOwner Owner of deployed ERC1155 contract
     * @param percentFee Percents of trading price which would be transfered to ERC1155 owner.
     *        Percent fee must be more then 0 and less or equal to 10000, two extra zeros stands for decimals
     * @param _salt Some random number which effects to the ERC1155 address and used only for deploying
     * @dev Funciton uses create2 opcode for creating and deploying new ERC1155 contract
     */
    function createERC1155(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address newOwner,
        uint256 percentFee,
        uint256 _salt
    ) public returns (address newNFTAddress) {
        require(percentFee > 0 && percentFee <= 10000, "Invalid Fee");

        bytes32 byteSalt = bytes32(_salt);
        NFTProxy newNFT = new NFTProxy{salt: byteSalt}(implementation, "");

        address payable newNFTaddress = payable(address(newNFT));

        ERC1155(newNFTaddress).initialize(
            name,
            symbol,
            baseURI,
            newOwner,
            percentFee
        );

        emit Deployed(newNFTaddress);

        return (newNFTaddress);
    }

    /**
     * @notice Returns address of potentialy deployed ERC1155 contract by 'createERC1155' function on TRON
     * Feel free to fill arguments and change only '_salt' for changing whole contract address
     * @param _salt Some random number which effects to the ERC1155 address and used only for deploying
     */ 
    function predictAddress(uint256 _salt) public view returns (address newNFTAddress) {
        return
            address(uint160(uint(keccak256(abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            bytes32(_salt),
                            keccak256(abi.encodePacked(
                                type(NFTProxy).creationCode,
                                abi.encode(
                                implementation,
                                ""
                                )
                            ))
            )))));
    }

    function setImplementation(address newImplementation) external {
        isOwner();
        implementation = newImplementation;
    }

    /// @notice Allowing access only to Owner
    function isOwner() private view {
        if(msg.sender != owner) {
            revert();
        }
    }
}
