// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet3 {
    function benchmark3() external pure returns (string memory) {
        return "Benchmark function 3";
    }

    function complexOperation3() external pure returns (uint256) {
        uint256 result = 0;
        for (uint i = 0; i < 100; i++) {
            result += i * 4;
        }
        return result;
    }
}
