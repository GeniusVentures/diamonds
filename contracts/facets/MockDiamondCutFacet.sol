// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";

contract MockDiamondCutFacet is IDiamondCut {
    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {
        emit DiamondCut(_diamondCut, _init, _calldata);
        
        // For testing - no actual implementation, just emits event
    }
}