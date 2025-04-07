import { BaseContract, BigNumber, Contract, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';
import { debug } from 'debug';
import * as chai from 'chai';

import chaiAsPromised from 'chai-as-promised';
import { Fragment } from '@ethersproject/abi';
import { CreateProposalRequest } from "@openzeppelin/defender-admin-client";


declare global {
  export var debuglog: debug.Debugger;
}

global.debuglog = debug('UnitTest:log');
global.debuglog.color = '158';

export const debuglog = global.debuglog;

export const toBN = BigNumber.from;
export const GNUS_TOKEN_ID = toBN(0);
export const XMPL_TOKEN_ID = toBN(1234567890);

export function toWei(value: number | string): BigNumber {
  return ethers.utils.parseEther(value.toString());
}

export function getSighash(funcSig: string): string {
  return ethers.utils.Interface.getSighash(Fragment.fromString(funcSig));
}

export interface IDefenderViaInfo {
  via: CreateProposalRequest['via'],
  viaType: CreateProposalRequest['viaType'];
}