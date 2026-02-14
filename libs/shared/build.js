const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile TypeScript to JavaScript
console.log('Building @org/shared...');
execSync('npx tsc --project tsconfig.lib.json --declaration --emitDeclarationOnly false --outDir dist', {
  cwd: __dirname,
  stdio: 'inherit'
});

// Create package.json for the dist
const pkg = {
  name: '@org/shared',
  version: '1.0.0',
  main: 'index.js',
  types: 'index.d.ts'
};

fs.writeFileSync(
  path.join(__dirname, 'dist', 'package.json'),
  JSON.stringify(pkg, null, 2)
);

console.log('✅ @org/shared built successfully');
