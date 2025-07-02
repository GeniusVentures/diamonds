// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ExampleFacet1 {
    bytes32 constant STORAGE_POSITION = keccak256("example.facet1.storage");
    
    struct FacetStorage {
        uint256 value;
        bool initialized;
        address owner;
        string name;
    }
    
    function facetStorage() internal pure returns (FacetStorage storage fs) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            fs.slot := position
        }
    }
    
    event Initialized(address indexed owner, string name);
    event ValueSet(uint256 oldValue, uint256 newValue);
    event UpgradedToV1(uint256 timestamp);
    
    function initialize() external {
        FacetStorage storage fs = facetStorage();
        require(!fs.initialized, "Already initialized");
        
        fs.initialized = true;
        fs.owner = msg.sender;
        fs.name = "ExampleFacet1";
        fs.value = 100;
        
        emit Initialized(msg.sender, fs.name);
    }
    
    function setValue(uint256 _value) external {
        FacetStorage storage fs = facetStorage();
        require(fs.initialized, "Not initialized");
        require(msg.sender == fs.owner, "Not owner");
        
        uint256 oldValue = fs.value;
        fs.value = _value;
        
        emit ValueSet(oldValue, _value);
    }
    
    function getValue() external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        return fs.value;
    }
    
    function getName() external view returns (string memory) {
        FacetStorage storage fs = facetStorage();
        return fs.name;
    }
    
    function getOwner() external view returns (address) {
        FacetStorage storage fs = facetStorage();
        return fs.owner;
    }
    
    function isInitialized() external view returns (bool) {
        FacetStorage storage fs = facetStorage();
        return fs.initialized;
    }
    
    // Version 1.0 upgrade function
    function upgradeToV1() external {
        FacetStorage storage fs = facetStorage();
        require(fs.initialized, "Not initialized");
        require(msg.sender == fs.owner, "Not owner");
        
        // Upgrade logic here
        fs.name = "ExampleFacet1_V1";
        
        emit UpgradedToV1(block.timestamp);
    }
    
    // Version selector for upgrades
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
