import { DeployedDiamondData } from "../schemas";
import { getDeployedFacets } from "./loupe";
import { JsonRpcProvider } from "ethers";
import { Interface } from "@ethersproject/abi";
import { Signer } from "@ethersproject/abstract-signer";
import chalk from "chalk";
import { boolean } from "zod";

export async function diffDeployedFacets(
  deployedDiamondData: DeployedDiamondData,
  signerOrProvider: Signer | JsonRpcProvider,
  verboseGetDeployedFacets?: boolean,
): Promise<boolean> {
  const diamondAddress = deployedDiamondData.DiamondAddress!;
  const onChainFacets = await getDeployedFacets(diamondAddress, signerOrProvider as any, undefined, verboseGetDeployedFacets);

  const localFacets = deployedDiamondData.DeployedFacets || {};

  const seen = new Set<string>();

  let pass: boolean = true;

  console.log(chalk.magentaBright("\n🔍 Diffing on-chain facets against deployment metadata:\n"));

  for (const facet of onChainFacets) {
    const match = Object.entries(localFacets).find(([_, meta]) => meta.address?.toLowerCase() === facet.facetAddress.toLowerCase());
    if (!match) {
      console.log(chalk.red(`  ❌ On-chain facet ${facet.facetAddress} not found in deployment record.`));
      continue;
    }

    const [name, meta] = match;
    seen.add(name);

    const expected = meta.funcSelectors || [];
    const actual = facet.functionSelectors;

    const added: string[] = actual.filter((sel: string) => !expected.includes(sel));
    const removed = expected.filter(sel => !actual.includes(sel));

    if (added.length || removed.length) {
      console.log(chalk.yellow(`  ⚠️ Mismatch in selectors for facet ${name} (${facet.facetAddress})`));
      if (added.length) console.log(chalk.green(`    + Added: ${added.join(", ")}`));
      if (removed.length) console.log(chalk.red(`    - Missing: ${removed.join(", ")}`));
    } else {
      console.log(chalk.green(`  ✅ ${name} matches.`));
    }
  }

  for (const localFacetName of Object.keys(localFacets)) {
    if (pass && !seen.has(localFacetName)) {
      console.log(chalk.red(`  ❌ Deployed facet ${localFacetName} missing from on-chain state.`));
      pass = false;
    }
  }
  if (pass) {
    console.log(chalk.bgGreenBright("  ✅ All facets exist in deplyoment metadata!"));
  } else {
    console.log(chalk.bgRed("  ❌ Some facets do not match!"));
  }
  return pass;
}

export function printFacetSelectorFunctions(abi: any, selectors: string[]) {
  const iface = new Interface(abi);

  console.log(chalk.cyan("\n🔎 Matching selectors to functions:"));
  for (const selector of selectors) {
    const fragment = Object.values(iface.functions).find(fn =>
      iface.getSighash(fn) === selector
    );
    console.log(`  ${selector} → ${fragment ? fragment.format() : chalk.gray("unknown")}`);
  }
}

export async function isProtocolInitRegistered(
  deployedDiamondData: DeployedDiamondData,
  protocolInitFacet: string,
  initializerSig: string
): Promise<boolean> {
  const facet = deployedDiamondData.DeployedFacets?.[protocolInitFacet];
  console.log(`Checking if ${protocolInitFacet} is registered with ${initializerSig}...`);

  if (!facet || !facet.funcSelectors) return false;
  if (!initializerSig) {
    console.warn(chalk.yellow(`  ❌ No initializer signature provided for ${protocolInitFacet}.`));
    return false;
  }
  const iface = new Interface([`function ${initializerSig}`]);
  const selector = iface.getSighash(initializerSig);
  console.log(`  Found selector: ${selector}`);
  return facet.funcSelectors.includes(selector);
}

/**
 * Compares facet selectors from on-chain DiamondLoupe with local DeployedDiamondData
 *
 * @param deployedFacetData - local metadata (facetName -> { address, funcSelectors[] })
 * @param onChainFacets - list of { facetAddress, functionSelectors[] } from DiamondLoupe
 * @returns map of facetName -> { extraOnChain[], missingOnChain[], matched[] }
 */
export function compareFacetSelectors(
  deployedFacetData: Record<string, { address?: string; funcSelectors?: string[] }>,
  onChainFacets: { facetAddress: string; functionSelectors: string[] }[]
) {
  const result: Record<string, {
    extraOnChain: string[];
    missingOnChain: string[];
    matched: string[];
  }> = {};

  const addressToName = Object.entries(deployedFacetData).reduce((acc, [name, meta]) => {
    if (meta.address) acc[meta.address.toLowerCase()] = name;
    return acc;
  }, {} as Record<string, string>);

  for (const { facetAddress, functionSelectors } of onChainFacets) {
    const lowerAddr = facetAddress.toLowerCase();
    const name = addressToName[lowerAddr] || "unknown";

    const expected = new Set(deployedFacetData[name]?.funcSelectors || []);
    const actual = new Set(functionSelectors);

    result[name] = {
      extraOnChain: [...actual].filter(sel => !expected.has(sel)).sort(),
      missingOnChain: [...expected].filter(sel => !actual.has(sel)).sort(),
      matched: [...actual].filter(sel => expected.has(sel)).sort(),
    };
  }

  return result;
}