// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDiamondCut } from "./interfaces/IDiamondCut.sol";

/**
 * @title MockDiamond
 * @dev A simplified mock of the Diamond contract for testing
 */
contract MockDiamond {
    address private owner;
    address private immutable diamondCutFacet;
    
    // Function selector => facet address mapping
    mapping(bytes4 => address) private selectorToFacet;
    
    // All facet addresses
    address[] private facetAddresses;
    
    // Facet address => selectors
    mapping(address => bytes4[]) private facetSelectors;
    
    // Events
    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);
    
    constructor(address _owner, address _diamondCutFacet) {
        owner = _owner;
        diamondCutFacet = _diamondCutFacet;
        
        // Add diamondCut function selector to the mapping
        bytes4 diamondCutSelector = IDiamondCut.diamondCut.selector;
        selectorToFacet[diamondCutSelector] = _diamondCutFacet;
        
        // Add to facet addresses
        facetAddresses.push(_diamondCutFacet);
        
        // Add to facet selectors
        facetSelectors[_diamondCutFacet].push(diamondCutSelector);
    }
    
    // Fallback function
    fallback() external payable {
        address facet = selectorToFacet[msg.sig];
        require(facet != address(0), "Diamond: Function does not exist");
        
        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // Execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // Get any return value
            returndatacopy(0, 0, returndatasize())
            // Return any return value or error
            switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }
    
    // Receive function
    receive() external payable {}
    
    // For testing - simulate diamond cut from a test
    function testDiamondCut(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) external {
        emit DiamondCut(_diamondCut, _init, _calldata);
        
        // Update state to reflect the diamond cut
        for (uint256 i = 0; i < _diamondCut.length; i++) {
            IDiamondCut.FacetCut memory cut = _diamondCut[i];
            
            if (cut.action == IDiamondCut.FacetCutAction.Add) {
                // Add facet address if it doesn't exist
                bool addressExists = false;
                for (uint256 j = 0; j < facetAddresses.length; j++) {
                    if (facetAddresses[j] == cut.facetAddress) {
                        addressExists = true;
                        break;
                    }
                }
                if (!addressExists) {
                    facetAddresses.push(cut.facetAddress);
                }
                
                // Add selectors
                for (uint256 j = 0; j < cut.functionSelectors.length; j++) {
                    bytes4 selector = cut.functionSelectors[j];
                    selectorToFacet[selector] = cut.facetAddress;
                    facetSelectors[cut.facetAddress].push(selector);
                }
            }
            else if (cut.action == IDiamondCut.FacetCutAction.Replace) {
                // Replace selectors
                for (uint256 j = 0; j < cut.functionSelectors.length; j++) {
                    bytes4 selector = cut.functionSelectors[j];
                    address oldFacet = selectorToFacet[selector];
                    
                    // Remove from old facet
                    if (oldFacet != address(0)) {
                        for (uint256 k = 0; k < facetSelectors[oldFacet].length; k++) {
                            if (facetSelectors[oldFacet][k] == selector) {
                                // Replace with last element and pop
                                facetSelectors[oldFacet][k] = facetSelectors[oldFacet][
                                    facetSelectors[oldFacet].length - 1
                                ];
                                facetSelectors[oldFacet].pop();
                                break;
                            }
                        }
                    }
                    
                    // Add to new facet
                    selectorToFacet[selector] = cut.facetAddress;
                    facetSelectors[cut.facetAddress].push(selector);
                    
                    // Add facet address if it doesn't exist
                    bool addressExists = false;
                    for (uint256 k = 0; k < facetAddresses.length; k++) {
                        if (facetAddresses[k] == cut.facetAddress) {
                            addressExists = true;
                            break;
                        }
                    }
                    if (!addressExists) {
                        facetAddresses.push(cut.facetAddress);
                    }
                }
            }
            else if (cut.action == IDiamondCut.FacetCutAction.Remove) {
                // Remove selectors
                for (uint256 j = 0; j < cut.functionSelectors.length; j++) {
                    bytes4 selector = cut.functionSelectors[j];
                    address oldFacet = selectorToFacet[selector];
                    
                    // Remove from mapping
                    delete selectorToFacet[selector];
                    
                    // Remove from facet selectors
                    if (oldFacet != address(0)) {
                        for (uint256 k = 0; k < facetSelectors[oldFacet].length; k++) {
                            if (facetSelectors[oldFacet][k] == selector) {
                                // Replace with last element and pop
                                facetSelectors[oldFacet][k] = facetSelectors[oldFacet][
                                    facetSelectors[oldFacet].length - 1
                                ];
                                facetSelectors[oldFacet].pop();
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Call init function if needed
        if (_init != address(0) && _calldata.length > 0) {
            (bool success, ) = _init.delegatecall(_calldata);
            require(success, "Diamond: Init function failed");
        }
    }
    
    // For testing - get all facet addresses
    function getFacetAddresses() external view returns (address[] memory) {
        return facetAddresses;
    }
    
    // For testing - get facet for function selector
    function getFacetForSelector(bytes4 _selector) external view returns (address) {
        return selectorToFacet[_selector];
    }
}