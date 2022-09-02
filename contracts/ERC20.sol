// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title NFT contract
/// @author AkylbekAD
/// @notice ERC20 contract, which uses UUPS pattern

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/INFTFactory.sol";

contract ERC20 is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {

    function initialize(
        string memory name_,
        string memory symbol_,
        address newOwner,
        uint256 supply
    ) initializer public {
        __Ownable_init();
        transferOwnership(newOwner);
        __ERC20_init(name_, symbol_);
        __UUPSUpgradeable_init();
        _mint(tx.origin, supply);
    }

    /// @dev Contract owner can mint tokens
    /// @param account address owner mints tokens to
    /// @param amount token quantity to mint
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    /// @notice Token holders can burn their tokens
    /// @param amount token quantity to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @dev Function for upgrading implementation of NFTFactory
    function _authorizeUpgrade(address newImplementation) internal
    override view onlyOwner {}

    /// @notice Returns version of implementation of NFTFactory
    function getVersion() public pure returns(uint256 version) {
        return 1;
    }
 }