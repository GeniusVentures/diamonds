// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet1 {
    function benchmark1() external pure returns (string memory) {
        return "Benchmark function 1";
    }

    function complexOperation1() external pure returns (uint256) {
        uint256 result = 0;
        for (uint i = 0; i < 100; i++) {
            result += i * 2;
        }
        return result;
    }
}
