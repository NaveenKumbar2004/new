const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Lenovo\\OneDrive\\Desktop\\coding\\java\\new';

const renames = {
    'register.html': 'register-new.html',
    'dashboard.html': 'dashboard-new.html',
    'booking.html': 'booking-new.html',
    'my-vehicles.html': 'my-vehicles-new.html'
};

// Rename files
for (const [oldName, newName] of Object.entries(renames)) {
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
    }
}

// Update links
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));
for (let file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    let changed = false;
    for (const [oldName, newName] of Object.entries(renames)) {
        if (content.includes(oldName)) {
            content = content.split(oldName).join(newName);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(p, content);
    }
}

console.log('Renamed all files and updated links.');
