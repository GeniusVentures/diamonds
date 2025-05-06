"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployedFacets = exports.logDiamondLoupe = void 0;
const ethers_1 = require("ethers");
const chalk_1 = __importDefault(require("chalk"));
const hardhat_1 = require("hardhat");
const txlogging_1 = require("./txlogging");
/** ----------------------------------------------------------------
 *  Minimal ABI for DiamondLoupeFacet.facets()
 *  (tuple[] is encoded exactly the same as the struct array returned
 *   by the real contract, so we can decode it safely.)
 *  ----------------------------------------------------------------
 */
const DIAMOND_LOUPE_ABI = [
    "function facets() view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])"
];
// -----------------------------------------------------------------------------
// logDiamondLoupe ­– decodes *events* that were emitted during a diamondCut()
// -----------------------------------------------------------------------------
/**
 * logDiamondLoupe
 * • pretty‑prints the transaction receipt
 * • decodes the logs emitted by the DiamondLoupeFacet
 * • decodes the logs emitted by the facets that were passed in
 *  (e.g. the facets that were added/removed)
 * • prints the decoded events to the console
 * • returns the transaction receipt
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param diamondLoupe     Address of the diamond proxy
 * @param facetABIs        One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 *                         Pass an empty array if you don’t want to decode any facet events.
 *                         (e.g. `[]`)
 *                        (NB: this is not the same as the diamondLoupe address)
 * @returns              The transaction receipt
 */
async function logDiamondLoupe(tx, diamondLoupe, facetABIs = []) {
    const receipt = await (0, txlogging_1.logTx)(tx, `DiamondLoupe (${diamondLoupe})`, [...facetABIs]);
    const iface = Array.isArray(facetABIs) && facetABIs.length
        ? new ethers_1.utils.Interface(facetABIs.map(i => (ethers_1.utils.Interface.isInterface(i) ? i.fragments : i)).reduce((acc, val) => acc.concat(val), []))
        : undefined;
    console.log(chalk_1.default.cyan("\n📜 Decoded Loupe logs:"));
    receipt.logs.forEach((log, idx) => {
        if (!iface) {
            console.log(chalk_1.default.dim(`  Event[${idx}] – no ABI supplied`));
            return;
        }
        let parsed;
        try {
            parsed = iface.parseLog(log);
        }
        catch (_a) {
            /* swallow – this log wasn’t emitted by any of the supplied facets */
        }
        if (parsed) {
            const argsPretty = parsed.args
                .map((arg, i) => `${parsed === null || parsed === void 0 ? void 0 : parsed.eventFragment.inputs[i].name}: ${arg}`)
                .join(", ");
            console.log(chalk_1.default.yellowBright(`  Event[${idx}]`) +
                chalk_1.default.bold(` ${parsed.name}`) +
                `  →  ${argsPretty}`);
        }
        else {
            console.log(chalk_1.default.dim(`  Event[${idx}]`) + ` – unable to decode (topic0 = ${log.topics[0]})`);
        }
    });
    return receipt;
}
exports.logDiamondLoupe = logDiamondLoupe;
/**
 * Fetch the list of deployed facets from a diamond without relying on
 * TypeChain’s IDiamondLoupe typings.
 * getDeployedFacets – convenience wrapper around DiamondLoupe.facets()
 * • fetches the facet list
 * • pretty‑prints it
 * • (optionally) calls logDiamondLoupe if you pass a receipt
 *
 * @param diamondAddress   Address of the diamond proxy
 * @param signerOrProvider Signer (for tx) or provider (for read‑only)
 * @param receiptToDecode  Optional transaction receipt to decode
 *                         (e.g. from a diamondCut() transaction)
 * @returns              Array of FacetStruct objects
 *                       (address + functionSelectors)
 *                       (see DiamondLoupeFacet.sol)
 */
async function getDeployedFacets(diamondAddress, signerOrProvider = hardhat_1.ethers.provider, receiptToDecode, logDeployedFacets) {
    // Generic ethers.Contract instance built only from the tiny ABI above
    const loupe = new ethers_1.Contract(diamondAddress, DIAMOND_LOUPE_ABI, signerOrProvider);
    // NB: cast is just to help TS‑users downstream; at runtime this is the raw array
    const facets = (await loupe.facets());
    if (logDeployedFacets === true) {
        console.log(chalk_1.default.magentaBright("\n🔍 Currently deployed facets (via DiamondLoupe):"));
        facets.forEach((f, i) => {
            console.log(chalk_1.default.blueBright(`  [${i.toString().padStart(2, "0")}]  ${chalk_1.default.bold(f.facetAddress)}  –  ${f.functionSelectors.length} selector${f.functionSelectors.length === 1 ? "" : "s"}`));
            f.functionSelectors.forEach((s, j) => {
                console.log(`    ${j.toString().padStart(2, "0")}:  ${s}`);
            });
            console.log();
        });
    }
    // If the caller supplied a receipt from a recent diamondCut, decode it too
    if (receiptToDecode) {
        await logDiamondLoupe(
        // fabricate a ContractTransaction‑like object so logDiamondLoupe
        // can stay reception‑agnostic
        {
            ...receiptToDecode,
            wait: async () => receiptToDecode,
        }, diamondAddress, [loupe.interface]);
    }
    return facets;
}
exports.getDeployedFacets = getDeployedFacets;
//# sourceMappingURL=loupe.js.map