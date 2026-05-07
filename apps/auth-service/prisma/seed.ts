import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:8915code@localhost:5432/upwin_auth';
const adminPassword = process.env.ADMIN_SEED_PASSWORD;

if (!adminPassword) {
  throw new Error('ADMIN_SEED_PASSWORD must be set before seeding the admin user');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@upwin.com' },
    update: {},
    create: {
      email: 'admin@upwin.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Admin user created:', admin.email);
  console.log('Email: admin@upwin.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
