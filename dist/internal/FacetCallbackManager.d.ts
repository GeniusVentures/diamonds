import { CallbackArgs } from "../types";
export declare class FacetCallbackManager {
    private callbacksPath;
    private static instances;
    private callbacks;
    private constructor();
    static getInstance(diamondName: string, deploymentsPath: string): FacetCallbackManager;
    private loadCallbacks;
    executeCallback(facetName: string, callbacks: string[], args: CallbackArgs): Promise<void>;
}
//# sourceMappingURL=FacetCallbackManager.d.ts.map