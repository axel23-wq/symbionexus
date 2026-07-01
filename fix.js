const fs = require('fs');
let data = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');
data = data.replace(/photos:\s*\[\]/g, "photos: '[]'");
data = data.replace(/certifications:\s*\[\]/g, "certifications: '[]'");
fs.writeFileSync('apps/api/prisma/seed.ts', data);
console.log('Fixed');
