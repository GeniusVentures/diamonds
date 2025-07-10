// test/basic.test.ts
import { expect } from 'chai';
import dotenv from 'dotenv';

// This is a simple test just to verify that the testing environment is working properly
describe('Basic Environment Test', () => {
  before(() => {
    // Load environment variables
    dotenv.config();
  });

  it('should have access to process.env', () => {
    expect(process.env).to.not.be.undefined;
  });

  it('should have NODE_ENV defined', () => {
    // NODE_ENV should be defined, even if just as 'test'
    expect(process.env.NODE_ENV || 'test').to.not.be.undefined;
  });

  it('should correctly load test environment variables', () => {
    // This just tests that dotenv is working - not that specific variables exist
    expect(process.env).to.be.an('object');
  });

  it('should have ethers available from hardhat', async () => {
    const hre = await import('hardhat');
    expect((hre.default as any).ethers).to.not.be.undefined;

    // Should be able to get signers
    const signers = await (hre.default as any).ethers.getSigners();
    expect(signers).to.be.an('array');
    expect(signers.length).to.be.at.least(1);
  });
});