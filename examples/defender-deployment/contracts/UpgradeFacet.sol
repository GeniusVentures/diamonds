// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract UpgradeFacet {
    bytes32 constant STORAGE_POSITION = keccak256("upgrade.facet.storage");
    
    struct FacetStorage {
        uint256 upgradeCount;
        mapping(uint256 => uint256) upgradeTimestamps;
        bool initialized;
        string[] upgradeLog;
    }
    
    function facetStorage() internal pure returns (FacetStorage storage fs) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            fs.slot := position
        }
    }
    
    event Initialized(uint256 timestamp);
    event UpgradeLogged(uint256 indexed upgradeId, string description, uint256 timestamp);
    event SystemUpgraded(string version, uint256 timestamp);
    
    function initialize() external {
        FacetStorage storage fs = facetStorage();
        require(!fs.initialized, "Already initialized");
        
        fs.initialized = true;
        fs.upgradeCount = 0;
        
        emit Initialized(block.timestamp);
    }
    
    function logUpgrade(string memory description) external {
        FacetStorage storage fs = facetStorage();
        require(fs.initialized, "Not initialized");
        
        uint256 upgradeId = fs.upgradeCount++;
        fs.upgradeTimestamps[upgradeId] = block.timestamp;
        fs.upgradeLog.push(description);
        
        emit UpgradeLogged(upgradeId, description, block.timestamp);
    }
    
    function getUpgradeCount() external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        return fs.upgradeCount;
    }
    
    function getUpgradeTimestamp(uint256 upgradeId) external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        require(upgradeId < fs.upgradeCount, "Invalid upgrade ID");
        return fs.upgradeTimestamps[upgradeId];
    }
    
    function getUpgradeLog() external view returns (string[] memory) {
        FacetStorage storage fs = facetStorage();
        return fs.upgradeLog;
    }
    
    function getLatestUpgrade() external view returns (string memory, uint256) {
        FacetStorage storage fs = facetStorage();
        require(fs.upgradeCount > 0, "No upgrades logged");
        
        uint256 latestId = fs.upgradeCount - 1;
        return (fs.upgradeLog[latestId], fs.upgradeTimestamps[latestId]);
    }
    
    function markSystemUpgrade(string memory _version) external {
        FacetStorage storage fs = facetStorage();
        require(fs.initialized, "Not initialized");
        
        string memory description = string(abi.encodePacked("System upgrade to version ", _version));
        
        uint256 upgradeId = fs.upgradeCount++;
        fs.upgradeTimestamps[upgradeId] = block.timestamp;
        fs.upgradeLog.push(description);
        
        emit UpgradeLogged(upgradeId, description, block.timestamp);
        emit SystemUpgraded(_version, block.timestamp);
    }
    
    function isInitialized() external view returns (bool) {
        FacetStorage storage fs = facetStorage();
        return fs.initialized;
    }
    
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
