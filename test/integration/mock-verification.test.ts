import { expect } from 'chai';
import sinon from 'sinon';

describe('Mock Verification Test', function () {
  this.timeout(5000);

  it('should verify sinon stubs work', function () {
    const mockFunction = sinon.stub();
    mockFunction.returns('test-result');

    const result = mockFunction();
    expect(result).to.equal('test-result');
    expect(mockFunction.callCount).to.equal(1);
  });

  it('should verify async stubs work', async function () {
    const mockAsyncFunction = sinon.stub();
    mockAsyncFunction.resolves({ status: 'success' });

    const result = await mockAsyncFunction();
    expect(result.status).to.equal('success');
  });
});
