// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet12 {
    function benchmark12() external pure returns (string memory) {
        return "Benchmark function 12";
    }

    function complexOperation12() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 13;
        }
        return result;
    }
}
