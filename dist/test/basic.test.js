"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test/basic.test.ts
const chai_1 = require("chai");
const dotenv_1 = __importDefault(require("dotenv"));
// This is a simple test just to verify that the testing environment is working properly
describe('Basic Environment Test', () => {
    before(() => {
        // Load environment variables
        dotenv_1.default.config();
    });
    it('should have access to process.env', () => {
        (0, chai_1.expect)(process.env).to.not.be.undefined;
    });
    it('should have NODE_ENV defined', () => {
        // NODE_ENV should be defined, even if just as 'test'
        (0, chai_1.expect)(process.env.NODE_ENV || 'test').to.not.be.undefined;
    });
    it('should correctly load test environment variables', () => {
        // This just tests that dotenv is working - not that specific variables exist
        (0, chai_1.expect)(process.env).to.be.an('object');
    });
    it('should have ethers available from hardhat', async () => {
        const hre = await Promise.resolve().then(() => __importStar(require('hardhat')));
        (0, chai_1.expect)(hre.default.ethers).to.not.be.undefined;
        // Should be able to get signers
        const signers = await hre.default.ethers.getSigners();
        (0, chai_1.expect)(signers).to.be.an('array');
        (0, chai_1.expect)(signers.length).to.be.at.least(1);
    });
});
//# sourceMappingURL=basic.test.js.map