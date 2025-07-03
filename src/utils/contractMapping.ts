import { artifacts } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Artifact } from 'hardhat/types';

/**
 * Maps logical facet names to actual contract names available in artifacts.
 * This handles both production contracts and mock contracts for testing.
 */
export async function getContractName(logicalName: string): Promise<string> {
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
    'TestDiamond': 'MockDiamond'
  };

  // Check if there's a test mapping first
  if (testMappings[diamondName]) {
    try {
      await artifacts.readArtifact(testMappings[diamondName]);
      return testMappings[diamondName];
    } catch (error) {
      // Fall through to normal logic
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
  // Try the logical name first (for production)
  try {
    return await artifacts.readArtifact(logicalName);
  } catch (error) {
    // If logical name fails, try Mock prefixed version (for testing)
    const mockName = `Mock${logicalName}`;
    try {
      return await artifacts.readArtifact(mockName);
    } catch (mockError) {
      // If both fail, throw the original error
      throw error;
    }
  }
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
