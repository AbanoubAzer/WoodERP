import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { email: 'r@test.com' },
    orderBy: { createdAt: 'desc' },
    include: { company: true }
  });
  
  console.log(`Found ${users.length} users with r@test.com`);
  
  if (users.length > 1) {
    // Keep the first (most recent) one, delete the rest
    const toDelete = users.slice(1);
    for (const u of toDelete) {
      console.log(`Deleting old user ID: ${u.id} for company ${u.company?.name} (code: ${u.company?.code})`);
      // Since it's an owner, we should probably delete the whole company to clean up
      await prisma.company.delete({ where: { id: u.companyId } });
    }
    console.log('Cleanup complete!');
  } else {
    console.log('No duplicates found.');
  }
}
main().finally(() => prisma.$disconnect());
