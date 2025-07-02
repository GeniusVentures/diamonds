// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../../test/mocks/contracts/interfaces/IDiamondCut.sol";

contract ExampleDiamond {
    address public owner;
    
    event DiamondCreated(address indexed diamond, address indexed owner);
    
    constructor(address _contractOwner, address _diamondCutFacet) {
        owner = _contractOwner;
        
        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: functionSelectors
        });
        
        emit DiamondCreated(address(this), _contractOwner);
    }
    
    // Fallback function to delegate calls to facets
    fallback() external payable {
        address facet = address(0); // This would be looked up from storage in a real implementation
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    receive() external payable {}
}
