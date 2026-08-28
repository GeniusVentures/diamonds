// src/utils/defenderClients.ts
import { Defender } from '@openzeppelin/defender-sdk';
import { DeployClient } from '@openzeppelin/defender-sdk-deploy-client';
import { existsSync } from 'fs';

// Load environment variables from .env file, if present.
// process.loadEnvFile throws ENOENT when the file is missing (CI runners,
// fresh clones) — the credential check below already handles absence.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

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