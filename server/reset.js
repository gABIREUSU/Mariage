const fs = require('fs');
const path = require('path');

const seed = path.join(__dirname, 'seed');
const data = path.join(__dirname, 'data');

fs.mkdirSync(data, { recursive: true });
for (const nome of fs.readdirSync(seed)) {
  fs.copyFileSync(path.join(seed, nome), path.join(data, nome));
}
console.log('Dados restaurados a partir de server/seed/');