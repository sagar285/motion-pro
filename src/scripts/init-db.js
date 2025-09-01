#!/usr/bin/env node

const { setupDatabase, initializeDatabase } = require('../src/lib/database');

async function initDatabase() {
  console.log('🚀 Initializing Motion-Pro Database...');
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully!');
    console.log('📊 Your Motion-Pro dashboard is ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check your MySQL connection details in database.ts');
    console.error('2. Ensure MySQL server is running');
    console.error('3. Verify database credentials and permissions');
    process.exit(1);
  }
}

// Run initialization
initDatabase();