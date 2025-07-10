import hre from 'hardhat';
import { debug } from 'debug';
import { TransactionReceipt, Interface, Fragment, ContractInterface, ContractTransaction } from "ethers";
import { CreateProposalRequest } from "@openzeppelin/defender-sdk-proposal-client";
import chalk from 'chalk';
import { Artifact } from "hardhat/types";
import { DeployedDiamondData } from "../schemas";

declare global {
  export var debuglog: debug.Debugger;
}

global.debuglog = debug('UnitTest:log');
global.debuglog.color = '158';

export const debuglog = global.debuglog;

export const toBN = (value: string | number | bigint) => BigInt(value);
export const GNUS_TOKEN_ID = toBN(0);
export const XMPL_TOKEN_ID = toBN(1234567890);

export function toWei(value: number | string): bigint {
  return (hre as any).ethers.parseEther(value.toString());
}

export function getSighash(funcSig: string): string {
  return new Interface([`function ${funcSig}`]).getFunction(funcSig.split('(')[0])?.selector || '';
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

  for (const facetName of Object.keys(deployedInfo.DeployedFacets || {})) {
    try {
      const artifact: Artifact = hre.artifacts.readArtifactSync(facetName);
      interfaces.push(new Interface(artifact.abi));
    } catch (err) {
      console.warn(`⚠️ Could not load artifact for facet ${facetName}:`, (err as Error).message);
    }
  }

  return interfaces;
}
