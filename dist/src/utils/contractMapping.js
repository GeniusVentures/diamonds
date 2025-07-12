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
    // Special diamond mappings for test environments
    const testDiamondMappings = {
        'TestDiamond': 'MockDiamond',
        'AdvancedTestDiamond': 'MockDiamond',
        'ConfigTestDiamond': 'MockDiamond',
        'ProxyDiamond': 'MockDiamond',
        'BenchmarkDiamond': 'BenchmarkDiamond',
        'ConcurrentDiamond0': 'MockDiamond',
        'ConcurrentDiamond1': 'MockDiamond',
        'ConcurrentDiamond2': 'MockDiamond',
        'ConcurrentDiamond3': 'MockDiamond',
        'ConcurrentDiamond4': 'MockDiamond',
    };
    // Check if there's a diamond mapping first
    if (testDiamondMappings[logicalName]) {
        try {
            await hardhat_1.artifacts.readArtifact(testDiamondMappings[logicalName]);
            return testDiamondMappings[logicalName];
        }
        catch (error) {
            // Fall through to normal logic if mapped artifact doesn't exist
        }
    }
    // Special test facet mappings for performance tests
    if (logicalName.match(/^TestFacet\d+$/)) {
        // Map TestFacet1, TestFacet2, etc. to available test facets
        try {
            await hardhat_1.artifacts.readArtifact('TestFacet2');
            return 'TestFacet2';
        }
        catch (error) {
            try {
                await hardhat_1.artifacts.readArtifact('MockTestFacet');
                return 'MockTestFacet';
            }
            catch (mockError) {
                // Fall back to the original logic
            }
        }
    }
    // Map BenchmarkFacet test names to available contracts
    if (logicalName.startsWith('BenchmarkFacet')) {
        // Extract the number from BenchmarkFacet1, BenchmarkFacet2, etc.
        const match = logicalName.match(/BenchmarkFacet(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            // Map to available mock benchmark facets (MockBenchmarkFacet1-20)
            const mockFacetNum = ((num - 1) % 20) + 1;
            const mockFacetName = `MockBenchmarkFacet${mockFacetNum}`;
            try {
                await hardhat_1.artifacts.readArtifact(mockFacetName);
                return mockFacetName;
            }
            catch (error) {
                try {
                    await hardhat_1.artifacts.readArtifact('TestFacet2');
                    return 'TestFacet2';
                }
                catch (error2) {
                    try {
                        await hardhat_1.artifacts.readArtifact('MockTestFacet');
                        return 'MockTestFacet';
                    }
                    catch (mockError) {
                        // Fall back to the original logic
                    }
                }
            }
        }
    }
    // Map SlowFacet to a real facet for timeout tests
    if (logicalName === 'SlowFacet') {
        try {
            await hardhat_1.artifacts.readArtifact('TestFacet2');
            return 'TestFacet2';
        }
        catch (error) {
            try {
                await hardhat_1.artifacts.readArtifact('MockTestFacet');
                return 'MockTestFacet';
            }
            catch (mockError) {
                // Fall back to the original logic
            }
        }
    }
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
        'TestDiamond': 'MockDiamond',
        'AdvancedTestDiamond': 'MockDiamond',
        'ConfigTestDiamond': 'MockDiamond',
        'ProxyDiamond': 'MockDiamond',
        'BenchmarkDiamond': 'BenchmarkDiamond',
        'ConcurrentDiamond0': 'MockDiamond',
        'ConcurrentDiamond1': 'MockDiamond',
        'ConcurrentDiamond2': 'MockDiamond',
        'ConcurrentDiamond3': 'MockDiamond',
        'ConcurrentDiamond4': 'MockDiamond',
    };
    // Check if there's a test mapping first
    if (testMappings[diamondName]) {
        try {
            await hardhat_1.artifacts.readArtifact(testMappings[diamondName]);
            return testMappings[diamondName];
        }
        catch (error) {
            // Fall through to normal logic if mapped artifact doesn't exist
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
    // Use the same mapping logic as getContractName
    const mappedName = await getContractName(logicalName);
    return await hardhat_1.artifacts.readArtifact(mappedName);
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