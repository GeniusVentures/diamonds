import { utils, ContractTransaction, ContractInterface, providers, Signer } from "ethers";
/** Optional convenience type for TS consumers (no TypeChain) */
export interface FacetStruct {
    facetAddress: string;
    functionSelectors: string[];
}
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
export declare function logDiamondLoupe(tx: ContractTransaction, diamondLoupe: string, facetABIs?: readonly (ContractInterface | utils.Interface)[]): Promise<providers.TransactionReceipt>;
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
export declare function getDeployedFacets(diamondAddress: string, signerOrProvider?: Signer | providers.JsonRpcSigner | providers.Provider, receiptToDecode?: providers.TransactionReceipt, logDeployedFacets?: boolean): Promise<FacetStruct[]>;
//# sourceMappingURL=loupe.d.ts.map