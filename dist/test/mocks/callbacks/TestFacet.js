"use strict";
// Mock callback for TestFacet - test/mocks/callbacks/TestFacet.js
module.exports = {
    testCallback: function (diamond, facetName, facetAddress, initCalldata, initAddress, deployedDiamondData) {
        console.log(`TestFacet callback executed for facet ${facetName} at ${facetAddress}`);
        return {
            success: true,
            data: {
                facetName,
                facetAddress,
                callbackType: 'testCallback',
                timestamp: Date.now()
            }
        };
    }
};
//# sourceMappingURL=TestFacet.js.map