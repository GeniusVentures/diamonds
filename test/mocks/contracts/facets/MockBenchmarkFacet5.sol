// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet5 {
    function benchmark5() external pure returns (string memory) {
        return "Benchmark function 5";
    }

    function complexOperation5() external pure returns (uint256) {
        uint256 result = 0;
        for (uint i = 0; i < 100; i++) {
            result += i * 6;
        }
        return result;
    }
}
