import { ethers } from 'hardhat';
import { debug } from 'debug';
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { Interface } from "@ethersproject/abi";
import { Fragment } from '@ethersproject/abi';
import { CreateProposalRequest } from "@openzeppelin/defender-admin-client";
import { providers, utils, ContractInterface, BigNumber, ContractTransaction } from "ethers";
import chalk from 'chalk';
import { Artifact } from "hardhat/types";
import { artifacts } from "hardhat";
import { DeployedDiamondData } from "../schemas";

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

export function cutKey(diamondName: string, networkName: string, chainId: string): string {
  const key = `${diamondName.toLowerCase()}-${networkName}-${chainId}`;
  return key;
}

export function getDeployedFacetInterfaces(deployedInfo: DeployedDiamondData): Interface[] {
  const interfaces: Interface[] = [];

  for (const facetName of Object.keys(deployedInfo.FacetDeployedInfo || {})) {
    try {
      const artifact: Artifact = artifacts.readArtifactSync(facetName);
      interfaces.push(new Interface(artifact.abi));
    } catch (err) {
      console.warn(`⚠️ Could not load artifact for facet ${facetName}:`, (err as Error).message);
    }
  }

  return interfaces;
}
