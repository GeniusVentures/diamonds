import "@nomicfoundation/hardhat-ethers";
import { Interface } from "ethers";
import { CreateProposalRequest } from "@openzeppelin/defender-sdk-proposal-client";
import { DeployedDiamondData } from "../schemas";
declare global {
    export var debuglog: debug.Debugger;
}
export declare const debuglog: import("debug").Debugger;
export declare const toBN: (value: string | number | bigint) => bigint;
export declare const GNUS_TOKEN_ID: bigint;
export declare const XMPL_TOKEN_ID: bigint;
export declare function toWei(value: number | string): bigint;
export declare function getSighash(funcSig: string): string;
export interface IDefenderViaInfo {
    via: CreateProposalRequest['via'];
    viaType: CreateProposalRequest['viaType'];
}
export declare function cutKey(diamondName: string, networkName: string, chainId: string): string;
export declare function getDeployedFacetInterfaces(deployedInfo: DeployedDiamondData): Interface[];
//# sourceMappingURL=common.d.ts.map