import { CallbackArgs } from "../types";
export declare class FacetCallbackManager {
    private facetCallbacksPath;
    private static instances;
    private callbacks;
    private constructor();
    static getInstance(diamondName: string, facetCallbacksPath: string): FacetCallbackManager;
    private loadCallbacks;
    executeCallback(facetName: string, callbackName: string, args: CallbackArgs): Promise<void>;
}
//# sourceMappingURL=FacetCallbackManager.d.ts.map