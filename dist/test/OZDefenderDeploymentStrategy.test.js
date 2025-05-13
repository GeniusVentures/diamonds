"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const defenderStore_1 = require("../src/utils/defenderStore");
const defenderClients_1 = require("../src/utils/defenderClients");
const OZDefenderDeploymentStrategy_1 = require("../src/strategies/OZDefenderDeploymentStrategy");
describe('OZDefenderDeploymentStrategy::checkAndUpdateDeployStep', () => {
    let strategy;
    let store;
    let diamond;
    const stepName = 'deploy-testfacet';
    const mockDeploymentId = 'deployment-123';
    const diamondName = 'TestDiamond';
    beforeEach(() => {
        strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy('key', 'secret', 'relayer', true, 'safe', 'Safe');
        diamond = {
            diamondName,
            getDiamondConfig: () => ({
                networkName: 'goerli',
                chainId: 5
            }),
        };
        store = new defenderStore_1.DefenderDeploymentStore(diamondName, 'TestDiamond-goerli-5', '__test__/fixtures');
        store.saveStep({
            stepName,
            proposalId: mockDeploymentId,
            status: 'pending',
            timestamp: Date.now()
        });
    });
    afterEach(() => {
        sinon_1.default.restore();
    });
    it('should mark step as executed if deployment status is completed', async () => {
        sinon_1.default.stub(defenderClients_1.deployClient, 'getDeployedContract').resolves({
            deploymentId: mockDeploymentId,
            status: 'completed',
        });
        await strategy['checkAndUpdateDeployStep'](stepName, diamond);
        const updated = store.getStep(stepName);
        (0, chai_1.expect)(updated === null || updated === void 0 ? void 0 : updated.status).to.equal('executed');
    });
    it('should mark step as failed if deployment status is failed', async () => {
        sinon_1.default.stub(defenderClients_1.deployClient, 'getDeployedContract').resolves({
            deploymentId: mockDeploymentId,
            status: 'failed',
        });
        try {
            await strategy['checkAndUpdateDeployStep'](stepName, diamond);
        }
        catch (err) {
            const updated = store.getStep(stepName);
            (0, chai_1.expect)(updated === null || updated === void 0 ? void 0 : updated.status).to.equal('failed');
        }
    });
    it('should keep status pending if deployment is still in progress', async () => {
        sinon_1.default.stub(defenderClients_1.deployClient, 'getDeployedContract').resolves({
            deploymentId: mockDeploymentId,
            status: 'pending',
        });
        await strategy['checkAndUpdateDeployStep'](stepName, diamond);
        const updated = store.getStep(stepName);
        (0, chai_1.expect)(updated === null || updated === void 0 ? void 0 : updated.status).to.equal('pending');
    });
});
//# sourceMappingURL=OZDefenderDeploymentStrategy.test.js.map