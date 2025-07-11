import { ContractTransactionResponse, Interface, TransactionReceipt, InterfaceAbi } from "ethers";
/**
 * Pretty‑prints a transaction receipt **and** decodes its logs.
 *
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param description      Optional label that will be shown in the console header.
 * @param interfaces       One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 */
export declare function logTx(tx: ContractTransactionResponse, description?: string, interfaces?: (Interface | InterfaceAbi)[]): Promise<TransactionReceipt>;
//# sourceMappingURL=txlogging.d.ts.map