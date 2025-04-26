import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { toWei } from './common';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Signer } from 'ethers';

/**
 * Impersonates a signer account. This is primarily used in Hardhat's testing environment
 * to simulate actions from accounts that are not part of the default test accounts.
 *
 * @param signerAddress - The address of the account to impersonate.
 * @returns The impersonated signer object.
 */
export async function impersonateSigner(signerAddress: string, provider: JsonRpcProvider) {
  ethers.provider = provider; // Set the provider to the one passed in
  // Request Hardhat to impersonate the account at the specified address
  await ethers.provider.send("hardhat_impersonateAccount", signerAddress);
}

/**
 * Sets the Ether balance for a specified address in the Hardhat testing environment.
 * This is useful for ensuring test accounts have sufficient funds for transactions.
 *
 * @param address - The address to set the Ether balance for.
 * @param amount - The desired balance as a `BigNumber`.
 */
export async function setEtherBalance(address: string, amount: BigNumber, provider: JsonRpcProvider) {
  ethers.provider = provider;
  await ethers.provider.send('hardhat_setBalance', [
    address, // Address to modify the balance of
    amount.toHexString().replace('0x0', '0x'), // Amount to set, formatted as a hex string
  ]);
}

/**        
 * Impersonates the deployer account and funds it to a balance that is rounded to the next highest 100 ETH.
 * 
 * @param provider - The ethers provider instance.
 * @param deployerAddress - The address of the deployer account.
 * @param balance - The balance to set for the deployer account (in hex format).
 */
export async function impersonateAndFundSigner(deployerAddress: string, provider: JsonRpcProvider): Promise<Signer> {
  try {
    await provider.send('hardhat_impersonateAccount', [deployerAddress]);
    const signer = provider.getSigner(deployerAddress);

    // Fund the account
    await provider.send('hardhat_setBalance', [deployerAddress, '0x56BC75E2D63100000']);
    return signer;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Impersonation and funding failed for ${deployerAddress}: ${error.message}`);
    } else {
      console.error(`Impersonation and funding failed for ${deployerAddress}: ${String(error)}`);
    }
    throw error;
  }
}


/**
 * Updates the owner of the contract at the specified root address for testing purposes.
 * This involves transferring ownership from the current owner to the default signer in the Hardhat environment.
 *
 * @param rootAddress - The address of the root contract (e.g., GeniusOwnershipFacet).
 * @returns The address of the old owner.
 */
export const updateOwnerForTest = async (rootAddress: string, provider: JsonRpcProvider) => {
  // Retrieve the current signer in the Hardhat environment
  const curOwner = (await ethers.getSigners())[0];

  // Get a reference to the GeniusOwnershipFacet contract at the specified root address
  const ownership = await ethers.getContractAt('GeniusOwnershipFacet', rootAddress);

  // Retrieve the current owner of the contract
  const oldOwnerAddress = await ownership.owner();

  // Impersonate the old owner
  const oldOwner = await impersonateSigner(oldOwnerAddress, provider);

  // If the old owner is not the current signer, transfer ownership to the current signer
  if (oldOwnerAddress !== curOwner.address) {
    debuglog(`Transferring ownership from ${oldOwnerAddress}`);

    // Ensure the old owner has enough Ether to perform the ownership transfer
    await setEtherBalance(oldOwnerAddress, toWei(10), provider);

    // Execute the ownership transfer from the old owner to the current signer
    await ownership.connect(oldOwner).transferOwnership(curOwner.address);
  }

  // Return the address of the old owner
  return oldOwnerAddress;
};
