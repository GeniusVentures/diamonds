// ──────────────────────────────────────────────────────────────────────────────
//  txLogging.ts
//  Extra helpers for inspecting diamond‑cut transactions
// ──────────────────────────────────────────────────────────────────────────────
import chalk from "chalk";
import { ContractTransactionResponse, Interface, Provider, TransactionReceipt, LogDescription, InterfaceAbi } from "ethers";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";


/**
 * Pretty‑prints a transaction receipt **and** decodes its logs.
 *
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param description      Optional label that will be shown in the console header.
 * @param interfaces       One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;   
 *                         additional ABIs (e.g. library or facet events) can follow.
 */
export async function logTx(
  tx: ContractTransactionResponse,
  description = "",
  interfaces: (Interface | InterfaceAbi)[] = [],
  // verbose?: boolean
): Promise<TransactionReceipt> {
  // normalise incoming interfaces => ethers.Interface
  const decoders: Interface[] = interfaces.map((i) =>
    i instanceof Interface ? i : new Interface(i)
  );

  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction receipt is null");
  }

  /* --------------------------- basic tx statistics -------------------------- */
  console.log(chalk.green(`\n⛓️  Transaction Details${description ? ` – ${description}` : ""}`));
  console.table({
    Hash: tx.hash,
    Status: receipt.status === 1 ? "Success" : "Failed",
    Block: receipt.blockNumber,
    From: receipt.from,
    To: receipt.to,
    "Tx Index": (receipt as any).transactionIndex ?? receipt.index ?? "N/A",
    "Gas Used": receipt.gasUsed.toString(),
    "Cumulative Gas": receipt.cumulativeGasUsed.toString(),
    "Gas Price": (receipt as any).gasPrice?.toString() ?? "N/A",
    "Block Hash": receipt.blockHash,
    "Confirmations": receipt.confirmations,
    "Timestamp": receipt.blockNumber
      ? new Date(((await tx.wait().then(() => hre.ethers.provider.getBlock(receipt.blockNumber))) || { timestamp: 0 }).timestamp * 1000).toLocaleString()
      : "N/A",
    "Created Contract": receipt.contractAddress ?? "N/A",
    "Created By": receipt.from,

    Events: receipt.logs.length,
  });

  /* ----------------------------- decode events ------------------------------ */
  if (receipt.logs.length === 0) return receipt;
  console.log(chalk.cyan("\n📜 Decoded events:"));
  receipt.logs.forEach((log: any, idx: number) => {
    let parsed: LogDescription | undefined;
    for (const iface of decoders) {
      try {
        const result = iface.parseLog(log);
        if (result !== null) {
          parsed = result;
          break; // stop at first successful decoder
        }
      } catch (_) {
        /* ignore and try next */
      }
    }

    if (parsed) {
      const argsPretty = parsed.args
        .map((arg: any, i: number) => {
          const key = parsed?.fragment.inputs[i].name;
          return `${key ? key + ": " : ""}${arg}`;
        })
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
