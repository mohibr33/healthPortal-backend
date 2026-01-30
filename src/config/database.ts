import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Test database connection
export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Provide helpful error messages based on error code
    if (error.code === 'P1001') {
      console.error('   → Cannot reach the database server. Check if DATABASE_URL is correct.');
    } else if (error.code === 'P1002') {
      console.error('   → Database server timed out. The database might be sleeping (Neon free tier).');
    } else if (error.code === 'P1003') {
      console.error('   → Database does not exist. Run: npm run prisma:migrate');
    } else if (error.message?.includes('ENOTFOUND')) {
      console.error('   → Invalid database host. Check your DATABASE_URL.');
    } else if (error.message?.includes('authentication')) {
      console.error('   → Authentication failed. Check username/password in DATABASE_URL.');
    }
    
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
