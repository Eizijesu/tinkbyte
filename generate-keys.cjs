// generate-keys.cjs
const crypto = require('crypto');

console.log('=== TinkByte Security Keys ===');
console.log('Copy these to your .env.local file:');
console.log('');
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('');
console.log('✅ Keys generated successfully!');