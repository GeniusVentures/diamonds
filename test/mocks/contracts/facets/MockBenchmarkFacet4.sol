// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockBenchmarkFacet4 {
    function benchmark4() external pure returns (string memory) {
        return "Benchmark function 4";
    }

    function complexOperation4() external pure returns (uint256) {
        uint256 result = 0;
        for (uint i = 0; i < 100; i++) {
            result += i * 5;
        }
        return result;
    }
}
