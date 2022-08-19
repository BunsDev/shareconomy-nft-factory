// SPDX-License-Identifier: No licence

pragma solidity ^0.8.0;

interface INFTFactory {
    function marketplace721() external view returns(address);

    function marketplace1155() external view returns(address);
    
    function owner() external view returns(address);
}