import { join } from "path";

// This function dynamically imports the Diamond contract type from the generated TypeChain typings. It isn't used by the class so it is probably a helper..
export async function getDiamondContractInterface(diamondName: string,
    typechainDir: string = "typechain-types"
  ): Promise<any> {
      // // Get the typechain configuration (default to "typechain-types" if not defined)
      // const typechainConfig = hre.config.typechain;
      // // Resolve the outDir relative to the project's root path
      // const outDir = typechainConfig?.outDir ?? "typechain-types";
      // const baseDir = resolve(hre.config.paths.root, outDir);
      
      const baseDir = typechainDir;
      // Construct the absolute path to the Diamond type.
      // The exact location depends on your TypeChain configuration and naming.
      // Here, we assume the file is named 'ProxyDiamond.ts' under the typechain-types directory:
      const diamondPath = join(baseDir, diamondName);
  
      // Dynamically import the ProxyDiamond types.
      // The module should export the contract type (e.g. as ProxyDiamond).
      const diamondModule = await import(diamondPath);
      
      return typeof diamondModule === "object" ? diamondModule[diamondName] : diamondModule;
      // return diamondModule.Diamond;
    }