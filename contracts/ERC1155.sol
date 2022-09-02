// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/INFTFactory.sol";

contract ERC1155 is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable{
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Struct for getting contract metadata
    struct Metadata {
        string name;
        string symbol;
        string tokenType;
        string baseUri;
    }

    /// @notice name of the collection
    string public name;
    /// @notice symbol of the collection
    string public symbol;
    /// @notice Contract owner address
    address public owner;
    /// @notice Deployer contract address  
    address public factory;
    /// @notice NFT collection ERC20 token
    address public erc20;
    /// @notice Fee in percent which contract owner takes for selling NFT on Trade contract
    uint256 public percentFee;
    /// @notice Decimals of 'percentFee' number, example: 25.55% in 'percentFee' would be 2555
    uint256 constant public percentDecimals = 2;
    /// @notice Returns quantity of certain token id supply
    mapping (uint256 => uint256) public tokenIdSupply;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_,
        address erc20_,
        uint256 percentFee_,
        uint256[] memory ids_,
        uint256[] memory amounts_
    ) initializer public {
        __ERC1155_init(baseURI_);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        name = name_;
        symbol = symbol_;
        owner = owner_;
        factory = msg.sender;
        erc20 = erc20_;
        percentFee = percentFee_;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(DEFAULT_ADMIN_ROLE, owner_);
        grantRole(ADMIN_ROLE, owner_);
        grantRole(MINTER_ROLE, owner_);

        _mintBatch(owner_, ids_, amounts_, "");
        for (uint i = 0; i < ids_.length; i++) {
            tokenIdSupply[ids_[i]] += amounts_[i];
        }
    }

    function mint(address account, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        tokenIdSupply[id] += amount;
        _mint(account, id, amount, "");
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external onlyRole(MINTER_ROLE) {
        for (uint i = 0; i < ids.length; i++) {
            tokenIdSupply[ids[i]] += amounts[i];
        }
        _mintBatch(to, ids, amounts, "");
    }

    function setBaseURI(string memory _newBaseURI) external onlyRole(ADMIN_ROLE) {
        _setURI(_newBaseURI);
    }

    function burn(uint256 id, uint256 amount) external {
        tokenIdSupply[id] -= amount;
        _burn(msg.sender, id, amount);
    }

    function burnBatch(uint256[] memory ids, uint256[] memory amounts) external {
        for (uint i = 0; i < ids.length; i++) {
            tokenIdSupply[ids[i]] -= amounts[i];
        }
        _burnBatch(msg.sender, ids, amounts);
    }

    /// @notice Changes fee percent for NFT contract owner, available only for ADMIN_ROLE
    function changeFeePercent(uint256 _percentFee) external onlyRole(ADMIN_ROLE) {
        require(_percentFee > 0 && _percentFee <= 10000, "0 < Fee < 10000");
        percentFee = _percentFee;
    }

    /// @notice Changes ERC20 address for this collection
    function changeERC20Address(address newERC20Address) external onlyRole(ADMIN_ROLE) {
        require(IERC165Upgradeable(erc20).supportsInterface(0x01ffc9a7), "Contract does not support ERC20");
        erc20 = newERC20Address;
    }

    function getVersion() public pure returns(uint256) {
        return 1;
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || isMarketplaceReceiver(from, to),
            "ERC1155: caller is not token owner nor approved"
        );
        _safeTransferFrom(from, to, id, amount, data);
    }

    /// @notice Returns contract`s name, symbol, checks ERC1155 interface and uri
    function getContractMetadata() public view returns(Metadata memory metadata) {
        metadata.name = name;
        metadata.symbol = symbol;
        metadata.tokenType = supportsInterface(0xd9b67a26) ? "ERC1155" : "Unknown interface id";
        metadata.baseUri = uri(0);
    }

    /// @dev Additional check for trading tokens on factory`s marketplace
    function isMarketplaceReceiver(address from, address to) internal view returns(bool) {
        if(INFTFactory(factory).marketplace1155() == to && from == tx.origin) {
            return true;
        }
        return false;
    }

    /// @dev Needs for upgrading contract implementation
    function _authorizeUpgrade(address newImplementation) internal
        override
        onlyRole(ADMIN_ROLE) {}

    /// @dev Checks ERC1155 interface by id
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


}