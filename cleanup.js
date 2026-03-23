const fs = require('fs');
const path = require('path');

const CUSTOM_TEMP = path.join(process.cwd(), 'temp');
const DATA_DIR = path.join(process.cwd(), 'data');
const MEDIA_DIRS = [
  path.join(DATA_DIR, 'mention_media'),
  path.join(DATA_DIR, 'anticall_media')
];

function cleanFolder(folder, maxAgeMs) {
  if (!fs.existsSync(folder)) return 0;
  const files = fs.readdirSync(folder);
  let deleted = 0;
  const now = Date.now();
  for (const file of files) {
    const filePath = path.join(folder, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch (err) {
      console.error(`Could not delete ${file}:`, err.message);
    }
  }
  return deleted;
}

console.log('🧹 Starting cleanup...');
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

let total = 0;
if (fs.existsSync(CUSTOM_TEMP)) {
  const deleted = cleanFolder(CUSTOM_TEMP, oneHour);
  console.log(`🗑️  Deleted ${deleted} files from temp`);
  total += deleted;
}
for (const dir of MEDIA_DIRS) {
  if (fs.existsSync(dir)) {
    const deleted = cleanFolder(dir, oneDay);
    console.log(`🖼️  Deleted ${deleted} media files from ${path.basename(dir)}`);
    total += deleted;
  }
}
console.log(`✅ Cleanup finished. Total deleted: ${total}`);
process.exit(0);
