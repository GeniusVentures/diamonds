"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOwnerForTest = exports.impersonateAndFundSigner = exports.setEtherBalance = exports.impersonateSigner = void 0;
const hardhat_1 = require("hardhat");
const common_1 = require("./common");
/**
 * Impersonates a signer account. This is primarily used in Hardhat's testing environment
 * to simulate actions from accounts that are not part of the default test accounts.
 *
 * @param signerAddress - The address of the account to impersonate.
 * @returns The impersonated signer object.
 */
async function impersonateSigner(signerAddress, provider) {
    hardhat_1.ethers.provider = provider; // Set the provider to the one passed in
    // Request Hardhat to impersonate the account at the specified address
    await hardhat_1.ethers.provider.send("hardhat_impersonateAccount", signerAddress);
}
exports.impersonateSigner = impersonateSigner;
/**
 * Sets the Ether balance for a specified address in the Hardhat testing environment.
 * This is useful for ensuring test accounts have sufficient funds for transactions.
 *
 * @param address - The address to set the Ether balance for.
 * @param amount - The desired balance as a `BigNumber`.
 */
async function setEtherBalance(address, amount, provider) {
    hardhat_1.ethers.provider = provider;
    await hardhat_1.ethers.provider.send('hardhat_setBalance', [
        address,
        amount.toHexString().replace('0x0', '0x'), // Amount to set, formatted as a hex string
    ]);
}
exports.setEtherBalance = setEtherBalance;
/**
 * Impersonates the deployer account and funds it to a balance that is rounded to the next highest 100 ETH.
 *
 * @param provider - The ethers provider instance.
 * @param deployerAddress - The address of the deployer account.
 * @param balance - The balance to set for the deployer account (in hex format).
 */
async function impersonateAndFundSigner(deployerAddress, provider) {
    try {
        await provider.send('hardhat_impersonateAccount', [deployerAddress]);
        const signer = provider.getSigner(deployerAddress);
        // Fund the account
        await provider.send('hardhat_setBalance', [deployerAddress, '0x56BC75E2D63100000']);
        return signer;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Impersonation and funding failed for ${deployerAddress}: ${error.message}`);
        }
        else {
            console.error(`Impersonation and funding failed for ${deployerAddress}: ${String(error)}`);
        }
        throw error;
    }
}
exports.impersonateAndFundSigner = impersonateAndFundSigner;
/**
 * Updates the owner of the contract at the specified root address for testing purposes.
 * This involves transferring ownership from the current owner to the default signer in the Hardhat environment.
 *
 * @param rootAddress - The address of the root contract (e.g., GeniusOwnershipFacet).
 * @returns The address of the old owner.
 */
const updateOwnerForTest = async (rootAddress, provider) => {
    // Retrieve the current signer in the Hardhat environment
    const curOwner = (await hardhat_1.ethers.getSigners())[0];
    // Get a reference to the GeniusOwnershipFacet contract at the specified root address
    const ownership = await hardhat_1.ethers.getContractAt('GeniusOwnershipFacet', rootAddress);
    // Retrieve the current owner of the contract
    const oldOwnerAddress = await ownership.owner();
    // Impersonate the old owner
    const oldOwner = await impersonateSigner(oldOwnerAddress, provider);
    // If the old owner is not the current signer, transfer ownership to the current signer
    if (oldOwnerAddress !== curOwner.address) {
        debuglog(`Transferring ownership from ${oldOwnerAddress}`);
        // Ensure the old owner has enough Ether to perform the ownership transfer
        await setEtherBalance(oldOwnerAddress, (0, common_1.toWei)(10), provider);
        // Execute the ownership transfer from the old owner to the current signer
        await ownership.connect(oldOwner).transferOwnership(curOwner.address);
    }
    // Return the address of the old owner
    return oldOwnerAddress;
};
exports.updateOwnerForTest = updateOwnerForTest;
//# sourceMappingURL=signer.js.map