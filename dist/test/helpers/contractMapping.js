"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FACET_TYPE_MAPPING = void 0;
exports.getContractName = getContractName;
exports.getDiamondContractName = getDiamondContractName;
exports.getContractArtifact = getContractArtifact;
exports.getAvailableContracts = getAvailableContracts;
const hardhat_1 = require("hardhat");
/**
 * Maps logical facet names to actual contract names available in artifacts.
 * This handles both production contracts and mock contracts for testing.
 */
async function getContractName(logicalName) {
    // Try the logical name first (for production)
    try {
        await hardhat_1.artifacts.readArtifact(logicalName);
        return logicalName;
    }
    catch (error) {
        // If logical name fails, try Mock prefixed version (for testing)
        const mockName = `Mock${logicalName}`;
        try {
            await hardhat_1.artifacts.readArtifact(mockName);
            return mockName;
        }
        catch (mockError) {
            // If both fail, throw the original error
            throw error;
        }
    }
}
/**
 * Maps logical diamond name to actual contract name available in artifacts.
 */
async function getDiamondContractName(diamondName) {
    // Special mappings for test environments
    const testMappings = {
        'TestDiamond': 'MockDiamond'
    };
    // Check if there's a test mapping first
    if (testMappings[diamondName]) {
        try {
            await hardhat_1.artifacts.readArtifact(testMappings[diamondName]);
            return testMappings[diamondName];
        }
        catch (error) {
            // Fall through to normal logic
        }
    }
    // Try the diamond name first (for production)
    try {
        await hardhat_1.artifacts.readArtifact(diamondName);
        return diamondName;
    }
    catch (error) {
        // If diamond name fails, try Mock prefixed version (for testing)
        const mockName = `Mock${diamondName}`;
        try {
            await hardhat_1.artifacts.readArtifact(mockName);
            return mockName;
        }
        catch (mockError) {
            // If both fail, throw the original error
            throw error;
        }
    }
}
/**
 * Gets the contract artifact for a logical name, trying both production and mock versions
 */
async function getContractArtifact(logicalName) {
    // Try the logical name first (for production)
    try {
        return await hardhat_1.artifacts.readArtifact(logicalName);
    }
    catch (error) {
        // If logical name fails, try Mock prefixed version (for testing)
        const mockName = `Mock${logicalName}`;
        try {
            return await hardhat_1.artifacts.readArtifact(mockName);
        }
        catch (mockError) {
            // If both fail, throw the original error
            throw error;
        }
    }
}
/**
 * Standard mapping for common facet types
 */
exports.FACET_TYPE_MAPPING = {
    'DiamondCutFacet': 'DiamondCutFacet',
    'DiamondLoupeFacet': 'DiamondLoupeFacet',
    'TestFacet': 'TestFacet',
    'OwnershipFacet': 'OwnershipFacet',
    // Add more mappings as needed
};
/**
 * Get all available contract names from artifacts
 */
async function getAvailableContracts() {
    const names = await hardhat_1.artifacts.getAllFullyQualifiedNames();
    return names.map(name => name.split(':').pop() || name);
}
//# sourceMappingURL=contractMapping.js.map