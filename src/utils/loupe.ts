import { ContractTransactionResponse, Interface, Contract, Signer, JsonRpcProvider, TransactionReceipt, LogDescription, Log, InterfaceAbi, Provider } from "ethers";
import '@nomicfoundation/hardhat-ethers';
import chalk from "chalk";
import hre from "hardhat";
import { logTx } from "./txlogging";

/** ----------------------------------------------------------------
 *  Minimal ABI for DiamondLoupeFacet.facets()
 *  (tuple[] is encoded exactly the same as the struct array returned
 *   by the real contract, so we can decode it safely.)
 *  ----------------------------------------------------------------
 */
const DIAMOND_LOUPE_ABI = new Interface([
  "function facets() view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])"
]);

/** Optional convenience type for TS consumers (no TypeChain) */
export interface FacetStruct {
  facetAddress: string;
  functionSelectors: string[];
}

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
export async function logDiamondLoupe(
  tx: ContractTransactionResponse,
  diamondLoupe: string,
  facetABIs: readonly (InterfaceAbi | Interface)[] = []
): Promise<TransactionReceipt> {
  const receipt = await logTx(tx, `DiamondLoupe (${diamondLoupe})`, facetABIs.map(abi => abi instanceof Interface ? abi : new Interface(abi)));

  const iface = Array.isArray(facetABIs) && facetABIs.length
    ? new Interface(
      facetABIs.map(i => (i instanceof Interface ? i.fragments : i)).reduce((acc, val) => acc.concat(val), [])
    )
    : undefined;

  console.log(chalk.cyan("\n📜 Decoded Loupe logs:"));
  if (receipt && receipt.logs) {
    receipt.logs.forEach((log: Log, idx: number) => {
      if (!iface) {
        console.log(chalk.dim(`  Event[${idx}] – no ABI supplied`));
        return;
      }

      let parsed: LogDescription | undefined;
      try {
        const result = iface.parseLog(log);
        if (result !== null) {
          parsed = result;
        }
      } catch {
        /* swallow – this log wasn’t emitted by any of the supplied facets */
      }

      if (parsed) {
        const argsPretty = parsed.args
          .map((arg: any, i: number) => `${parsed?.fragment.inputs[i].name}: ${arg}`)
          .join(", ");

        console.log(
          chalk.yellowBright(`  Event[${idx}]`) +
          chalk.bold(` ${parsed.name}`) +
          `  →  ${argsPretty}`
        );
      } else {
        console.log(
          chalk.dim(`  Event[${idx}]`) + ` – unable to decode (topic0 = ${log.topics[0]})`
        );
      }
    });

    return receipt;
  }

  // Always return the receipt, even if logs are missing
  if (!receipt) {
    throw new Error("Transaction receipt is null");
  }
  return receipt;
}

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
export async function getDeployedFacets(
  diamondAddress: string,
  signerOrProvider: Signer | Provider = hre.ethers.provider,
  receiptToDecode?: TransactionReceipt,
  logDeployedFacets?: boolean, // default: assumed false
): Promise<FacetStruct[]> {
  // Generic ethers.Contract instance built only from the tiny ABI above
  const loupe = new Contract(diamondAddress, DIAMOND_LOUPE_ABI, signerOrProvider);

  // NB: cast is just to help TS‑users downstream; at runtime this is the raw array
  const facets = (await loupe.facets()) as FacetStruct[];

  if (logDeployedFacets === true) {
    console.log(chalk.magentaBright("\n🔍 Currently deployed facets (via DiamondLoupe):"));
    facets.forEach((f: { facetAddress: string; functionSelectors: string[] }, i: number) => {
      console.log(chalk.blueBright(
        `  [${i.toString().padStart(2, "0")}]  ${chalk.bold(f.facetAddress)}  –  ${f.functionSelectors.length
        } selector${f.functionSelectors.length === 1 ? "" : "s"}`
      ));
      f.functionSelectors.forEach((s: string, j: number) => {
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
      } as unknown as ContractTransactionResponse,
      diamondAddress,
      [loupe.interface]
    );
  }

  return facets;
}
