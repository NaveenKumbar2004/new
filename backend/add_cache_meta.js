const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Lenovo\\OneDrive\\Desktop\\coding\\java\\new';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const metaTags = `    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`;

for (let file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Check if it already has it
    if (!content.includes('Cache-Control')) {
        content = content.replace(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' + metaTags
        );
        fs.writeFileSync(p, content);
    }
}

console.log("Cache-busting tags added to all HTML files.");
