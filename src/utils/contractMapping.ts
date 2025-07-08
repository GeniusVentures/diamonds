import { artifacts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Artifact } from 'hardhat/types';

/**
 * Maps logical facet names to actual contract names available in artifacts.
 * This handles both production contracts and mock contracts for testing.
 */
export async function getContractName(logicalName: string): Promise<string> {
  // Special diamond mappings for test environments
  const testDiamondMappings: Record<string, string> = {
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
      await artifacts.readArtifact(testDiamondMappings[logicalName]);
      return testDiamondMappings[logicalName];
    } catch (error) {
      // Fall through to normal logic if mapped artifact doesn't exist
    }
  }

  // Special test facet mappings for performance tests
  if (logicalName.match(/^TestFacet\d+$/)) {
    // Map TestFacet1, TestFacet2, etc. to available test facets
    try {
      await artifacts.readArtifact('TestFacet2');
      return 'TestFacet2';
    } catch (error) {
      try {
        await artifacts.readArtifact('MockTestFacet');
        return 'MockTestFacet';
      } catch (mockError) {
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
        await artifacts.readArtifact(mockFacetName);
        return mockFacetName;
      } catch (error) {
        try {
          await artifacts.readArtifact('TestFacet2');
          return 'TestFacet2';
        } catch (error2) {
          try {
            await artifacts.readArtifact('MockTestFacet');
            return 'MockTestFacet';
          } catch (mockError) {
            // Fall back to the original logic
          }
        }
      }
    }
  }

  // Map SlowFacet to a real facet for timeout tests
  if (logicalName === 'SlowFacet') {
    try {
      await artifacts.readArtifact('TestFacet2');
      return 'TestFacet2';
    } catch (error) {
      try {
        await artifacts.readArtifact('MockTestFacet');
        return 'MockTestFacet';
      } catch (mockError) {
        // Fall back to the original logic
      }
    }
  }

  // Try the logical name first (for production)
  try {
    await artifacts.readArtifact(logicalName);
    return logicalName;
  } catch (error) {
    // If logical name fails, try Mock prefixed version (for testing)
    const mockName = `Mock${logicalName}`;
    try {
      await artifacts.readArtifact(mockName);
      return mockName;
    } catch (mockError) {
      // If both fail, throw the original error
      throw error;
    }
  }
}

/**
 * Maps logical diamond name to actual contract name available in artifacts.
 */
export async function getDiamondContractName(diamondName: string): Promise<string> {
  // Special mappings for test environments
  const testMappings: Record<string, string> = {
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
      await artifacts.readArtifact(testMappings[diamondName]);
      return testMappings[diamondName];
    } catch (error) {
      // Fall through to normal logic if mapped artifact doesn't exist
    }
  }

  // Try the diamond name first (for production)
  try {
    await artifacts.readArtifact(diamondName);
    return diamondName;
  } catch (error) {
    // If diamond name fails, try Mock prefixed version (for testing)
    const mockName = `Mock${diamondName}`;
    try {
      await artifacts.readArtifact(mockName);
      return mockName;
    } catch (mockError) {
      // If both fail, throw the original error
      throw error;
    }
  }
}

/**
 * Gets the contract artifact for a logical name, trying both production and mock versions
 */
export async function getContractArtifact(logicalName: string): Promise<Artifact> {
  // Use the same mapping logic as getContractName
  const mappedName = await getContractName(logicalName);
  return await artifacts.readArtifact(mappedName);
}

/**
 * Standard mapping for common facet types
 */
export const FACET_TYPE_MAPPING = {
  'DiamondCutFacet': 'DiamondCutFacet',
  'DiamondLoupeFacet': 'DiamondLoupeFacet',
  'TestFacet': 'TestFacet',
  'OwnershipFacet': 'OwnershipFacet',
  // Add more mappings as needed
} as const;

/**
 * Get all available contract names from artifacts
 */
export async function getAvailableContracts(): Promise<string[]> {
  const names = await artifacts.getAllFullyQualifiedNames();
  return names.map(name => name.split(':').pop() || name);
}
