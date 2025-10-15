"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffDeployedFacets = diffDeployedFacets;
exports.printFacetSelectorFunctions = printFacetSelectorFunctions;
exports.isProtocolInitRegistered = isProtocolInitRegistered;
exports.compareFacetSelectors = compareFacetSelectors;
const abi_1 = require("@ethersproject/abi");
const chalk_1 = __importDefault(require("chalk"));
const loupe_1 = require("./loupe");
async function diffDeployedFacets(deployedDiamondData, signerOrProvider, verboseGetDeployedFacets) {
    const diamondAddress = deployedDiamondData.DiamondAddress;
    const onChainFacets = await (0, loupe_1.getDeployedFacets)(diamondAddress, signerOrProvider, undefined, verboseGetDeployedFacets);
    const localFacets = deployedDiamondData.DeployedFacets || {};
    const seen = new Set();
    let pass = true;
    console.log(chalk_1.default.magentaBright("\n🔍 Diffing on-chain facets against deployment metadata:\n"));
    for (const facet of onChainFacets) {
        const match = Object.entries(localFacets).find(([_, meta]) => meta.address?.toLowerCase() === facet.facetAddress.toLowerCase());
        if (!match) {
            console.log(chalk_1.default.red(`  ❌ On-chain facet ${facet.facetAddress} not found in deployment record.`));
            continue;
        }
        const [name, meta] = match;
        seen.add(name);
        const expected = meta.funcSelectors || [];
        const actual = facet.functionSelectors;
        const added = actual.filter((sel) => !expected.includes(sel));
        const removed = expected.filter(sel => !actual.includes(sel));
        if (added.length || removed.length) {
            console.log(chalk_1.default.yellow(`  ⚠️ Mismatch in selectors for facet ${name} (${facet.facetAddress})`));
            if (added.length)
                console.log(chalk_1.default.green(`    + Added: ${added.join(", ")}`));
            if (removed.length)
                console.log(chalk_1.default.red(`    - Missing: ${removed.join(", ")}`));
        }
        else {
            console.log(chalk_1.default.green(`  ✅ ${name} matches.`));
        }
    }
    for (const localFacetName of Object.keys(localFacets)) {
        if (pass && !seen.has(localFacetName)) {
            console.log(chalk_1.default.red(`  ❌ Deployed facet ${localFacetName} missing from on-chain state.`));
            pass = false;
        }
    }
    if (pass) {
        console.log(chalk_1.default.bgGreenBright("  ✅ All facets exist in deplyoment metadata!"));
    }
    else {
        console.log(chalk_1.default.bgRed("  ❌ Some facets do not match!"));
    }
    return pass;
}
function printFacetSelectorFunctions(abi, selectors) {
    const iface = new abi_1.Interface(abi);
    console.log(chalk_1.default.cyan("\n🔎 Matching selectors to functions:"));
    for (const selector of selectors) {
        const fragment = Object.values(iface.functions).find(fn => iface.getSighash(fn) === selector);
        console.log(`  ${selector} → ${fragment ? fragment.format() : chalk_1.default.gray("unknown")}`);
    }
}
async function isProtocolInitRegistered(deployedDiamondData, protocolInitFacet, initializerSig) {
    const facet = deployedDiamondData.DeployedFacets?.[protocolInitFacet];
    console.log(`Checking if ${protocolInitFacet} is registered with ${initializerSig}...`);
    if (!facet || !facet.funcSelectors)
        return false;
    if (!initializerSig) {
        console.warn(chalk_1.default.yellow(`  ❌ No initializer signature provided for ${protocolInitFacet}.`));
        return false;
    }
    const iface = new abi_1.Interface([`function ${initializerSig}`]);
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
function compareFacetSelectors(deployedFacetData, onChainFacets) {
    const result = {};
    const addressToName = Object.entries(deployedFacetData).reduce((acc, [name, meta]) => {
        if (meta.address)
            acc[meta.address.toLowerCase()] = name;
        return acc;
    }, {});
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
//# sourceMappingURL=diffDeployedFacets.js.map