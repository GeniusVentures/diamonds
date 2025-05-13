// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";

contract MockDiamondLoupeFacet is IDiamondLoupe {
    /// @notice Gets all facets and their selectors.
    /// @return facets_ Facet addresses and their selectors.
    function facets() external view override returns (Facet[] memory facets_) {
        // Mock implementation for tests
        // We'll create mock data for a simple diamond with 2 facets
        facets_ = new Facet[](2);
        
        // DiamondCutFacet
        facets_[0].facetAddress = address(0x1234567890123456789012345678901234567890);
        facets_[0].functionSelectors = new bytes4[](1);
        facets_[0].functionSelectors[0] = bytes4(keccak256("diamondCut((address,uint8,bytes4[])[],address,bytes)"));
        
        // This facet
        facets_[1].facetAddress = address(this);
        facets_[1].functionSelectors = new bytes4[](4);
        facets_[1].functionSelectors[0] = this.facets.selector;
        facets_[1].functionSelectors[1] = this.facetFunctionSelectors.selector;
        facets_[1].functionSelectors[2] = this.facetAddresses.selector;
        facets_[1].functionSelectors[3] = this.facetAddress.selector;
    }

    /// @notice Gets all the function selectors provided by a facet.
    /// @param _facet The facet address.
    /// @return facetFunctionSelectors_ Function selectors provided by the facet.
    function facetFunctionSelectors(address _facet) external view override returns (
        bytes4[] memory facetFunctionSelectors_
    ) {
        // Mock implementation
        if (_facet == address(0x1234567890123456789012345678901234567890)) {
            // DiamondCutFacet
            facetFunctionSelectors_ = new bytes4[](1);
            facetFunctionSelectors_[0] = bytes4(keccak256("diamondCut((address,uint8,bytes4[])[],address,bytes)"));
        } else if (_facet == address(this)) {
            // This facet
            facetFunctionSelectors_ = new bytes4[](4);
            facetFunctionSelectors_[0] = this.facets.selector;
            facetFunctionSelectors_[1] = this.facetFunctionSelectors.selector;
            facetFunctionSelectors_[2] = this.facetAddresses.selector;
            facetFunctionSelectors_[3] = this.facetAddress.selector;
        } else {
            // Unknown facet
            facetFunctionSelectors_ = new bytes4[](0);
        }
    }

    /// @notice Get all the facet addresses used by a diamond.
    /// @return facetAddresses_ Facet addresses.
    function facetAddresses() external view override returns (
        address[] memory facetAddresses_
    ) {
        // Mock implementation
        facetAddresses_ = new address[](2);
        facetAddresses_[0] = address(0x1234567890123456789012345678901234567890); // DiamondCutFacet
        facetAddresses_[1] = address(this); // This facet
    }

    /// @notice Gets the facet that supports the given selector.
    /// @param _functionSelector The function selector.
    /// @return facetAddress_ The facet address.
    function facetAddress(bytes4 _functionSelector) external view override returns (
        address facetAddress_
    ) {
        // Mock implementation
        if (_functionSelector == bytes4(keccak256("diamondCut((address,uint8,bytes4[])[],address,bytes)"))) {
            return address(0x1234567890123456789012345678901234567890); // DiamondCutFacet
        } else if (
            _functionSelector == this.facets.selector ||
            _functionSelector == this.facetFunctionSelectors.selector ||
            _functionSelector == this.facetAddresses.selector ||
            _functionSelector == this.facetAddress.selector
        ) {
            return address(this); // This facet
        } else {
            return address(0); // Unknown selector
        }
    }
}