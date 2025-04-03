"use strict";
/**
 * CRUD and validation helpers for JSON files
 *
 * These should all be synchronous and handle issues like empty files or non-existent files
 * gracefully in a way that allows for control by the caller, e.g. gives the caller the
 * ability to create an empty file on failure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFacetsConfig = exports.deleteFacet = exports.updateFacetConfig = exports.saveFacetsConfig = exports.readFacetsConfig = exports.loadFacetsConfig = exports.validateDeployFile = exports.deleteDeployInfo = exports.updateDeployInfo = exports.writeDeployInfo = exports.createNewDeployFile = exports.readDeployFile = exports.readDeployFilePathDiamondNetwork = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const DeploymentSchema_1 = require("../schemas/DeploymentSchema");
function readDeployFilePathDiamondNetwork(networkName, diamondName, deploymentsPath, createNew = false) {
    const filePath = (0, path_1.join)(deploymentsPath, diamondName, `${networkName}.json`);
    return readDeployFile(filePath, createNew);
}
exports.readDeployFilePathDiamondNetwork = readDeployFilePathDiamondNetwork;
/**
 * Reads and validates a JSON file as INetworkDeployInfo
 * @param path - The path to the deployment file.
 * @param createIfMissing - If true, creates a new deployment file with default values if
 * the file does not exist. Otherwise this will throw an error if the file does not exist.
 * @returns The parsed and validated deployment object.
 */
function readDeployFile(path, createNew = false) {
    // The caller should have already checked for the file's existence,
    if (!(0, fs_extra_1.pathExistsSync)(path) && !createNew) {
        throw new Error(`Deployment file not found: ${path}`);
    }
    else if (!(0, fs_extra_1.pathExistsSync)(path) && createNew) {
        createNewDeployFile(path);
    }
    // TODO this may be redundant given the failure of the safeParse below into a type.
    // if (!validateDeploymentFileOnly(path)) {
    //   throw new Error(`Invalid deployment file: ${path}`);
    // }
    const raw = (0, fs_extra_1.readJsonSync)(path);
    const parsed = DeploymentSchema_1.NetworkDeployInfoSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
    }
    return parsed.data;
}
exports.readDeployFile = readDeployFile;
/**
 * Resolves the absolute path of a file relative to the project root.
 * @param relativePath - The relative path to resolve.
 * @returns The absolute path.
 */
const resolvePath = (relativePath) => {
    return (0, path_1.resolve)(process.cwd(), relativePath);
};
/**
 * Creates a new deployment file with default empty values
 * @param path - The path to the deployment file.
 */
function createNewDeployFile(path) {
    const defaultDeployment = {
        DiamondAddress: "",
        DeployerAddress: "",
        FacetDeployedInfo: {},
        ExternalLibraries: {},
        protocolVersion: 0, // Default protocol version
    };
    // Validate the default deployment object before writing
    const validated = DeploymentSchema_1.NetworkDeployInfoSchema.parse(defaultDeployment);
    (0, fs_extra_1.writeJsonSync)(path, validated, { spaces: 2 });
}
exports.createNewDeployFile = createNewDeployFile;
/**
 * Writes JSON to file
 */
function writeDeployInfo(path, data) {
    const validated = DeploymentSchema_1.NetworkDeployInfoSchema.parse(data);
    (0, fs_extra_1.writeJsonSync)(path, validated, { spaces: 2 });
}
exports.writeDeployInfo = writeDeployInfo;
/**
 * Update deployment JSON file
 */
function updateDeployInfo(path, updater) {
    const data = readDeployFile(path);
    updater(data);
    writeDeployInfo(path, data);
}
exports.updateDeployInfo = updateDeployInfo;
/**
 * Deletes the deployment file
 */
function deleteDeployInfo(path) {
    if ((0, fs_extra_1.pathExistsSync)(path)) {
        (0, fs_extra_1.removeSync)(path);
    }
}
exports.deleteDeployInfo = deleteDeployInfo;
/**
 * Validates the Deployment File without loading it.
 * @param path
 * @returns
 */
