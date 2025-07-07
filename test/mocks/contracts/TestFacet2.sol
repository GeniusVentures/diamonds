// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestFacet2
 * @dev Mock contract for testing purposes - extends TestFacet with additional functionality
 */
contract TestFacet2 {
    // Test storage
    mapping(address => uint256) private testStorage;
    uint256 private testCounter;

    // Test events
    event TestEventV2(address indexed user, uint256 value, string message);
    event CounterUpdated(uint256 newValue);

    // Test functions from TestFacet
    function testFunction() external pure returns (string memory) {
        return "Test function v2 called";
    }

    function testFunction2() external pure returns (string memory) {
        return "Test function 2 called";
    }

    function setTestValue(uint256 value) external {
        testStorage[msg.sender] = value;
        emit TestEventV2(msg.sender, value, "Value set in v2");
    }

    function getTestValue(address user) external view returns (uint256) {
        return testStorage[user];
    }

    function incrementCounter() external {
        testCounter++;
        emit CounterUpdated(testCounter);
    }

    function getCounter() external view returns (uint256) {
        return testCounter;
    }

    // New functions in v2
    function newTestFunction() external pure returns (string memory) {
        return "New test function in v2";
    }

    function batchSetValues(address[] calldata users, uint256[] calldata values) external {
        require(users.length == values.length, "Arrays length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            testStorage[users[i]] = values[i];
            emit TestEventV2(users[i], values[i], "Batch value set");
        }
    }

    function multiplyTestValue(uint256 multiplier) external {
        testStorage[msg.sender] *= multiplier;
        emit TestEventV2(msg.sender, testStorage[msg.sender], "Value multiplied");
    }

    function resetTestValue() external {
        delete testStorage[msg.sender];
        emit TestEventV2(msg.sender, 0, "Value reset");
    }

    // Utility functions
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7; // ERC165 interface ID
    }
}
