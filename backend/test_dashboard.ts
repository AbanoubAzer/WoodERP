import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const company = await prisma.company.findFirst({ where: { email: 'asd@asd.asd' } });
  if (!company) {
    console.log("No company found for asd@asd.asd");
    return;
  }
  console.log("Company ID:", company.id);

  // Sales
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const salesAgg = await prisma.salesInvoice.aggregate({
    where: { companyId: company.id, issuedAt: { gte: startOfMonth } },
    _sum: { totalAmount: true }
  });
  console.log("Sales:", salesAgg);

  const customerDebits = await prisma.customerTransaction.aggregate({
    where: { customer: { companyId: company.id }, type: 'DEBIT' },
    _sum: { amount: true }
  });
  console.log("Debits:", customerDebits);

  const recentActivity = await prisma.customerTransaction.findMany({
    where: { customer: { companyId: company.id } },
    include: { customer: true },
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log("Recent Activity:", recentActivity.length);
  
  const installments = await prisma.installment.findMany({
    where: {
      plan: { companyId: company.id, customerId: { not: null } },
      status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
    },
    include: { plan: { include: { customer: true } } }
  });
  console.log("Installments:", installments.length);
  
}
main().catch(console.error).finally(() => prisma.$disconnect());
