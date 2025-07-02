"use strict";
exports.__esModule = true;
exports.FileDeploymentRepository = void 0;
var jsonFileHandler_1 = require("./jsonFileHandler");
var path_1 = require("path");
var chalk_1 = require("chalk");
var FileDeploymentRepository = /** @class */ (function () {
    function FileDeploymentRepository(config) {
        var _a;
        this.deploymentDataPath = config.deploymentsPath || 'diamonds';
        this.writeDeployedDiamondData = (_a = config.writeDeployedDiamondData) !== null && _a !== void 0 ? _a : true;
        this.deploymentId = "".concat(config.diamondName.toLowerCase(), "-").concat(config.networkName.toLowerCase(), "-").concat(config.chainId.toString());
        if (config.deployedDiamondDataFilePath) {
            this.deployedDiamondDataFilePath = config.deployedDiamondDataFilePath;
        }
        else {
            this.deployedDiamondDataFilePath = (0, path_1.join)(this.deploymentDataPath, config.diamondName, "deployments/".concat(this.deploymentId, ".json"));
        }
        if (config.configFilePath) {
            this.configFilePath = config.configFilePath;
        }
        else {
            this.configFilePath = (0, path_1.join)(this.deploymentDataPath, config.diamondName, "".concat(config.diamondName.toLowerCase(), ".config.json"));
        }
    }
    FileDeploymentRepository.prototype.setWriteDeployedDiamondData = function (write) {
        this.writeDeployedDiamondData = write;
    };
    FileDeploymentRepository.prototype.getWriteDeployedDiamondData = function () {
        return this.writeDeployedDiamondData;
    };
    FileDeploymentRepository.prototype.loadDeployedDiamondData = function () {
        return (0, jsonFileHandler_1.readDeployFile)(this.deployedDiamondDataFilePath, this.writeDeployedDiamondData);
    };
    FileDeploymentRepository.prototype.saveDeployedDiamondData = function (info) {
        if (this.writeDeployedDiamondData) {
            (0, jsonFileHandler_1.writeDeployInfo)(this.deployedDiamondDataFilePath, info);
        }
        else {
            console.log(chalk_1["default"].cyanBright("Skipping write of diamond deployment data. Set writeDeployedDiamondData to true to enable."));
        }
    };
    FileDeploymentRepository.prototype.loadDeployConfig = function () {
        return (0, jsonFileHandler_1.readDeployConfig)(this.configFilePath);
    };
    FileDeploymentRepository.prototype.getDeploymentId = function () {
        return this.deploymentId;
    };
    return FileDeploymentRepository;
}());
exports.FileDeploymentRepository = FileDeploymentRepository;
