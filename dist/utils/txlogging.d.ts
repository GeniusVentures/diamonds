import { ContractTransaction, ContractInterface, providers } from "ethers";
import { Interface } from "ethers/lib/utils";
/**
 * Pretty‑prints a transaction receipt **and** decodes its logs.
 *
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param description      Optional label that will be shown in the console header.
 * @param interfaces       One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 */
export declare function logTx(tx: ContractTransaction, description?: string, interfaces?: (Interface | ContractInterface)[]): Promise<providers.TransactionReceipt>;
//# sourceMappingURL=txlogging.d.ts.map