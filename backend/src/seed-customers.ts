import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'r@test.com' }
  });
  
  if (!user) {
    throw new Error('User r@test.com not found');
  }
  
  const company = await prisma.company.findUnique({
    where: { id: user.companyId }
  });
  
  if (!company) throw new Error('No company found');
  
  const warehouse = await prisma.warehouse.findFirst({
    where: { companyId: company.id }
  });

  const cities = ['القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'طنطا', 'أسيوط', 'المنيا', 'دمياط', 'الزقازيق', 'بورسعيد'];
  const categories = ['RETAIL', 'CONTRACTOR', 'DEALER', 'FACTORY'];

  console.log('Seeding 10 customers...');
  
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        warehouseId: warehouse?.id,
        code: `CUST-TEST-${i}`,
        name: `عميل تجريبي ${i}`,
        phone: `010000000${i.toString().padStart(2, '0')}`,
        address: `شارع تجريبي رقم ${i}`,
        city: cities[i % cities.length],
        category: categories[i % categories.length],
      }
    });

    console.log(`Created customer: ${customer.name}`);

    // Create 20 invoices
    let runningBalance = 0;
    
    for (let j = 1; j <= 20; j++) {
      const amount = Math.floor(Math.random() * 5000) + 1000;
      
      const invoice = await prisma.salesInvoice.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          warehouseId: warehouse?.id,
          invoiceNumber: `INV-TEST-${i}-${j}`,
          status: 'COMPLETED',
          totalAmount: amount,
          subtotal: amount,
        }
      });

      // Update running balance (Debit - increase debt)
      runningBalance += amount;
      await prisma.customerTransaction.create({
        data: {
          customerId: customer.id,
          type: 'DEBIT',
          amount: amount,
          runningBalance: runningBalance,
          referenceId: invoice.id,
          reason: `Sales Invoice ${invoice.invoiceNumber}`,
          date: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
        }
      });

      // Add a payment sometimes so they don't have infinite debt, 
      // occasionally overpay to make credit
      if (Math.random() > 0.4) {
        // Sometimes overpay
        const payAmount = Math.random() > 0.8 ? amount + 1000 : Math.floor(amount * Math.random());
        runningBalance -= payAmount;
        
        const payment = await prisma.customerPayment.create({
          data: {
            customerId: customer.id,
            amount: payAmount,
            method: 'CASH',
            referenceId: `REC-TEST-${i}-${j}`,
            date: new Date()
          }
        });

        await prisma.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'CREDIT',
            amount: payAmount,
            runningBalance: runningBalance,
            referenceId: payment.id,
            reason: `Payment Receipt ${payment.referenceId}`,
            date: new Date()
          }
        });
      }
    }
    console.log(`Created 20 invoices for ${customer.name}. Final Balance: ${runningBalance}`);
  }
  
  console.log('Done seeding customers and invoices!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
