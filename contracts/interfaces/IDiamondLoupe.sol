// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDiamondLoupe {
    /// @notice Gets all facets and their selectors.
    /// @return facets_ Facet addresses and their selectors.
    function facets() external view returns (
        Facet[] memory facets_
    );

    /// @notice Gets all the function selectors provided by a facet.
    /// @param _facet The facet address.
    /// @return facetFunctionSelectors_ Function selectors provided by the facet.
    function facetFunctionSelectors(address _facet) external view returns (
        bytes4[] memory facetFunctionSelectors_
    );

    /// @notice Get all the facet addresses used by a diamond.
    /// @return facetAddresses_ Facet addresses.
    function facetAddresses() external view returns (
        address[] memory facetAddresses_
    );

    /// @notice Gets the facet that supports the given selector.
    /// @param _functionSelector The function selector.
    /// @return facetAddress_ The facet address.
    function facetAddress(bytes4 _functionSelector) external view returns (
        address facetAddress_
    );

    /// @notice Structure to represent a facet and its function selectors
    struct Facet {
        address facetAddress;
        bytes4[] functionSelectors;
    }
}