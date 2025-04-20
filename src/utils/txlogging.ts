// ──────────────────────────────────────────────────────────────────────────────
//  txLogging.ts
//  Extra helpers for inspecting diamond‑cut transactions
// ──────────────────────────────────────────────────────────────────────────────
import chalk from "chalk";
import { utils, ContractTransaction, ContractInterface, providers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { ethers } from "hardhat";


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
  tx: ContractTransaction,
  description = "",
  interfaces: (Interface | ContractInterface)[] = []
): Promise<providers.TransactionReceipt> {
  // normalise incoming interfaces => ethers.Interface
  const decoders: Interface[] = interfaces.map((i) =>
    i instanceof utils.Interface ? i : new utils.Interface(i)
  );

  const receipt = await tx.wait();

  /* --------------------------- basic tx statistics -------------------------- */
  console.log(chalk.green(`\n⛓️  Transaction Details${description ? ` – ${description}` : ""}`));
  console.table({
    Hash: tx.hash,
    Status: receipt.status === 1 ? "Success" : "Failed",
    Block: receipt.blockNumber,
    From: receipt.from,
    To: receipt.to,
    "Tx Index": receipt.transactionIndex,
    "Gas Used": receipt.gasUsed.toString(),
    "Cumulative Gas": receipt.cumulativeGasUsed.toString(),
    "Gas Price": receipt.effectiveGasPrice?.toString() ?? "N/A",
    "Block Hash": receipt.blockHash,
    "Confirmations": receipt.confirmations,
    "Timestamp": receipt.blockNumber
      ? new Date((await tx.wait().then(() => ethers.provider.getBlock(receipt.blockNumber))).timestamp * 1000).toLocaleString()
      : "N/A",
    "Created Contract": receipt.contractAddress ?? "N/A",
    "Created By": receipt.from,

    Events: receipt.logs.length,
  });

  /* ----------------------------- decode events ------------------------------ */
  if (receipt.logs.length === 0) return receipt;

  console.log(chalk.cyan("\n📜 Decoded events:"));

  receipt.logs.forEach((log, idx) => {
    let parsed: utils.LogDescription | undefined;

    for (const iface of decoders) {
      try {
        parsed = iface.parseLog(log);
        break; // stop at first successful decoder
      } catch (_) {
        /* ignore and try next */
      }
    }

    if (parsed) {
      const argsPretty = parsed?.args.map((arg: any, i: number) => {
        const key = parsed?.eventFragment.inputs[i].name;
        return `${key}: ${arg}`;
      });
      console.log(
        chalk.yellowBright(`  Event[${idx}]`) + chalk.bold(` ${parsed.name}`) + `  →  ${argsPretty.join(", ")}`
      );
    } else {
      console.log(chalk.dim(`  Event[${idx}]`) + ` – unable to decode (topic0 = ${log.topics[0]})`);
    }
  });

  console.log("\n");
  return receipt;
}
