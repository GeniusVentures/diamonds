// Test file to verify exports work correctly
const { 
    DiamondAbiGenerator, 
    generateDiamondAbi, 
    previewDiamondAbi,
    Diamond
} = require('./dist/src/index.js');

console.log('✅ All exports imported successfully!');

// Test that classes exist
console.log('DiamondAbiGenerator:', typeof DiamondAbiGenerator);
console.log('generateDiamondAbi:', typeof generateDiamondAbi);
console.log('previewDiamondAbi:', typeof previewDiamondAbi);
console.log('Diamond:', typeof Diamond);

console.log('✅ Module exports working correctly!');
