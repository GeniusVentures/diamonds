/// <reference types="debug" />
import { BigNumber } from 'ethers';
import { CreateProposalRequest } from "@openzeppelin/defender-admin-client";
declare global {
    export var debuglog: debug.Debugger;
}
export declare const debuglog: import("debug").Debugger;
export declare const toBN: typeof BigNumber.from;
export declare const GNUS_TOKEN_ID: BigNumber;
export declare const XMPL_TOKEN_ID: BigNumber;
export declare function toWei(value: number | string): BigNumber;
export declare function getSighash(funcSig: string): string;
export interface IDefenderViaInfo {
    via: CreateProposalRequest['via'];
    viaType: CreateProposalRequest['viaType'];
}
export declare function cutKey(diamondName: string, networkName: string, chainId: string): string;
//# sourceMappingURL=common.d.ts.map