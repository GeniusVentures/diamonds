import { ethers } from 'hardhat';
import { Fragment } from '@ethersproject/abi';

export function getSighash(funcSig: string): string {
    return ethers.utils.Interface.getSighash(Fragment.fromString(funcSig));
  }