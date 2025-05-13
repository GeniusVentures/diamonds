import { CallbackArgs } from "../types";
export declare class CallbackManager {
    private callbacksPath;
    private static instances;
    private callbacks;
    private constructor();
    static getInstance(diamondName: string, deploymentsPath: string): CallbackManager;
    private loadCallbacks;
    executeCallback(facetName: string, callbacks: string[], args: CallbackArgs): Promise<void>;
}
//# sourceMappingURL=CallbackManager.d.ts.map