#!/usr/bin/env node

/**
 * Railway Environment Variables Setup Script
 * 
 * This script helps you set up environment variables for Railway deployment.
 * Run with: node scripts/setup-railway-env.js
 */

const crypto = require('crypto');

// Generate secure random strings
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('🚀 Railway Environment Variables Setup\n');
console.log('Copy these environment variables to your Railway project:\n');

console.log('# === ESSENTIAL VARIABLES (REQUIRED) ===');
console.log(`DATABASE_URL=postgresql://neondb_owner:npg_MNme3xyqJ8hl@ep-dark-dawn-ahpsbaax-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require`);
console.log(`NODE_ENV=production`);
console.log(`PORT=3001`);
console.log('');

console.log('# === SECURITY SECRETS (CHANGE THESE!) ===');
console.log(`JWT_SECRET=${generateSecret()}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
console.log(`COOKIE_SECRET=${generateSecret()}`);
console.log(`INTERNAL_API_TOKEN=${generateSecret(32)}`);
console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}`);
console.log('');

console.log('# === JWT CONFIGURATION ===');
console.log(`JWT_EXPIRES_IN=15m`);
console.log(`JWT_REFRESH_EXPIRES_IN=7d`);
console.log('');

console.log('# === CORS (UPDATE WITH YOUR DOMAIN) ===');
console.log(`ALLOWED_ORIGINS=https://your-app-name.railway.app`);
console.log('');

console.log('# === OPTIONAL VARIABLES ===');
console.log(`MAX_FILE_SIZE=10485760`);
console.log(`UPLOAD_DEST=./uploads`);
console.log(`THROTTLE_TTL=60000`);
console.log(`THROTTLE_LIMIT=100`);
console.log(`DEFAULT_PAGE_SIZE=20`);
console.log(`MAX_PAGE_SIZE=100`);
console.log(`DEFAULT_COMMISSION_RATE=5.0`);
console.log(`LOW_STOCK_THRESHOLD=5`);
console.log(`RESERVATION_EXPIRY_MINUTES=15`);
console.log(`DEFAULT_TENANT_ID=default`);
console.log(`TENANT_CACHE_TTL=3600`);
console.log(`API_KEY_HEADER=x-api-key`);
console.log(`DATA_RETENTION_DAYS=2555`);
console.log(`ARCHIVE_AFTER_DAYS=365`);
console.log(`HARD_DELETE_AFTER_DAYS=365`);
console.log('');

console.log('# === FEATURE FLAGS ===');
console.log(`ENABLE_MULTI_TENANCY=true`);
console.log(`ENABLE_ADVANCED_AUTH=true`);
console.log(`ENABLE_SAGA_ORCHESTRATION=true`);
console.log(`ENABLE_READ_MODELS=true`);
console.log(`ENABLE_DATA_LIFECYCLE=true`);
console.log('');

console.log('# === ADD THESE WHEN READY ===');
console.log('# GOOGLE_CLIENT_ID=your-google-client-id');
console.log('# GOOGLE_CLIENT_SECRET=your-google-client-secret');
console.log('# GOOGLE_CALLBACK_URL=https://your-app-name.railway.app/api/v1/auth/google/callback');
console.log('# SMTP_HOST=smtp.gmail.com');
console.log('# SMTP_PORT=587');
console.log('# SMTP_USER=your-email@gmail.com');
console.log('# SMTP_PASS=your-app-password');
console.log('# RAZORPAY_KEY_ID=your-razorpay-key-id');
console.log('# RAZORPAY_KEY_SECRET=your-razorpay-key-secret');
console.log('');

console.log('📋 Instructions:');
console.log('1. Go to your Railway project dashboard');
console.log('2. Click on "Variables" tab');
console.log('3. Copy and paste each variable above');
console.log('4. Update ALLOWED_ORIGINS with your actual Railway URL');
console.log('5. Add optional variables as needed');
console.log('');
console.log('🔒 Security Note: The secrets above are randomly generated and secure.');
console.log('💡 Tip: Save these secrets somewhere safe for future reference!');