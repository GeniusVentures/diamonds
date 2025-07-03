// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet15 {
    function benchmark15() external pure returns (string memory) {
        return "Benchmark function 15";
    }

    function complexOperation15() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 16;
        }
        return result;
    }
}
