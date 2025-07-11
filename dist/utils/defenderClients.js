"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployClient = exports.adminClient = void 0;
// src/utils/defenderClients.ts
const defender_sdk_1 = require("@openzeppelin/defender-sdk");
const defender_sdk_deploy_client_1 = require("@openzeppelin/defender-sdk-deploy-client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const { DEFENDER_API_KEY, DEFENDER_API_SECRET } = process.env;
if (!DEFENDER_API_KEY || !DEFENDER_API_SECRET) {
    console.warn("Warning: Missing Defender credentials in environment. Some functionality will be limited.");
}
exports.adminClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new defender_sdk_1.Defender({
    apiKey: DEFENDER_API_KEY,
    apiSecret: DEFENDER_API_SECRET,
}) : null;
exports.deployClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new defender_sdk_deploy_client_1.DeployClient({
    apiKey: DEFENDER_API_KEY,
    apiSecret: DEFENDER_API_SECRET,
}) : null;
//# sourceMappingURL=defenderClients.js.map