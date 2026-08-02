import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: 'الشركة المصرية لتجارة الأخشاب' },
    orderBy: { createdAt: 'desc' }
  });

  if (!company) {
    console.log('Company not found');
    return;
  }

  const branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  
  if (branch) {
    // 1. Treasury Account
    console.log('Creating Treasury Account...');
    await prisma.treasuryAccount.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        name: 'الخزينة الرئيسية',
        type: 'CASH',
        balance: 1500000 // 1.5 Million EGP
      }
    });
  }

  // 2. Customer Transactions
  const customer = await prisma.customer.findFirst({ where: { companyId: company.id } });
  if (customer) {
    console.log('Creating Customer Transactions...');
    await prisma.customerTransaction.create({
      data: {
        customerId: customer.id,
        type: 'DEBIT',
        amount: 50000,
        runningBalance: 50000,
        reason: 'فاتورة مبيعات رقم #1001',
      }
    });
    // Add a small payment
    await prisma.customerTransaction.create({
      data: {
        customerId: customer.id,
        type: 'CREDIT',
        amount: 10000,
        runningBalance: 40000,
        reason: 'دفعة نقدية',
      }
    });
  }

  // 3. Supplier Transactions
  const supplier = await prisma.supplier.findFirst({ where: { companyId: company.id } });
  if (supplier) {
    console.log('Creating Supplier Transactions...');
    await prisma.supplierTransaction.create({
      data: {
        supplierId: supplier.id,
        type: 'PURCHASE',
        amount: 100000,
        runningBalance: 100000,
        reason: 'فاتورة مشتريات استيراد #9921',
      }
    });
    // Add a small payment
    await prisma.supplierTransaction.create({
      data: {
        supplierId: supplier.id,
        type: 'PAYMENT',
        amount: 25000,
        runningBalance: 75000,
        reason: 'تحويل بنكي',
      }
    });
  }

  console.log('Dashboard Data Patched Successfully!');
}

main().finally(() => prisma.$disconnect());
