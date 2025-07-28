// Check if all required config exists
const fs = require('fs');

console.log('🔍 Checking project setup...');

const checks = [
  { file: '.env', desc: 'Backend environment' },
  { file: 'frontend/.env', desc: 'Frontend environment' },
  { file: 'backend/config/firebase-service-account-key.json', desc: 'Firebase key' }
];

let allGood = true;
checks.forEach(check => {
  if (fs.existsSync(check.file)) {
    console.log(`✅ ${check.desc}`);
  } else {
    console.log(`❌ ${check.desc} - Missing: ${check.file}`);
    allGood = false;
  }
});

if (!allGood) {
  console.log('\n📖 Please see README.md for setup instructions');
  process.exit(1);
}