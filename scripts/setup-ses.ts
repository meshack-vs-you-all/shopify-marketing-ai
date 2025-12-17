import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.resolve(__dirname, '../.credentials.local');
const ENV_FILE = path.resolve(__dirname, '../backend/.env');
const ENV_EXAMPLE_FILE = path.resolve(__dirname, '../backend/.env.example');

// Read Gemini key from environment or credentials file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';


async function setup() {
  console.log('🚀 Starting Environment Setup...');

  // 1. Read credentials from .credentials.local
  console.log(`📂 Reading credentials from: ${CREDENTIALS_FILE}`);
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error('❌ .credentials.local not found!');
    console.log('   Create .credentials.local with your AWS and Gemini credentials.');
    process.exit(1);
  }

  const credContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
  const credentials: Record<string, string> = {};

  // Parse key=value format
  credContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      credentials[key.trim()] = valueParts.join('=').trim();
    }
  });

  const awsAccessKeyId = credentials['AWS_ACCESS_KEY_ID'] || '';
  const awsSecretAccessKey = credentials['AWS_SECRET_ACCESS_KEY'] || '';
  const geminiApiKey = credentials['GEMINI_API_KEY'] || GEMINI_API_KEY;

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    console.error('❌ Missing AWS credentials in .credentials.local');
    process.exit(1);
  }

  console.log('✅ Credentials parsed successfully.');

  // 2. Read .env.example
  console.log(`📂 Reading .env template from: ${ENV_EXAMPLE_FILE}`);
  let envContent = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf8');

  // 3. Replace Values
  envContent = envContent.replace(/AWS_ACCESS_KEY_ID=.*/, `AWS_ACCESS_KEY_ID=${awsAccessKeyId}`);
  envContent = envContent.replace(/AWS_SECRET_ACCESS_KEY=.*/, `AWS_SECRET_ACCESS_KEY=${awsSecretAccessKey}`);
  envContent = envContent.replace(/AWS_REGION=.*/, `AWS_REGION=${credentials['AWS_REGION'] || 'us-east-1'}`);
  envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiApiKey}`);

  // Set defaults for others to ensure server starts
  envContent = envContent.replace(/SES_FROM_EMAIL=.*/, `SES_FROM_EMAIL=${credentials['SES_FROM_EMAIL'] || 'marketing@glowify.com'}`);
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${credentials['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/shopify_marketing_ai'}`);
  envContent = envContent.replace(/REDIS_URL=.*/, `REDIS_URL=${credentials['REDIS_URL'] || 'redis://localhost:6379'}`);

  // 4. Write .env
  fs.writeFileSync(ENV_FILE, envContent);
  console.log(`✨ Successfully wrote updated configuration to: ${ENV_FILE}`);

  // 5. Verification output
  console.log('\n📋 Configuration Summary:');
  console.log(`   AWS_ACCESS_KEY_ID: ${awsAccessKeyId.substring(0, 5)}...`);
  console.log(`   AWS_REGION: ${credentials['AWS_REGION'] || 'us-east-1'}`);
  console.log(`   GEMINI_API_KEY: ${geminiApiKey ? geminiApiKey.substring(0, 5) + '...' : '(not set)'}`);
}

setup();
