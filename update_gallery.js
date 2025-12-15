const fs = require('fs');
const path = require('path');

// Base Assets directory
const assetsDir = path.join(__dirname, 'Assets');
const dataFile = path.join(__dirname, 'data.js');

// Allowed extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mov', '.mp4'];

// Helper to get files in a directory
function getMediaFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    
    return fs.readdirSync(dir).filter(file => {
        if (file.startsWith('.')) return false;
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
    });
}

// Scan directories
fs.readdir(assetsDir, { withFileTypes: true }, (err, entries) => {
    if (err) {
        console.error('Error scanning Assets directory:', err);
        return;
    }

    const albums = {};

    entries.forEach(entry => {
        if (entry.isDirectory()) {
            const albumName = entry.name;
            const albumPath = path.join(assetsDir, albumName);
            const files = getMediaFiles(albumPath);
            
            if (files.length > 0) {
                albums[albumName] = files;
            }
        }
    });

    const content = `export const albums = ${JSON.stringify(albums, null, 4)};\n`;

    fs.writeFile(dataFile, content, (err) => {
        if (err) {
            console.error('Error writing data.js:', err);
        } else {
            const albumNames = Object.keys(albums);
            console.log(`Successfully updated data.js with ${albumNames.length} albums: ${albumNames.join(', ')}`);
        }
    });
});
