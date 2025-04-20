"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTx = void 0;
// ──────────────────────────────────────────────────────────────────────────────
//  txLogging.ts
//  Extra helpers for inspecting diamond‑cut transactions
// ──────────────────────────────────────────────────────────────────────────────
const chalk_1 = __importDefault(require("chalk"));
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
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
    var _a, _b, _c;
    // normalise incoming interfaces => ethers.Interface
    const decoders = interfaces.map((i) => i instanceof ethers_1.utils.Interface ? i : new ethers_1.utils.Interface(i));
    const receipt = await tx.wait();
    /* --------------------------- basic tx statistics -------------------------- */
    console.log(chalk_1.default.green(`\n⛓️  Transaction Details${description ? ` – ${description}` : ""}`));
    console.table({
        Hash: tx.hash,
        Status: receipt.status === 1 ? "Success" : "Failed",
        Block: receipt.blockNumber,
        From: receipt.from,
        To: receipt.to,
        "Tx Index": receipt.transactionIndex,
        "Gas Used": receipt.gasUsed.toString(),
        "Cumulative Gas": receipt.cumulativeGasUsed.toString(),
        "Gas Price": (_b = (_a = receipt.effectiveGasPrice) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "N/A",
        "Block Hash": receipt.blockHash,
        "Confirmations": receipt.confirmations,
        "Timestamp": receipt.blockNumber
            ? new Date((await tx.wait().then(() => hardhat_1.ethers.provider.getBlock(receipt.blockNumber))).timestamp * 1000).toLocaleString()
            : "N/A",
        "Created Contract": (_c = receipt.contractAddress) !== null && _c !== void 0 ? _c : "N/A",
        "Created By": receipt.from,
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
                parsed = iface.parseLog(log);
                break; // stop at first successful decoder
            }
            catch (_) {
                /* ignore and try next */
            }
        }
        if (parsed) {
            const argsPretty = parsed === null || parsed === void 0 ? void 0 : parsed.args.map((arg, i) => {
                const key = parsed === null || parsed === void 0 ? void 0 : parsed.eventFragment.inputs[i].name;
                return `${key}: ${arg}`;
            });
            console.log(chalk_1.default.yellowBright(`  Event[${idx}]`) + chalk_1.default.bold(` ${parsed.name}`) + `  →  ${argsPretty.join(", ")}`);
        }
        else {
            console.log(chalk_1.default.dim(`  Event[${idx}]`) + ` – unable to decode (topic0 = ${log.topics[0]})`);
        }
    });
    console.log("\n");
    return receipt;
}
exports.logTx = logTx;
//# sourceMappingURL=txlogging.js.map