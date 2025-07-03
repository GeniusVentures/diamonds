// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet17 {
    function benchmark17() external pure returns (string memory) {
        return "Benchmark function 17";
    }

    function complexOperation17() external pure returns (uint256) {
        uint256 result = 0;
        for (uint j = 0; j < 100; j++) {
            result += j * 18;
        }
        return result;
    }
}
