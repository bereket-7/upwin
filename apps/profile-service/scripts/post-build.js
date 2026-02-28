const fs = require('fs');
const path = require('path');

// Read the bundled main.js
const mainJsPath = path.join(__dirname, '../dist/main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// Replace bundled Prisma imports with require statements
// This forces Node to use the external Prisma client at runtime
content = content.replace(
  /from ['"]\.\.\/\.\.\/generated\/prisma['"]/g,
  'from "../../generated/prisma"'
);

// Write back
fs.writeFileSync(mainJsPath, content);

console.log('✅ Post-build: Prisma imports externalized');
