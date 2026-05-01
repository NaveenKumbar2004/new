const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Lenovo\\OneDrive\\Desktop\\coding\\java\\new';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));

for (let file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    if (content.includes('user-login.html')) {
        content = content.replace(/user-login\.html/g, 'login-new.html');
        fs.writeFileSync(p, content);
    }
}
console.log('Updated links to login-new.html');
