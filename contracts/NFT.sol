// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title NFT contract
/// @author AkylbekAD
/// @notice ERC721 contract, but with some advanced features

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;

    /// @notice Contract owner address
    address public owner;
    /// @notice Deployer contract address  
    address public factory;
    /// @notice Price in WEI for minting new tokens
    uint256 public price;
    /// @notice Fee in percent which contract owner takes for selling NFT on Trade contract
    uint256 public percentFee;
    /// @notice Decimals of 'percentFee' number, example: 25.55% in 'percentFee' would be 2555
    uint256 constant public percentDecimals = 2;
    /// @dev Base URI which is common for all tokens URI
    string private baseURI;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_,
        uint256 price_,
        uint256 percentFee_,
        uint256 amount_
    ) ERC721(name_, symbol_) {
        owner = owner_;
        factory = msg.sender;
        price = price_;
        percentFee = percentFee_;
        baseURI = baseURI_;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(DEFAULT_ADMIN_ROLE, owner_);
        grantRole(ADMIN_ROLE, owner_);
        grantRole(MINTER_ROLE, owner_);

        /// A loop for minting inital amount of tokens
        for (uint256 i = 0; i < amount_; i++) {
            _safeMint(owner_, _tokenIdCounter.current());
            _tokenIdCounter.increment();
        }
    }

    /// @notice Mints new 'amount' tokens to 'to' address, available only for MINTER_ROLE
    /// @param to Address you want to mint new tokens
    /// @param amount Amount of tokens you want to create
    function mintAmount(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, _tokenIdCounter.current());
            _tokenIdCounter.increment();
        }
    }

    /// @notice Mints tokens to msg.sender for paid MATIC, which must be more then 'price' value
    /// @param recepient Address which get new minted tokens
    function mintForMATIC(address recepient) external payable {
        require(msg.value >= price, "Unsufficient value");

        uint256 amount = msg.value / price;

        (bool success, ) = owner.call{value: msg.value}("");
        require(success);

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(recepient, _tokenIdCounter.current());
            _tokenIdCounter.increment();
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /// @notice Changes fee percent for NFT contract owner, available only for ADMIN_ROLE
    function changeFeePercent(uint256 _percentFee) external onlyRole(ADMIN_ROLE) {
        require(_percentFee > 0 && _percentFee <= 10000, "0 < Fee < 10000");
        percentFee = _percentFee;
    }

    /// @notice Changes baseURI for all tokens, available only for ADMIN_ROLE
    function setBaseURI(string memory baseURI_) external onlyRole(ADMIN_ROLE) {
        baseURI = baseURI_;
    }
        
    /// @notice Changes price for 'mintForMATIC' function, available only for ADMIN_ROLE
    function changePrice(uint256 _price) external onlyRole(ADMIN_ROLE) {
        price = _price;
    }

    /// @notice Returns array of token IDs owned by 'account' address
    /// @param account Address you want to get token IDs
    function getAllIds(address account) external view returns(uint256[] memory) {
        uint256 accountBalance = balanceOf(account);
        uint256 totalIds = _tokenIdCounter.current();
        uint256[] memory idArray = new uint256[](accountBalance);
        uint256 idArrayIndex = 0;

        for (uint256 i = 0; i < totalIds; i++) {
            if (ownerOf(i) == account) {
                idArray[idArrayIndex] = i;
                idArrayIndex++;
            }
        }

        return idArray;
    }

    /// @notice Returns total amount of minted tokens
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting.
     *
     * First checks Trade contract address from NFTFactory deployer contract
     *
     * Calling conditions:
     * 
     * To the Trade contract for selling
     * From the Trade contract for buying
     * From the owner of contract
     * From zero address for minting
     * 
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId);

        (, bytes memory result) = factory.call(abi.encodeWithSignature("tradeAddress()"));

        address tradeAddress = abi.decode(result, (address));
        require(tradeAddress != address(0));

        if(from != tradeAddress && to != tradeAddress && from != owner && from != address(0)) {
            revert();
        }
    }
}