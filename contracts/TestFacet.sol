// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestFacet {
    bool private initialized;
    
    function initialize() external {
        initialized = true;
    }
    
    function isInitialized() external view returns (bool) {
        return initialized;
    }
    
    function testFunction() external pure returns (string memory) {
        return "Test function called";
    }
    
    function getTestValue() external pure returns (uint256) {
        return 42;
    }
}
