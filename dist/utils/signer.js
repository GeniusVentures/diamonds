"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOwnerForTest = exports.setEtherBalance = exports.impersonateSigner = void 0;
const hardhat_1 = __importStar(require("hardhat"));
const common_1 = require("./common");
/**
 * Impersonates a signer account. This is primarily used in Hardhat's testing environment
 * to simulate actions from accounts that are not part of the default test accounts.
 *
 * @param signerAddress - The address of the account to impersonate.
 * @returns The impersonated signer object.
 */
async function impersonateSigner(signerAddress) {
    await hardhat_1.default.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [signerAddress], // Address of the account to impersonate
    });
    return await hardhat_1.ethers.getSigner(signerAddress); // Returns the impersonated signer
}
exports.impersonateSigner = impersonateSigner;
/**
 * Sets the Ether balance for a specified address in the Hardhat testing environment.
 * This is useful for ensuring test accounts have sufficient funds for transactions.
 *
 * @param address - The address to set the Ether balance for.
 * @param amount - The desired balance as a `BigNumber`.
 */
async function setEtherBalance(address, amount) {
    await hardhat_1.default.network.provider.send('hardhat_setBalance', [
        address,
        amount.toHexString().replace('0x0', '0x'), // Amount to set, formatted as a hex string
    ]);
}
exports.setEtherBalance = setEtherBalance;
/**
 * Updates the owner of the contract at the specified root address for testing purposes.
 * This involves transferring ownership from the current owner to the default signer in the Hardhat environment.
 *
 * @param rootAddress - The address of the root contract (e.g., GeniusOwnershipFacet).
 * @returns The address of the old owner.
 */
const updateOwnerForTest = async (rootAddress) => {
    // Retrieve the current signer in the Hardhat environment
    const curOwner = (await hardhat_1.ethers.getSigners())[0];
    // Get a reference to the GeniusOwnershipFacet contract at the specified root address
    const ownership = await hardhat_1.ethers.getContractAt('GeniusOwnershipFacet', rootAddress);
    // Retrieve the current owner of the contract
    const oldOwnerAddress = await ownership.owner();
    // Impersonate the old owner
    const oldOwner = await impersonateSigner(oldOwnerAddress);
    // If the old owner is not the current signer, transfer ownership to the current signer
    if (oldOwnerAddress !== curOwner.address) {
        debuglog(`Transferring ownership from ${oldOwnerAddress}`);
        // Ensure the old owner has enough Ether to perform the ownership transfer
        await setEtherBalance(oldOwnerAddress, (0, common_1.toWei)(10));
        // Execute the ownership transfer from the old owner to the current signer
        await ownership.connect(oldOwner).transferOwnership(curOwner.address);
    }
    // Return the address of the old owner
    return oldOwnerAddress;
};
exports.updateOwnerForTest = updateOwnerForTest;
//# sourceMappingURL=signer.js.map