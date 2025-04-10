import { BigNumber } from 'ethers';
/**
 * Impersonates a signer account. This is primarily used in Hardhat's testing environment
 * to simulate actions from accounts that are not part of the default test accounts.
 *
 * @param signerAddress - The address of the account to impersonate.
 * @returns The impersonated signer object.
 */
export declare function impersonateSigner(signerAddress: string): Promise<any>;
/**
 * Sets the Ether balance for a specified address in the Hardhat testing environment.
 * This is useful for ensuring test accounts have sufficient funds for transactions.
 *
 * @param address - The address to set the Ether balance for.
 * @param amount - The desired balance as a `BigNumber`.
 */
export declare function setEtherBalance(address: string, amount: BigNumber): Promise<void>;
/**
 * Updates the owner of the contract at the specified root address for testing purposes.
 * This involves transferring ownership from the current owner to the default signer in the Hardhat environment.
 *
 * @param rootAddress - The address of the root contract (e.g., GeniusOwnershipFacet).
 * @returns The address of the old owner.
 */
export declare const updateOwnerForTest: (rootAddress: string) => Promise<any>;
//# sourceMappingURL=signer.d.ts.map