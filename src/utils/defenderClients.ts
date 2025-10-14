// src/utils/defenderClients.ts
import { Defender } from '@openzeppelin/defender-sdk';
import { DeployClient } from '@openzeppelin/defender-sdk-deploy-client';

// Load environment variables from .env file
process.loadEnvFile('.env');

const { DEFENDER_API_KEY, DEFENDER_API_SECRET } = process.env;

if (!DEFENDER_API_KEY || !DEFENDER_API_SECRET) {
  console.warn("Warning: Missing Defender credentials in environment. Some functionality will be limited.");
}

export const adminClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new Defender({
  apiKey: DEFENDER_API_KEY,
  apiSecret: DEFENDER_API_SECRET,
}) : null;

export const deployClient = DEFENDER_API_KEY && DEFENDER_API_SECRET ? new DeployClient({
  apiKey: DEFENDER_API_KEY,
  apiSecret: DEFENDER_API_SECRET,
}) : null;