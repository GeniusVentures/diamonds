/// <reference types="chai" />
/// <reference types="debug" />
import { BigNumber } from 'ethers';
export declare const assert: Chai.AssertStatic;
export declare const expect: Chai.ExpectStatic;
import { CreateProposalRequest } from "@openzeppelin/defender-admin-client";
declare global {
    export var debuglog: debug.Debugger;
}
export declare const debuglog: import("debug").Debugger;
export declare const toBN: typeof BigNumber.from;
export declare const GNUS_TOKEN_ID: BigNumber;
export declare const XMPL_TOKEN_ID: BigNumber;
export type PreviousVersionRecord = Record<string, number>;
export declare function toWei(value: number | string): BigNumber;
export declare function getSighash(funcSig: string): string;
export interface IDefenderViaInfo {
    via: CreateProposalRequest['via'];
    viaType: CreateProposalRequest['viaType'];
}
//# sourceMappingURL=common.d.ts.map