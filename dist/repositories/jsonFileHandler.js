"use strict";
/**
 * CRUD and validation helpers for JSON files
 *
 * These should all be synchronous and handle issues like empty files or non-existent files
 * gracefully in a way that allows for control by the caller, e.g. gives the caller the
 * ability to create an empty file on failure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDeployConfig = exports.deleteFacet = exports.updateFacetConfig = exports.saveDeployConfig = exports.readDeployConfig = exports.loadFacetsConfig = exports.validateDeployFile = exports.deleteDeployInfo = exports.updateDeployInfo = exports.writeDeployInfo = exports.createNewDeployFile = exports.defaultDeployment = exports.readDeployFile = exports.readDeployFilePathDiamondNetwork = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const DeploymentSchema_1 = require("../schemas/DeploymentSchema");
function readDeployFilePathDiamondNetwork(networkName, diamondName, deploymentId, deploymentsPath, createNew = false) {
    const filePath = (0, path_1.join)(deploymentsPath, diamondName, `${deploymentId}.json`);
    return readDeployFile(filePath, createNew);
}
exports.readDeployFilePathDiamondNetwork = readDeployFilePathDiamondNetwork;
/**
 * Reads and validates a JSON file as DeployedDiamondData
 * @param path - The path to the deployment file.
 * @param createIfMissing - If true, creates a new deployment file with default values if
 * the file does not exist. Otherwise this will throw an error if the file does not exist.
 * @returns The parsed and validated deployment object.
 */
function readDeployFile(path, createNew = true) {
    let raw;
    if (!(0, fs_extra_1.pathExistsSync)(path) && createNew) {
        createNewDeployFile(path);
        raw = (0, fs_extra_1.readJsonSync)(path);
        const parsed = DeploymentSchema_1.DeployedDiamondDataSchema.safeParse(raw);
        if (!parsed.success) {
            throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
        }
        return parsed.data;
    }
    // This is a mock deployment object with empty values
    return defaultDeployment();
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
 * Default deployment object with empty values
 * This is used to create a new deployment file if it does not exist or for a mock deployment.
 * @type {DeployedDiamondData}
 */
function defaultDeployment() {
    return {
        DiamondAddress: "",
        DeployerAddress: "",
        FacetDeployedInfo: {},
        ExternalLibraries: {},
        protocolVersion: 0, // Default protocol version
    };
}
exports.defaultDeployment = defaultDeployment;
/**
 * Creates a new deployment file with default empty values
 * @param path - The path to the deployment file.
 */
function createNewDeployFile(path) {
    // Validate the default deployment object before writing
    const validated = DeploymentSchema_1.DeployedDiamondDataSchema.parse(defaultDeployment);
    (0, fs_extra_1.writeJsonSync)(path, validated, { spaces: 2 });
}
exports.createNewDeployFile = createNewDeployFile;
/**
 * Writes JSON to file
 */
function writeDeployInfo(path, data) {
    const validated = DeploymentSchema_1.DeployedDiamondDataSchema.parse(data);
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
        DeploymentSchema_1.DeployedDiamondDataSchema.parse(raw);
        return true;
    }
    catch (_a) {
        return false;
    }
}
exports.validateDeployFile = validateDeployFile;
function loadFacetsConfig(deploymentsPath, diamondName) {
    const file = (0, path_1.join)(deploymentsPath, diamondName, `${diamondName}.config.json`);
    const valid = (0, exports.validateDeployConfig)(file);
    const facets = (0, exports.readDeployConfig)(file);
    return facets;
}
exports.loadFacetsConfig = loadFacetsConfig;
/**
 * Loads and validates the facets file.
 * @param filePath - The path to the facets file.
 * @returns The parsed and validated facets object.
 */
const readDeployConfig = (filePath) => {
    try {
        const fullPath = resolvePath(filePath);
        // Read the JSON file
        const raw = (0, fs_extra_1.readJsonSync)(fullPath);
        // Validate and parse the JSON data
        return DeploymentSchema_1.DeployConfigSchema.parse(raw);
    }
    catch (e) {
        console.error('Failed to load facets:', e);
        throw e;
    }
};
exports.readDeployConfig = readDeployConfig;
/**
 * Saves the Diamond Config object to a file.
 * @param filePath - The path to the facets file.
 * @param data - The facets object to save.
 */
const saveDeployConfig = (filePath, data) => {
    const fullPath = resolvePath(filePath);
    (0, fs_extra_1.ensureFileSync)(fullPath);
    (0, fs_extra_1.writeJsonSync)(fullPath, data, { spaces: 2 });
};
exports.saveDeployConfig = saveDeployConfig;
/**
 * Updates a specific facet in the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to update.
 * @param update - The partial update to apply to the facet.
 * @returns The updated facets object.
 */
const updateFacetConfig = (filePath, facetKey, update) => {
    const deployConfig = (0, exports.readDeployConfig)(filePath);
    deployConfig.facets[facetKey] = {
        ...(deployConfig.facets[facetKey] || {}),
        ...update,
    };
    (0, exports.saveDeployConfig)(filePath, deployConfig);
    return deployConfig;
};
exports.updateFacetConfig = updateFacetConfig;
/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
const deleteFacet = (filePath, facetKey) => {
    const deployConfig = (0, exports.readDeployConfig)(filePath);
    delete deployConfig.facets[facetKey];
    (0, exports.saveDeployConfig)(filePath, deployConfig);
    return deployConfig;
};
exports.deleteFacet = deleteFacet;
/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
const validateDeployConfig = (filePath) => {
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
        DeploymentSchema_1.DeployConfigSchema.parse(raw);
        // If all checks pass, return true
        return true;
    }
    catch (e) {
        console.error('Validation failed:', e);
        return false;
    }
};
exports.validateDeployConfig = validateDeployConfig;
//# sourceMappingURL=jsonFileHandler.js.map