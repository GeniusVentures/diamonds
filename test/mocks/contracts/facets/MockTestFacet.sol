// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockTestFacet {
    // State variables for testing
    uint256 public value;
    bool public initialized;
    
    // Function to test basic functionality
    function setValue(uint256 _value) external {
        value = _value;
    }
    
    // Function to get the value
    function getValue() external view returns (uint256) {
        return value;
    }
    
    // Initialization function
    function initialize() external {
        require(!initialized, "Already initialized");
        initialized = true;
        value = 42; // Set default value
    }
    
    // Reinitialization function for upgrades
    function reinitialize() external {
        initialized = true;
        value = 100; // New default value
    }
    
    // Additional functions with different parameters
    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return a + b;
    }
    
    function subtract(uint256 a, uint256 b) external pure returns (uint256) {
        return a > b ? a - b : 0;
    }
    
    function multiply(uint256 a, uint256 b) external pure returns (uint256) {
        return a * b;
    }
    
    function divide(uint256 a, uint256 b) external pure returns (uint256) {
        require(b > 0, "Cannot divide by zero");
        return a / b;
    }
}