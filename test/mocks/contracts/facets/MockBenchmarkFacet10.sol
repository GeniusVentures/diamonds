// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet10 {
    function benchmark10() external pure returns (string memory) {
        return "Benchmark function 10";
    }

    function complexOperation10() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 11;
        }
        return result;
    }
}
