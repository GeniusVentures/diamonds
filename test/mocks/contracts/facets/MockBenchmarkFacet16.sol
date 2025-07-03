// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet16 {
    function benchmark16() external pure returns (string memory) {
        return "Benchmark function 16";
    }

    function complexOperation16() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 17;
        }
        return result;
    }
}
