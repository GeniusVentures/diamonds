"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTx = logTx;
// ──────────────────────────────────────────────────────────────────────────────
//  txLogging.ts
//  Extra helpers for inspecting diamond‑cut transactions
// ──────────────────────────────────────────────────────────────────────────────
const chalk_1 = __importDefault(require("chalk"));
const ethers_1 = require("ethers");
const hardhat_1 = __importDefault(require("hardhat"));
require("@nomicfoundation/hardhat-ethers");
/**
 * Pretty‑prints a transaction receipt **and** decodes its logs.
 *
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param description      Optional label that will be shown in the console header.
 * @param interfaces       One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 */
async function logTx(tx, description = "", interfaces = []) {
    // normalise incoming interfaces => ethers.Interface
    const decoders = interfaces.map((i) => i instanceof ethers_1.Interface ? i : new ethers_1.Interface(i));
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error("Transaction receipt is null");
    }
    /* --------------------------- basic tx statistics -------------------------- */
    console.log(chalk_1.default.green(`\n⛓️  Transaction Details${description ? ` – ${description}` : ""}`));
    console.table({
        Hash: tx.hash,
        Status: receipt.status === 1 ? "Success" : "Failed",
        Block: receipt.blockNumber,
        From: receipt.from,
        To: receipt.to,
        "Tx Index": receipt.transactionIndex ?? receipt.index ?? "N/A",
        "Gas Used": receipt.gasUsed.toString(),
        "Cumulative Gas": receipt.cumulativeGasUsed.toString(),
        "Gas Price": receipt.gasPrice?.toString() ?? "N/A",
        "Block Hash": receipt.blockHash,
        "Confirmations": receipt.confirmations,
        "Timestamp": receipt.blockNumber
            ? new Date(((await tx.wait().then(() => hardhat_1.default.ethers.provider.getBlock(receipt.blockNumber))) || { timestamp: 0 }).timestamp * 1000).toLocaleString()
            : "N/A",
        "Created Contract": receipt.contractAddress ?? "N/A",
        "Created By": receipt.from,
        Events: receipt.logs.length,
    });
    /* ----------------------------- decode events ------------------------------ */
    if (receipt.logs.length === 0)
        return receipt;
    console.log(chalk_1.default.cyan("\n📜 Decoded events:"));
    receipt.logs.forEach((log, idx) => {
        let parsed;
        for (const iface of decoders) {
            try {
                const result = iface.parseLog(log);
                if (result !== null) {
                    parsed = result;
                    break; // stop at first successful decoder
                }
            }
            catch (_) {
                /* ignore and try next */
            }
        }
        if (parsed) {
            const argsPretty = parsed.args
                .map((arg, i) => {
                const key = parsed?.fragment.inputs[i].name;
                return `${key ? key + ": " : ""}${arg}`;
            })
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
//# sourceMappingURL=txlogging.js.map