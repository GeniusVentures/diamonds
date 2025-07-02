// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ExampleFacet2 {
    bytes32 constant STORAGE_POSITION = keccak256("example.facet2.storage");
    
    struct FacetStorage {
        mapping(address => uint256) balances;
        uint256 totalSupply;
        bool setupComplete;
        uint256 setupTimestamp;
    }
    
    function facetStorage() internal pure returns (FacetStorage storage fs) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            fs.slot := position
        }
    }
    
    event Setup(uint256 timestamp);
    event BalanceUpdated(address indexed account, uint256 oldBalance, uint256 newBalance);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    
    function setup() external {
        FacetStorage storage fs = facetStorage();
        require(!fs.setupComplete, "Already setup");
        
        fs.setupComplete = true;
        fs.setupTimestamp = block.timestamp;
        fs.totalSupply = 1000000; // 1M tokens
        fs.balances[msg.sender] = fs.totalSupply;
        
        emit Setup(block.timestamp);
        emit BalanceUpdated(msg.sender, 0, fs.totalSupply);
    }
    
    function isSetupComplete() external view returns (bool) {
        FacetStorage storage fs = facetStorage();
        return fs.setupComplete;
    }
    
    function getSetupTimestamp() external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        return fs.setupTimestamp;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        return fs.balances[account];
    }
    
    function totalSupply() external view returns (uint256) {
        FacetStorage storage fs = facetStorage();
        return fs.totalSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        FacetStorage storage fs = facetStorage();
        require(fs.setupComplete, "Not setup");
        require(fs.balances[msg.sender] >= amount, "Insufficient balance");
        
        uint256 fromBalance = fs.balances[msg.sender];
        uint256 toBalance = fs.balances[to];
        
        fs.balances[msg.sender] = fromBalance - amount;
        fs.balances[to] = toBalance + amount;
        
        emit BalanceUpdated(msg.sender, fromBalance, fs.balances[msg.sender]);
        emit BalanceUpdated(to, toBalance, fs.balances[to]);
        emit Transfer(msg.sender, to, amount);
        
        return true;
    }
    
    function mint(address to, uint256 amount) external returns (bool) {
        FacetStorage storage fs = facetStorage();
        require(fs.setupComplete, "Not setup");
        
        uint256 oldBalance = fs.balances[to];
        fs.balances[to] = oldBalance + amount;
        fs.totalSupply += amount;
        
        emit BalanceUpdated(to, oldBalance, fs.balances[to]);
        emit Transfer(address(0), to, amount);
        
        return true;
    }
    
    function burn(uint256 amount) external returns (bool) {
        FacetStorage storage fs = facetStorage();
        require(fs.setupComplete, "Not setup");
        require(fs.balances[msg.sender] >= amount, "Insufficient balance");
        
        uint256 oldBalance = fs.balances[msg.sender];
        fs.balances[msg.sender] = oldBalance - amount;
        fs.totalSupply -= amount;
        
        emit BalanceUpdated(msg.sender, oldBalance, fs.balances[msg.sender]);
        emit Transfer(msg.sender, address(0), amount);
        
        return true;
    }
}
