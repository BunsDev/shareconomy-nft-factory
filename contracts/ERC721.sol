// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title NFT contract
/// @author AkylbekAD
/// @notice ERC721 contract, which uses UUPS pattern

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./interfaces/INFTFactory.sol";

contract ERC721 is Initializable, ERC721Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    CountersUpgradeable.Counter private _tokenIdCounter;

    /// @dev Struct for getting contract metadata
    struct Metadata {
        string name;
        string symbol;
        string tokenType;
        string baseUri;
    }

    /// @notice Contract owner address
    address public owner;
    /// @notice Deployer contract address
    address public factory;
    /// @notice Fee in percent which contract owner takes for selling NFT on Trade contract
    uint256 public percentFee;
    /// @notice Decimals of 'percentFee' number, example: 25.55% in 'percentFee' would be 2555
    uint256 constant public percentDecimals = 2;
    /// @notice Base URI which is common for all tokens URI
    string public baseURI;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_,
        uint256 percentFee_,
        uint256 amount_
    ) initializer public {
        __ERC721_init(name_, symbol_);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        owner = owner_;
        factory = msg.sender;
        baseURI = baseURI_;
        percentFee = percentFee_;
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

    /// @dev Overriding internal function
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

    /// @notice Returns version of implementation
    function getVersion() public pure returns(uint256) {
        return 1;
    }

    /// @notice Returns contract`s name, symbol, checks ERC721 interface and uri
    function getContractMetadata() public view returns(Metadata memory metadata) {
        metadata.name = name();
        metadata.symbol = symbol();
        metadata.tokenType = supportsInterface(0x80ac58cd) ? "ERC721" : "";
        metadata.baseUri = _baseURI();
    }

    /// @dev Upgrades implementation with UUPS pattern
    function _authorizeUpgrade(address newImplementation) internal
    override
    onlyRole(ADMIN_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Upgradeable, AccessControlUpgradeable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *  if `spender` is marketplace contract, any token could be transferred to it
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view override returns (bool) {
        address tokenOwner = ERC721Upgradeable.ownerOf(tokenId);
        address marketplace = INFTFactory(factory).marketplace721();
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender || spender == marketplace);
    }
}