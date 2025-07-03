// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet20 {
    function benchmark20() external pure returns (string memory) {
        return "Benchmark function 20";
    }

    function complexOperation20() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 21;
        }
        return result;
    }
}
