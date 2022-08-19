// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/// @title NFTFactory
/// @author AkylbekAD
/// @notice This contract allows you predict address and deploy ERC1155 token contract

import "./NFTProxy.sol";
import "./ERC1155.sol";
import "./ERC721.sol";

contract NFTFactory {
    /// @notice Contact owner address
    address public owner;

    /// @notice Address of ERC1155 implementation 
    address public implementation1155;

    /// @notice Address of ERC721 implementation
    address public implementation721;

    /// @notice Marketplace address for ERC1155
    address public marketplace1155;

    /// @notice Marketplace address for ERC721
    address public marketplace721;

    event Deployed(address contractAddress);

    constructor(
        address _implementation1155,
        address _implementation721,
        address _marketplace1155,
        address _marketplace721
    ) {
        owner = msg.sender;
        implementation1155 = _implementation1155;
        implementation721 = _implementation721;
        marketplace1155 = _marketplace1155;
        marketplace721 = _marketplace721;
    }

    /**
     * @notice Deploys ERC1155 or ERC721 standard contract and returns its address.
     *        For matching predicted address and actually deployed one, all parameters must be exactly the same
     * @param name Name of NFT collection
     * @param symbol Symbol of NFT collection
     * @param baseURI Basic URI for all NFTs metadata
     * @param newOwner Owner of deployed ERC1155 contract
     * @param percentFee Percents of trading price which would be transferred to contract owner.
     *        Percent fee must be more then 0 and less or equal to 10000, two extra zeros stands for decimals
     * @param _salt Some random number which effects to the contract address and used only for deploying
     * @dev Function uses create2 opcode for creating and deploying new contract
     */
    function createContract(
        uint256 standard,
        string memory name,
        string memory symbol,
        string memory baseURI,
        address newOwner,
        uint256 percentFee,
        uint256 _salt,
        uint256 amount,
        uint256 [] memory ids,
        uint256 [] memory amounts
    ) public returns (address contractAddress) {
        require(percentFee > 0 && percentFee <= 10000, "Invalid Fee");
        if (standard == 721) {
            bytes32 byteSalt = bytes32(_salt);
            NFTProxy nftContract = new NFTProxy{salt : byteSalt}(implementation721, "");

            address payable _contractAddress = payable(address(nftContract));

            ERC721(_contractAddress).initialize(
                name,
                symbol,
                baseURI,
                newOwner,
                percentFee,
                amount
            );

            emit Deployed(_contractAddress);

            return (_contractAddress);
        }

        if (standard == 1155) {
            bytes32 byteSalt = bytes32(_salt);
            NFTProxy nftContract = new NFTProxy{salt : byteSalt}(implementation1155, "");

            address payable _contractAddress = payable(address(nftContract));

            ERC1155(_contractAddress).initialize(
                name,
                symbol,
                baseURI,
                newOwner,
                percentFee,
                ids,
                amounts
            );

            emit Deployed(_contractAddress);

            return (_contractAddress);
        }
    }

    /**
     * @notice Returns address of potentially deployed ERC1155 or ERC721 contract by 'createERC1155' function on TRON
     * Feel free to fill arguments and change only '_salt' for changing whole contract address
     * @param _salt Some random number which effects to the ERC1155 address and used only for deploying
     */
    function predictAddress(uint256 standard, uint256 _salt) public view returns (address contractAddress) {
        address implementation = standard == 1155 ? implementation1155 : implementation721;

        return address(uint160(uint(keccak256(abi.encodePacked(
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

    /**
     * @notice Sets address of ERC1155 implementation, avaliable only for Owner
     * @param newImplementation address of new implementation
     */
    function setImplementation(uint256 standard, address newImplementation) external {
        isOwner();
        if (standard == 1155) {
            implementation1155 = newImplementation;
        }
        if (standard == 721) {
            implementation721 = newImplementation;
        }
    }

    /**
     * @notice Sets Marketplace address for ERC721 trading, available only for Owner
     * @param newMarketplace address of new Marketplace
     */
    function setMarketplace(uint256 standard, address newMarketplace) external {
        isOwner();
        if (standard == 1155) {
            marketplace1155 = newMarketplace;
        }
        if (standard == 721) {
            marketplace721 = newMarketplace;
        }
    }

    /// @notice Allowing access only to Owner
    function isOwner() private view {
        if (msg.sender != owner) {
            revert();
        }
    }
}
