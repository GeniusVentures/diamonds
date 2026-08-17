import { artifacts } from 'hardhat';
import { Artifact } from 'hardhat/types';
import { Diamond } from '../core/Diamond';

/**
 * Maps logical facet names to actual contract names available in artifacts.
 * This handles both production contracts and mock contracts for testing.
 */
export async function getContractName(
	logicalName: string,
	diamond?: Diamond,
): Promise<string> {
	// If diamond is provided, check for diamond-specific contract mappings
	if (diamond) {
		// Try to load diamond-specific ABI first
		const diamondAbiFilePath = diamond.getDiamondAbiFilePath();

		// For now, we'll still fall back to the standard mapping logic
		// but this provides a hook for future diamond-specific mappings
	}
	// Special diamond mappings for test environments
	const testDiamondMappings: Record<string, string> = {
		TestDiamond: 'MockDiamond',
		AdvancedTestDiamond: 'MockDiamond',
		ConfigTestDiamond: 'MockDiamond',
		ProxyDiamond: 'MockDiamond',
		BenchmarkDiamond: 'BenchmarkDiamond',
		ConcurrentDiamond0: 'MockDiamond',
		ConcurrentDiamond1: 'MockDiamond',
		ConcurrentDiamond2: 'MockDiamond',
		ConcurrentDiamond3: 'MockDiamond',
		ConcurrentDiamond4: 'MockDiamond',
	};

	// Check if there's a diamond mapping first
	if (logicalName in testDiamondMappings) {
		try {
			const mappedName =
				testDiamondMappings[logicalName as keyof typeof testDiamondMappings];
			await artifacts.readArtifact(mappedName);
			return mappedName;
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
export async function getDiamondContractName(
	diamondName: string,
	diamond?: Diamond,
): Promise<string> {
	// Special mappings for test environments
	const testMappings: Record<string, string> = {
		TestDiamond: 'MockDiamond',
		AdvancedTestDiamond: 'MockDiamond',
		ConfigTestDiamond: 'MockDiamond',
		ProxyDiamond: 'MockDiamond',
		BenchmarkDiamond: 'BenchmarkDiamond',
		ConcurrentDiamond0: 'MockDiamond',
		ConcurrentDiamond1: 'MockDiamond',
		ConcurrentDiamond2: 'MockDiamond',
		ConcurrentDiamond3: 'MockDiamond',
		ConcurrentDiamond4: 'MockDiamond',
	};

	// Check if there's a test mapping first
	if (diamondName in testMappings) {
		try {
			const mappedName = testMappings[diamondName as keyof typeof testMappings];
			await artifacts.readArtifact(mappedName);
			return mappedName;
		} catch (error) {
			// Fall through to normal logic if mapped artifact doesn't exist
		}
	}

	// Resolve to a fully qualified name up front. The Diamond ABI generator emits a
	// synthetic, ABI-only artifact (e.g. `diamond-abi/<Name>.sol`) that shares the
	// contract name but was never compiled — it has no build-info. When that stub is
	// present in the artifacts index, passing the BARE name to
	// `ethers.getContractFactory`/`getContractAt` throws HH701 ("multiple artifacts"),
	// and whether the stub is registered at any moment is timing-dependent. So instead
	// of reacting to a thrown HH701, proactively resolve to the candidate that HAS
	// build-info (produced by the compiler from a real source file) whenever it is
	// unambiguous — the returned FQN is then immune to the stub appearing later.
	try {
		const allFqns = await artifacts.getAllFullyQualifiedNames();
		const candidates = allFqns.filter((fqn) => fqn.endsWith(`:${diamondName}`));
		if (candidates.length > 0) {
			// Collect candidates that are backed by compilation build-info.
			const compiled: string[] = [];
			for (const fqn of candidates) {
				try {
					const buildInfo = await artifacts.getBuildInfo(fqn);
					if (buildInfo !== undefined) {
						compiled.push(fqn);
					}
				} catch {
					// Not a compiled artifact — ignore.
				}
			}
			// Exactly one compiled artifact: return its FQN (deterministic, stub-proof).
			if (compiled.length === 1) {
				await artifacts.readArtifact(compiled[0]);
				return compiled[0];
			}
			// A single candidate total (no ambiguity): use it directly.
			if (candidates.length === 1) {
				await artifacts.readArtifact(candidates[0]);
				return candidates[0];
			}
		}
	} catch {
		// Fall through to legacy bare-name handling below.
	}

	// Legacy fallback: try the bare diamond name, then the Mock-prefixed test name.
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
export async function getContractArtifact(
	logicalName: string,
	diamond?: Diamond,
): Promise<Artifact> {
	// Use the same mapping logic as getContractName
	const mappedName = await getContractName(logicalName, diamond);
	return await artifacts.readArtifact(mappedName);
}

/**
 * Standard mapping for common facet types
 */
export const FACET_TYPE_MAPPING = {
	DiamondCutFacet: 'DiamondCutFacet',
	DiamondLoupeFacet: 'DiamondLoupeFacet',
	TestFacet: 'TestFacet',
	OwnershipFacet: 'OwnershipFacet',
	// Add more mappings as needed
} as const;

/**
 * Get all available contract names from artifacts
 */
export async function getAvailableContracts(): Promise<string[]> {
	const names = await artifacts.getAllFullyQualifiedNames();
	return names.map((name) => name.split(':').pop() ?? name);
}
