// scripts/init-database.ts
// Run this script to initialize the database: npx ts-node scripts/init-database.ts

import { setupDatabase, cleanupExpiredRecords } from '../lib/database';
import { verifyEmailConnection } from '../lib/email';

async function initializeSystem(): Promise<void> {
  console.log('🚀 Initializing Motion-Pro Authentication System...\n');

  try {
    // 1. Setup Database
    console.log('📦 Setting up database and tables...');
    await setupDatabase();
    console.log('✅ Database setup completed successfully\n');

    // 2. Verify Email Service
    console.log('📧 Verifying email service connection...');
    const emailWorking = await verifyEmailConnection();
    if (emailWorking) {
      console.log('✅ Email service is working correctly\n');
    } else {
      console.log('⚠️  Email service configuration needs attention\n');
    }

    // 3. Cleanup expired records
    console.log('🧹 Cleaning up expired records...');
    await cleanupExpiredRecords();
    console.log('✅ Database cleanup completed\n');

    console.log('🎉 Motion-Pro Authentication System initialized successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure your .env.local file is configured with correct database and email settings');
    console.log('2. Run "npm run dev" to start the development server');
    console.log('3. Visit http://localhost:3000/signup to test user registration');
    console.log('4. Visit http://localhost:3000/login to test user login\n');

    process.exit(0);

  } catch (error: any) {
    console.error('❌ Initialization failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your database connection settings in .env.local');
    console.log('2. Ensure MySQL server is running');
    console.log('3. Verify email service credentials');
    console.log('4. Check that all required environment variables are set\n');
    
    process.exit(1);
  }
}

// Run the initialization
initializeSystem();