function validateDeployFile(path) {
    try {
        if (!(0, fs_extra_1.pathExistsSync)(path)) {
            console.log(`Deployment file not found: ${path}`);
            return false;
        }
        const raw = (0, fs_extra_1.readJsonSync)(path);
        DeploymentSchema_1.NetworkDeployInfoSchema.parse(raw);
        return true;
    }
    catch (_a) {
        return false;
    }
}
exports.validateDeployFile = validateDeployFile;
function loadFacetsConfig(deploymentsPath, diamondName, facetsDeploymentPath) {
    const file = (0, path_1.join)(deploymentsPath, diamondName, 'facets.json');
    const valid = (0, exports.validateFacetsConfig)(file);
    // TODO: This is defaulting empty.  This should be a separate function to createNew().
    if (!valid) {
        return {
            DiamondCutFacet: {
                priority: 10,
                versions: {
                    0.0: {},
                },
            },
            DiamondLoupeFacet: {
                priority: 20,
                versions: {
                    0.0: {},
                },
            },
        };
    }
    // TODO This does not load the callbacks.  This needs to be done separately.
    const facets = (0, exports.readFacetsConfig)(file);
    return facets;
}
exports.loadFacetsConfig = loadFacetsConfig;
// TODO We choose not to make this  for now, however this could all be loaded earlier as 
// part of a configuration. This would need to happen before trying to get the first
// instance of the deployer (at start?), when we are not locking the deployment objects 
// during deployment to prevent duplication of the singleton before it is ready to return.
// This is would be a good use of hardhat-diamonds.
/**
 * Loads and validates the facets file.
 * @param filePath - The path to the facets file.
 * @returns The parsed and validated facets object.
 */
const readFacetsConfig = (filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        // Read the JSON file
        const raw = (0, fs_extra_1.readJsonSync)(fullPath);
        // Validate and parse the JSON data
        return DeploymentSchema_1.FacetsConfigSchema.parse(raw);
    }
    catch (e) {
        console.error('Failed to load facets:', e);
        throw e;
    }
};
exports.readFacetsConfig = readFacetsConfig;
/**
 * Saves the facets object to a file.
 * @param filePath - The path to the facets file.
 * @param data - The facets object to save.
 */
const saveFacetsConfig = (filePath, data) => {
    const fullPath = resolvePath(filePath);
    (0, fs_extra_1.ensureFileSync)(fullPath);
    (0, fs_extra_1.writeJsonSync)(fullPath, data, { spaces: 2 });
};
exports.saveFacetsConfig = saveFacetsConfig;
/**
 * Updates a specific facet in the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to update.
 * @param update - The partial update to apply to the facet.
 * @returns The updated facets object.
 */
const updateFacetConfig = (filePath, facetKey, update) => {
    const facets = (0, exports.readFacetsConfig)(filePath);
    facets[facetKey] = {
        ...(facets[facetKey] || {}),
        ...update,
    };
    (0, exports.saveFacetsConfig)(filePath, facets);
    return facets;
};
exports.updateFacetConfig = updateFacetConfig;
/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
const deleteFacet = (filePath, facetKey) => {
    const facets = (0, exports.readFacetsConfig)(filePath);
    delete facets[facetKey];
    (0, exports.saveFacetsConfig)(filePath, facets);
    return facets;
};
exports.deleteFacet = deleteFacet;
/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
const validateFacetsConfig = (filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        // Check if the file exists
        if (!(0, fs_extra_1.existsSync)(fullPath)) {
            console.error(`Validation failed: File does not exist at path "${filePath}"`);
            return false;
        }
        // Read the file and parse it as JSON
        const raw = (0, fs_extra_1.readJsonSync)(fullPath);
        // Validate the JSON against the schema
        DeploymentSchema_1.FacetsConfigSchema.parse(raw);
        // If all checks pass, return true
        return true;
    }
    catch (e) {
        console.error('Validation failed:', e);
        return false;
    }
};
exports.validateFacetsConfig = validateFacetsConfig;
//# sourceMappingURL=jsonFileHandler.js.map