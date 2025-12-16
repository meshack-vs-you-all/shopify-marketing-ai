import fs from 'fs';
import path from 'path';

const SES_KEY_FILE = path.resolve(__dirname, '../ses-access-key.txt');
const ENV_FILE = path.resolve(__dirname, '../backend/.env');
const ENV_EXAMPLE_FILE = path.resolve(__dirname, '../backend/.env.example');

// User provided Gemini Key
const GEMINI_API_KEY = 'AIzaSyAF7Lr1U9y0ORYZyAsxPVF8Bit1XXicnjg';

async function setup() {
  console.log('🚀 Starting Environment Setup...');

  // 1. Read AWS Credentials
  console.log(`📂 Reading AWS credentials from: ${SES_KEY_FILE}`);
  if (!fs.existsSync(SES_KEY_FILE)) {
    console.error('❌ ses-access-key.txt not found!');
    process.exit(1);
  }

  const keyFileContent = fs.readFileSync(SES_KEY_FILE, 'utf8');
  const lines = keyFileContent.split('\n').filter(l => l.trim() !== '');

  let awsAccessKeyId = '';
  let awsSecretAccessKey = '';

  // Parse simple format based on file inspection
  // Line 1: ACCESS_KEY
  // Line 2: secret-access-key=SECRET
  if (lines.length >= 2) {
    awsAccessKeyId = lines[0].trim();
    const secretLine = lines[1];
    if (secretLine.startsWith('secret-access-key=')) {
      awsSecretAccessKey = secretLine.split('=')[1].trim();
    } else {
      awsSecretAccessKey = lines[1].trim();
    }
  }

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    console.error('❌ Failed to parse AWS credentials.');
    process.exit(1);
  }

  console.log('✅ AWS Credentials parsed successfully.');

  // 2. Read .env.example
  console.log(`📂 Reading .env template from: ${ENV_EXAMPLE_FILE}`);
  let envContent = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf8');

  // 3. Replace Values
  envContent = envContent.replace(/AWS_ACCESS_KEY_ID=.*/, `AWS_ACCESS_KEY_ID=${awsAccessKeyId}`);
  envContent = envContent.replace(/AWS_SECRET_ACCESS_KEY=.*/, `AWS_SECRET_ACCESS_KEY=${awsSecretAccessKey}`);
  envContent = envContent.replace(/AWS_REGION=.*/, `AWS_REGION=us-east-1`);
  envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${GEMINI_API_KEY}`);
  
  // Set defaults for others to ensure server starts
  envContent = envContent.replace(/SES_FROM_EMAIL=.*/, `SES_FROM_EMAIL=marketing@glowify.com`); // Default placeholder
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shopify_marketing_ai`);
  envContent = envContent.replace(/REDIS_URL=.*/, `REDIS_URL=redis://localhost:6379`);

  // 4. Write .env
  fs.writeFileSync(ENV_FILE, envContent);
  console.log(`✨ Successfully wrote updated configuration to: ${ENV_FILE}`);

  // 5. Verification output
  console.log('\n📋 Configuration Summary:');
  console.log(`   AWS_ACCESS_KEY_ID: ${awsAccessKeyId.substring(0, 5)}...`);
  console.log(`   AWS_REGION: us-east-1`);
  console.log(`   GEMINI_API_KEY: ${GEMINI_API_KEY.substring(0, 5)}...`);
}

setup();
