// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (interfaces/IERC1155.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IERC721UUPS is IERC721Upgradeable {
    function percentFee() external returns(uint256);

    function owner() external returns(address);

    function erc20() external returns(address);
}