"use strict";
exports.__esModule = true;
exports.deployClient = exports.adminClient = void 0;
// src/utils/defenderClients.ts
var defender_sdk_1 = require("@openzeppelin/defender-sdk");
var defender_sdk_deploy_client_1 = require("@openzeppelin/defender-sdk-deploy-client");
var dotenv_1 = require("dotenv");
// Load environment variables from .env file
dotenv_1["default"].config();
var _a = process.env, DEFENDER_API_KEY = _a.DEFENDER_API_KEY, DEFENDER_API_SECRET = _a.DEFENDER_API_SECRET;
if (!DEFENDER_API_KEY || !DEFENDER_API_SECRET) {
    console.warn("Warning: Missing Defender credentials in environment. Some functionality will be limited.");
}
exports.adminClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new defender_sdk_1.Defender({
    apiKey: DEFENDER_API_KEY,
    apiSecret: DEFENDER_API_SECRET
}) : null;
exports.deployClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new defender_sdk_deploy_client_1.DeployClient({
    apiKey: DEFENDER_API_KEY,
    apiSecret: DEFENDER_API_SECRET
}) : null;
