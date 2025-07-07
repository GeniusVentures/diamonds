// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDiamondCut.sol";

/**
 * @title BenchmarkDiamond
 * @dev Mock diamond contract for performance benchmarking
 */
contract BenchmarkDiamond {
    // Storage for diamond cut functionality
    mapping(bytes4 => address) private facetAddresses;
    mapping(address => bytes4[]) private facetFunctionSelectors;
    address[] private facetAddressList;

    // Diamond owner
    address private contractOwner;

    // Events
    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "BenchmarkDiamond: Must be contract owner");
        _;
    }

    constructor(address _contractOwner, address _diamondCutFacet) {
        contractOwner = _contractOwner;

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: functionSelectors
        });
        diamondCut(cut, address(0), "");
    }

    // Find facet for function that is called and execute the function if a facet is found and return any value.
    fallback() external payable {
        address facet = facetAddresses[msg.sig];
        require(facet != address(0), "BenchmarkDiamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    receive() external payable {}

    // Implements EIP-2535 Diamond Standard
    function diamondCut(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) public onlyOwner {
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Replace) {
                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else {
                revert("BenchmarkDiamond: Incorrect FacetCutAction");
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);
    }

    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "BenchmarkDiamond: No selectors in facet to cut");
        require(_facetAddress != address(0), "BenchmarkDiamond: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(facetFunctionSelectors[_facetAddress].length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(_facetAddress);
        }
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = facetAddresses[selector];
            require(oldFacetAddress == address(0), "BenchmarkDiamond: Can't add function that already exists");
            facetAddresses[selector] = _facetAddress;
            facetFunctionSelectors[_facetAddress].push(selector);
        }
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "BenchmarkDiamond: No selectors in facet to cut");
        require(_facetAddress != address(0), "BenchmarkDiamond: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(facetFunctionSelectors[_facetAddress].length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(_facetAddress);
        }
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = facetAddresses[selector];
            require(oldFacetAddress != _facetAddress, "BenchmarkDiamond: Can't replace function with same function");
            removeFunction(oldFacetAddress, selector);
            facetAddresses[selector] = _facetAddress;
            facetFunctionSelectors[_facetAddress].push(selector);
        }
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "BenchmarkDiamond: No selectors in facet to cut");
        // if function does not exist then do nothing and return
        require(_facetAddress == address(0), "BenchmarkDiamond: Remove facet address must be address(0)");
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = facetAddresses[selector];
            removeFunction(oldFacetAddress, selector);
        }
    }

    function addFacet(address _facetAddress) internal {
        enforceHasContractCode(_facetAddress, "BenchmarkDiamond: New facet has no code");
        facetAddressList.push(_facetAddress);
    }

    function removeFunction(address _facetAddress, bytes4 _selector) internal {
        require(_facetAddress != address(0), "BenchmarkDiamond: Can't remove function that doesn't exist");
        // replace selector with last selector, then delete last selector
        uint256 selectorPosition = getSelectorPosition(_facetAddress, _selector);
        uint256 lastSelectorPosition = facetFunctionSelectors[_facetAddress].length - 1;
        // if not the same then replace _selector with lastSelector
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = facetFunctionSelectors[_facetAddress][lastSelectorPosition];
            facetFunctionSelectors[_facetAddress][selectorPosition] = lastSelector;
        }
        // delete the last selector
        facetFunctionSelectors[_facetAddress].pop();
        delete facetAddresses[_selector];

        // if no more selectors for facet address then delete the facet address
        if (lastSelectorPosition == 0) {
            // replace facet address with last facet address and delete last facet address
            uint256 lastFacetAddressPosition = facetAddressList.length - 1;
            uint256 facetAddressPosition = getFacetAddressPosition(_facetAddress);
            if (facetAddressPosition != lastFacetAddressPosition) {
                facetAddressList[facetAddressPosition] = facetAddressList[lastFacetAddressPosition];
            }
            facetAddressList.pop();
        }
    }

    function getSelectorPosition(address _facetAddress, bytes4 _selector) internal view returns (uint256) {
        uint256 numSelectors = facetFunctionSelectors[_facetAddress].length;
        for (uint256 selectorIndex; selectorIndex < numSelectors; selectorIndex++) {
            if (facetFunctionSelectors[_facetAddress][selectorIndex] == _selector) {
                return selectorIndex;
            }
        }
        revert("BenchmarkDiamond: Function selector not found");
    }

    function getFacetAddressPosition(address _facetAddress) internal view returns (uint256) {
        uint256 numFacets = facetAddressList.length;
        for (uint256 facetIndex; facetIndex < numFacets; facetIndex++) {
            if (facetAddressList[facetIndex] == _facetAddress) {
                return facetIndex;
            }
        }
        revert("BenchmarkDiamond: Facet address not found");
    }

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "BenchmarkDiamond: _init is address(0) but_calldata is not empty");
        } else {
            require(_calldata.length > 0, "BenchmarkDiamond: _calldata is empty but _init is not address(0)");
            if (_init != address(this)) {
                enforceHasContractCode(_init, "BenchmarkDiamond: _init address has no code");
            }
            (bool success, bytes memory error) = _init.delegatecall(_calldata);
            if (!success) {
                if (error.length > 0) {
                    // bubble up the error
                    revert(string(error));
                } else {
                    revert("BenchmarkDiamond: _init function reverted");
                }
            }
        }
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }
}
