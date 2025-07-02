"use strict";
exports.__esModule = true;
exports.DefenderDeploymentStore = void 0;
var path_1 = require("path");
var fs = require("fs-extra");
var DefenderDeploymentStore = /** @class */ (function () {
    function DefenderDeploymentStore(diamondName, deploymentId, baseDir) {
        if (baseDir === void 0) { baseDir = 'diamonds'; }
        this.diamondName = diamondName;
        this.deploymentId = deploymentId;
        var registryDir = (0, path_1.join)(baseDir, diamondName, 'deployments', 'defender');
        fs.ensureDirSync(registryDir);
        this.filePath = (0, path_1.join)(registryDir, "".concat(deploymentId, ".json"));
    }
    DefenderDeploymentStore.prototype.loadRegistry = function () {
        if (!fs.existsSync(this.filePath)) {
            return {
                diamondName: this.diamondName,
                deploymentId: this.deploymentId,
                network: '',
                steps: []
            };
        }
        return fs.readJSONSync(this.filePath);
    };
    DefenderDeploymentStore.prototype.saveRegistry = function (registry) {
        fs.writeJSONSync(this.filePath, registry, { spaces: 2 });
    };
    DefenderDeploymentStore.prototype.saveStep = function (step) {
        var registry = this.loadRegistry();
        var existing = registry.steps.find(function (s) { return s.stepName === step.stepName; });
        if (existing) {
            Object.assign(existing, step);
        }
        else {
            registry.steps.push(step);
        }
        this.saveRegistry(registry);
    };
    DefenderDeploymentStore.prototype.getStep = function (stepName) {
        return this.loadRegistry().steps.find(function (s) { return s.stepName === stepName; });
    };
    DefenderDeploymentStore.prototype.updateStatus = function (stepName, status) {
        var registry = this.loadRegistry();
        var step = registry.steps.find(function (s) { return s.stepName === stepName; });
        if (step) {
            step.status = status;
            step.timestamp = Date.now();
            this.saveRegistry(registry);
        }
    };
    DefenderDeploymentStore.prototype.list = function () {
        return this.loadRegistry().steps;
    };
    return DefenderDeploymentStore;
}());
exports.DefenderDeploymentStore = DefenderDeploymentStore;
