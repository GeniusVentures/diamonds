"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDeploymentRepository = void 0;
const jsonFileHandler_1 = require("./jsonFileHandler");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
class FileDeploymentRepository {
    deploymentDataPath;
    deployedDiamondDataFilePath;
    configFilePath;
    writeDeployedDiamondData;
    deploymentId;
    constructor(config) {
        this.deploymentDataPath = config.deploymentsPath || 'diamonds';
        this.writeDeployedDiamondData = config.writeDeployedDiamondData ?? true;
        this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
        if (config.deployedDiamondDataFilePath) {
            this.deployedDiamondDataFilePath = config.deployedDiamondDataFilePath;
        }
        else {
            this.deployedDiamondDataFilePath = (0, path_1.join)(this.deploymentDataPath, config.diamondName, `deployments/${this.deploymentId}.json`);
        }
        if (config.configFilePath) {
            this.configFilePath = config.configFilePath;
        }
        else {
            this.configFilePath = (0, path_1.join)(this.deploymentDataPath, config.diamondName, `${config.diamondName.toLowerCase()}.config.json`);
        }
    }
    setWriteDeployedDiamondData(write) {
        this.writeDeployedDiamondData = write;
    }
    getWriteDeployedDiamondData() {
        return this.writeDeployedDiamondData;
    }
    loadDeployedDiamondData() {
        return (0, jsonFileHandler_1.readDeployFile)(this.deployedDiamondDataFilePath, this.writeDeployedDiamondData);
    }
    saveDeployedDiamondData(info) {
        if (this.writeDeployedDiamondData) {
            (0, jsonFileHandler_1.writeDeployInfo)(this.deployedDiamondDataFilePath, info);
        }
        else {
            console.log(chalk_1.default.cyanBright("Skipping write of diamond deployment data. Set writeDeployedDiamondData to true to enable."));
        }
    }
    loadDeployConfig() {
        return (0, jsonFileHandler_1.readDeployConfig)(this.configFilePath);
    }
    getDeploymentId() {
        return this.deploymentId;
    }
}
exports.FileDeploymentRepository = FileDeploymentRepository;
//# sourceMappingURL=FileDeploymentRepository.js.map