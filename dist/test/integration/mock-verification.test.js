"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
describe('Mock Verification Test', function () {
    this.timeout(5000);
    it('should verify sinon stubs work', function () {
        const mockFunction = sinon_1.default.stub();
        mockFunction.returns('test-result');
        const result = mockFunction();
        (0, chai_1.expect)(result).to.equal('test-result');
        (0, chai_1.expect)(mockFunction.callCount).to.equal(1);
    });
    it('should verify async stubs work', async function () {
        const mockAsyncFunction = sinon_1.default.stub();
        mockAsyncFunction.resolves({ status: 'success' });
        const result = await mockAsyncFunction();
        (0, chai_1.expect)(result.status).to.equal('success');
    });
});
//# sourceMappingURL=mock-verification.test.js.map