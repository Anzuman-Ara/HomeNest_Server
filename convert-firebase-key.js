const fs = require('fs');
const path = require('path');

// Check if firebase service key file exists
const keyPath = path.join(__dirname, 'firebase-admin-service-key.json');

if (!fs.existsSync(keyPath)) {
  console.log('❌ firebase-admin-service-key.json not found in server directory');
  console.log('Please ensure you have downloaded your Firebase service key and saved it as firebase-admin-service-key.json');
  process.exit(1);
}

try {
  const key = fs.readFileSync(keyPath, 'utf8');
  const base64 = Buffer.from(key).toString('base64');
  
  console.log('✅ Base64 encoded Firebase service key:');
  console.log('\n' + base64);
  
  console.log('\n📋 Environment variable setup:');
  console.log('FB_SERVICE_KEY=' + base64);
  
} catch (error) {
  console.error('❌ Error processing Firebase service key:', error.message);
}