import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { StockTransactionsService } from './src/stock-transactions/stock-transactions.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testTransfer() {
  const service = new StockTransactionsService(prisma as any);
  
  try {
    const warehouse1 = await prisma.warehouse.findFirst();
    const warehouse2 = await prisma.warehouse.findFirst({
      where: { id: { not: warehouse1?.id } }
    });
    const variant = await prisma.productVariant.findFirst();

    if (!warehouse1 || !warehouse2 || !variant) {
      console.log('Missing data for test');
      return;
    }

    console.log(`Testing transfer of variant ${variant.id} from ${warehouse1.name} to ${warehouse2.name}`);

    const result = await service.transfer(warehouse1.companyId, 'test-user-id', {
      fromWarehouseId: warehouse1.id,
      toWarehouseId: warehouse2.id,
      variantId: variant.id,
      quantity: 1,
      reason: 'test transfer'
    });

    console.log('Success:', result);
  } catch (err) {
    console.error('Error during transfer:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testTransfer();
