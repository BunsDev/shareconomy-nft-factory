// SPDX-License-Identifier: No licence

pragma solidity ^0.8.0;

interface INFTFactory {
    function marketplace() external view returns(address);
    
    function owner() external view returns(address);
}