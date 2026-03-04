import { PrismaClient, TailoringLevel } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.PROFILE_DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('🔍 Verifying Tailoring Refactor...');

  // 1. Create a dummy profile
  const userId = 'verify-user-' + Date.now();
  const profile = await prisma.profile.create({
    data: {
      userId,
      tailoring: TailoringLevel.BALANCED,
    },
  });
  console.log('✓ Created profile with default tailoring:', profile.tailoring);

  // 2. Update tailoring to DEEP
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { tailoring: TailoringLevel.DEEP },
  });
  console.log('✓ Updated profile to DEEP tailoring:', updated.tailoring);

  if (updated.tailoring === TailoringLevel.DEEP) {
    console.log('✅ Verification Successful!');
  } else {
    console.log('❌ Verification Failed!');
    process.exit(1);
  }

  // Cleanup
  await prisma.profile.delete({ where: { id: profile.id } });
}

verify()
  .catch((e) => {
    console.error('❌ Verification Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
