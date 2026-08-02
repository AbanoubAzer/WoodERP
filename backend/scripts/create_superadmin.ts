import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'superadmin@wooderp.com';
  const password = 'superpassword123';
  const passwordHash = await bcrypt.hash(password, 10);

  // We need a company for this user if companyId is required, but let's check
  // if companyId is required. It's required in the schema (companyId String).
  // So we just attach it to the first company.
  const company = await prisma.company.findFirst();
  
  if (!company) {
    console.log('No company found. Please run the seed script first.');
    return;
  }

  const superAdmin = await prisma.user.upsert({
    where: { 
      companyId_email: {
        companyId: company.id,
        email
      }
    },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isOwner: true,
      name: 'Super Admin',
    },
    create: {
      email,
      passwordHash,
      name: 'Super Admin',
      isSuperAdmin: true,
      isOwner: true,
      companyId: company.id,
    }
  });

  console.log('====================================');
  console.log('Super Admin Created Successfully!');
  console.log(`Login Email: ${email}`);
  console.log(`Login Password: ${password}`);
  console.log('====================================');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
