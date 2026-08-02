import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Warehouses ---');
  const warehouses = await prisma.warehouse.findMany({
    select: { id: true, name: true, branch: { select: { name: true } } }
  });
  console.table(warehouses.map(w => ({ id: w.id, name: w.name, branch: w.branch?.name })));

  console.log('\n--- Inventory Stock ---');
  const stock = await prisma.inventoryStock.findMany({
    include: {
      warehouse: { select: { name: true } },
      variant: { include: { product: { select: { name: true } } } }
    }
  });

  console.table(stock.map(s => ({
    warehouse: s.warehouse?.name,
    product: s.variant.product.name,
    dimensions: `${s.variant.thickness}x${s.variant.width}x${s.variant.length}`,
    physicalQty: s.physicalQty,
    reservedQty: s.reservedQty
  })));

  console.log('\n--- Recent Stock Movements (Transfers) ---');
  const movements = await prisma.stockMovement.findMany({
    where: { type: 'TRANSFER' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      fromWarehouse: { select: { name: true } },
      toWarehouse: { select: { name: true } },
      variant: { include: { product: { select: { name: true } } } }
    }
  });

  console.table(movements.map(m => ({
    type: m.type,
    from: m.fromWarehouse?.name,
    to: m.toWarehouse?.name,
    product: m.variant.product.name,
    quantity: m.quantity,
    date: m.createdAt
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
