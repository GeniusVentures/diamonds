# Diamond ABI Configuration

The Diamond ABI generator is configurable with storage location and file naming. Here's what was accomplished:

✅ Configuration Features
Configurable Storage Path: Added diamondAbiPath to DiamondPathsConfig with default ./diamond-abi
Configurable File Naming: Added diamondAbiFileName to DiamondConfig with default using diamond name
Smart Defaults: When not specified, the filename defaults to {diamondName}.json

Diamond Class (Diamond.ts):

Added properties and getter methods for ABI path configuration
Implemented path resolution with sensible defaults

DiamondAbiGenerator (diamondAbiGenerator.ts):

Updated to use Diamond's configured paths instead of hardcoded values
Maintained backward compatibility with existing usage

Deployment Strategies:

Updated BaseDeploymentStrategy and OZDefenderDeploymentStrategy
Pass Diamond objects to contract mapping functions
Test Suite Updates:

Updated CLI tools - The diamond-abi-cli.ts now uses Diamond's configured paths instead of hardcoded defaults.
deployment strategies - Confirmed that BaseDeploymentStrategy and OZDefenderDeploymentStrategy use facet artifacts directly and don't need diamond ABI file loading.

Flexibility: Users can now specify custom ABI storage locations
Customization: Diamond ABI files can have custom names
Backward Compatibility: Existing code works without changes
Smart Defaults: Sensible defaults when configuration not provided
Professional Standards: Clean, maintainable code with full test coverage

Hardhat Compatibility: ✅ Tested - diamond ABI files stored safely outside artifacts directory

Default: {configFileDirectory}/diamond-abi/
Custom: User-configurable via diamondAbiPath config option
Avoids: artifacts directory to prevent hardhat compile conflicts
The implementation maintains full backward compatibility while providing professional-grade configuration management throughout the diamond system.