const crypto = require('crypto');

// Generate a 256-bit (32-byte) random key and convert it to a hexadecimal string
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(jwtSecret);
