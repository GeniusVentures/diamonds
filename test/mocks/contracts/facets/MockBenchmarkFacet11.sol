// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet11 {
    function benchmark11() external pure returns (string memory) {
        return "Benchmark function 11";
    }

    function complexOperation11() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 12;
        }
        return result;
    }
}
