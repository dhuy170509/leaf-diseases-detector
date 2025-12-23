const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Fix imports: from '../services/name' => from '../services/name.js'
    // Match: from 'path/to/module' or from "path/to/module"
    // Don't match if already has .js
    content = content.replace(/from ['"](\.\.[^'"]*?)(?<!\.js)['"];/g, "from '$1.js';");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Fixed: ${path.relative('.', filePath)}`);
        return true;
    }
    return false;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fixImportsInFile(fullPath);
        }
    }
}

console.log('🔧 Fixing imports in server/src...\n');
processDirectory('./src');
console.log('\n✅ Import fixes complete!');
