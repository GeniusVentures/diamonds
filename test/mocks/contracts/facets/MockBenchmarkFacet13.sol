// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet13 {
    function benchmark13() external pure returns (string memory) {
        return "Benchmark function 13";
    }

    function complexOperation13() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 14;
        }
        return result;
    }
}
