import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: { isSuperAdmin: true }
  });
  console.log('Updated users:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
