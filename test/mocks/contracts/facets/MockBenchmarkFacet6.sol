// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet6 {
    function benchmark6() external pure returns (string memory) {
        return "Benchmark function 6";
    }

    function complexOperation6() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 7;
        }
        return result;
    }
}
