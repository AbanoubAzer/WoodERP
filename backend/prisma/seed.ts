import 'dotenv/config';
import { PrismaClient, BranchType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial Super Admin and Demo Company...');

  // 1. Create Super Admin
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'admin@wooderp.local' }
  });

  if (!existingSuperAdmin) {
    const sysCompany = await prisma.company.create({
      data: {
        name: 'إدارة النظام (Super Admin)',
        code: 'SYS-0000',
        email: 'system@wooderp.local',
      }
    });

    const sysRole = await prisma.role.create({
      data: {
        companyId: sysCompany.id,
        name: 'مدير النظام العام',
        permissions: ['ALL'],
        isDefault: true,
      }
    });

    await prisma.user.create({
      data: {
        companyId: sysCompany.id,
        name: 'Super Admin',
        email: 'admin@wooderp.local',
        passwordHash: await bcrypt.hash('admin123', 10),
        isSuperAdmin: true,
        isOwner: true,
        roleId: sysRole.id
      }
    });
    console.log('✅ Super Admin account created.');
  }

  // 2. Create the Demo Account for the Egyptian Market
  const demoEmail = 'asd@asd.asd';
  const existingDemo = await prisma.user.findFirst({ where: { email: demoEmail } });

  if (existingDemo) {
    console.log('⚠️ Demo company already exists. Skipping seed.');
    return;
  }

  const demoCompany = await prisma.company.create({
    data: {
      name: 'شركة النيل لتجارة الأخشاب',
      code: 'DEMO-100',
      email: demoEmail,
      phone: '01000000000',
      address: 'القاهرة - مصر',
      settings: {
        create: {
          currency: 'EGP',
          decimalPrecision: 2,
        }
      }
    }
  });

  // Roles
  const ownerRole = await prisma.role.create({
    data: { companyId: demoCompany.id, name: 'المالك', permissions: ['ALL'], isDefault: true }
  });
  const accountantRole = await prisma.role.create({
    data: { companyId: demoCompany.id, name: 'محاسب', permissions: ['SALES_VIEW', 'PURCHASES_VIEW', 'TREASURY_MANAGE', 'REPORTS_VIEW'] }
  });
  const storekeeperRole = await prisma.role.create({
    data: { companyId: demoCompany.id, name: 'أمين مخزن', permissions: ['INVENTORY_MANAGE'] }
  });

  // Owner User
  const demoUser = await prisma.user.create({
    data: {
      companyId: demoCompany.id,
      name: 'مدير الشركة التجريبية',
      email: demoEmail,
      passwordHash: await bcrypt.hash('Asd123', 10),
      isOwner: true,
      roleId: ownerRole.id
    }
  });

  console.log('✅ Demo company and owner created.');

  // Branches & Warehouses (5 Warehouses)
  const branchesData = [
    { name: 'الفرع الرئيسي - دمياط', type: BranchType.SHOWROOM },
    { name: 'فرع مدينة نصر', type: BranchType.SHOWROOM },
  ];

  const branches = await Promise.all(branchesData.map(b => prisma.branch.create({
    data: { companyId: demoCompany.id, name: b.name, type: b.type, address: b.name }
  })));

  const warehousesData = [
    { name: 'مخزن دمياط الرئيسي', branch: branches[0] },
    { name: 'مخزن الأخشاب الصلبة - دمياط', branch: branches[0] },
    { name: 'مخزن مدينة نصر', branch: branches[1] },
    { name: 'مخزن العبور (توزيع)', branch: branches[1] },
    { name: 'مخزن الإسكندرية', branch: branches[1] },
  ];

  const warehouses = await Promise.all(warehousesData.map(w => prisma.warehouse.create({
    data: { companyId: demoCompany.id, branchId: w.branch.id, name: w.name, address: w.name }
  })));

  // Link Owner to branches
  await prisma.user.update({
    where: { id: demoUser.id },
    data: { branches: { connect: branches.map(b => ({ id: b.id })) } }
  });

  // Users (Accountants & Storekeepers)
  await prisma.user.create({
    data: {
      companyId: demoCompany.id, name: 'محاسب الفرع', email: 'acc@asd.asd',
      passwordHash: await bcrypt.hash('123456', 10), roleId: accountantRole.id,
      branches: { connect: [{ id: branches[0].id }] }
    }
  });

  await prisma.user.create({
    data: {
      companyId: demoCompany.id, name: 'أمين مخزن دمياط', email: 'store@asd.asd',
      passwordHash: await bcrypt.hash('123456', 10), roleId: storekeeperRole.id,
      branches: { connect: [{ id: branches[0].id }] }
    }
  });

  // Treasury Accounts
  await prisma.treasuryAccount.create({
    data: { companyId: demoCompany.id, branchId: branches[0].id, name: 'الخزينة الرئيسية - جنيه مصري', type: 'CASH', balance: 500000 }
  });

  // Wood Types & Categories
  const woodCat = await prisma.category.create({ data: { companyId: demoCompany.id, name: 'أخشاب' } });
  const boardCat = await prisma.category.create({ data: { companyId: demoCompany.id, name: 'أبلكاش ومسطحات' } });

  const romanBeech = await prisma.woodType.create({ data: { companyId: demoCompany.id, name: 'زان روماني', originCountry: 'رومانيا' } });
  const whiteBeech = await prisma.woodType.create({ data: { companyId: demoCompany.id, name: 'زان أبيض', originCountry: 'روسيا' } });
  const swedish = await prisma.woodType.create({ data: { companyId: demoCompany.id, name: 'سويدي', originCountry: 'السويد' } });
  const mosky = await prisma.woodType.create({ data: { companyId: demoCompany.id, name: 'موسكي', originCountry: 'فنلندا' } });
  const oak = await prisma.woodType.create({ data: { companyId: demoCompany.id, name: 'أرو أمريكي', originCountry: 'أمريكا' } });

  // Products
  const productsList = [
    { name: 'خشب زان روماني مبخر', cat: woodCat.id, wood: romanBeech.id, unit: 'CUBIC_METER', price: 18000 },
    { name: 'خشب زان أبيض', cat: woodCat.id, wood: whiteBeech.id, unit: 'CUBIC_METER', price: 12000 },
    { name: 'خشب سويدي نمرة 1', cat: woodCat.id, wood: swedish.id, unit: 'CUBIC_METER', price: 9500 },
    { name: 'لوح أبلكاش سيه 3مم', cat: boardCat.id, wood: mosky.id, unit: 'PIECE', price: 150 },
    { name: 'لوح أبلكاش روسي 4مم', cat: boardCat.id, wood: mosky.id, unit: 'PIECE', price: 180 },
    { name: 'خشب أرو أمريكي', cat: woodCat.id, wood: oak.id, unit: 'CUBIC_METER', price: 35000 },
  ];

  const products = await Promise.all(productsList.map(p => prisma.product.create({
    data: {
      companyId: demoCompany.id, name: p.name, categoryId: p.cat,
      woodTypeId: p.wood, baseUnit: p.unit, brand: 'محلي',
      variants: {
        create: [
          { sku: 'VAR-' + Math.floor(Math.random()*10000), length: 3, width: 0.1, thickness: 0.05, purchasePrice: p.price * 0.8, retailPrice: p.price, wholesalePrice: p.price * 0.9 }
        ]
      }
    },
    include: { variants: true }
  })));

  // Seed inventory for warehouses
  for (const w of warehouses) {
    for (const p of products) {
      await prisma.inventoryStock.create({
        data: {
          companyId: demoCompany.id, warehouseId: w.id, variantId: p.variants[0].id, physicalQty: 20
        }
      });
    }
  }

  // Customers & Suppliers
  const customer1 = await prisma.customer.create({ data: { companyId: demoCompany.id, code: 'C-001', name: 'مصنع الأمل للأثاث', phone: '01011111111', category: 'FACTORY', address: 'المنطقة الصناعية - دمياط' }});
  const customer2 = await prisma.customer.create({ data: { companyId: demoCompany.id, code: 'C-002', name: 'معرض الإيمان', phone: '01022222222', category: 'RETAIL', address: 'شارع بورسعيد - المنصورة' }});
  const supplier1 = await prisma.supplier.create({ data: { companyId: demoCompany.id, code: 'S-001', name: 'المتحدة لاستيراد الأخشاب', phone: '01033333333', address: 'ميناء دمياط' }});

  // Sales and Purchase Invoices & Installments
  const now = new Date();
  const past30 = new Date(now); past30.setDate(now.getDate() - 30);
  const past15 = new Date(now); past15.setDate(now.getDate() - 15);
  const future15 = new Date(now); future15.setDate(now.getDate() + 15);
  const future30 = new Date(now); future30.setDate(now.getDate() + 30);

  // Sale to Customer 1 (with Installments - Overdue)
  const salesInv1 = await prisma.salesInvoice.create({
    data: {
      companyId: demoCompany.id, customerId: customer1.id, invoiceNumber: 'INV-001',
      totalAmount: 50000, amountPaid: 10000, status: 'PARTIALLY_PAID'
    }
  });

  await prisma.customerTransaction.create({
    data: {
      customerId: customer1.id,
      type: 'DEBIT',
      amount: 50000,
      runningBalance: 50000,
      referenceId: salesInv1.id,
      reason: 'Sales Invoice INV-001',
      date: past30
    }
  });
  
  await prisma.customerTransaction.create({
    data: {
      customerId: customer1.id,
      type: 'CREDIT',
      amount: 10000,
      runningBalance: 40000,
      referenceId: salesInv1.id,
      reason: 'Partial Payment INV-001',
      date: past30
    }
  });

  await prisma.installmentPlan.create({
    data: {
      companyId: demoCompany.id, customerId: customer1.id, totalAmount: 40000,
      numberOfMonths: 2, startDate: past30, referenceInvoiceId: salesInv1.id, status: 'ACTIVE',
      installments: {
        create: [
          { installmentNumber: 1, amount: 20000, dueDate: past15, status: 'OVERDUE' }, // Overdue
          { installmentNumber: 2, amount: 20000, dueDate: future15, status: 'PENDING' }
        ]
      }
    }
  });

  // Purchase from Supplier 1 (with Installments)
  const purchInv1 = await prisma.purchaseInvoice.create({
    data: {
      companyId: demoCompany.id, supplierId: supplier1.id, invoiceNumber: 'PINV-001',
      totalAmount: 100000, amountPaid: 50000, status: 'PARTIALLY_PAID'
    }
  });

  await prisma.supplierTransaction.create({
    data: {
      supplierId: supplier1.id,
      type: 'PURCHASE',
      amount: 100000,
      runningBalance: 100000,
      referenceId: purchInv1.id,
      reason: 'Purchase Invoice PINV-001',
      date: past15
    }
  });

  await prisma.supplierTransaction.create({
    data: {
      supplierId: supplier1.id,
      type: 'PAYMENT',
      amount: 50000,
      runningBalance: 50000,
      referenceId: purchInv1.id,
      reason: 'Partial Payment PINV-001',
      date: past15
    }
  });

  await prisma.installmentPlan.create({
    data: {
      companyId: demoCompany.id, supplierId: supplier1.id, totalAmount: 50000,
      numberOfMonths: 2, startDate: past15, referenceInvoiceId: purchInv1.id, status: 'ACTIVE',
      installments: {
        create: [
          { installmentNumber: 1, amount: 25000, dueDate: past15, status: 'OVERDUE' }, // Overdue payable
          { installmentNumber: 2, amount: 25000, dueDate: future30, status: 'PENDING' }
        ]
      }
    }
  });

  console.log('✅ Master data, Inventory, Customers, Invoices, and Installments created successfully!');
  console.log('----------------------------------------------------');
  console.log(`Demo Account created: ${demoEmail} / Asd123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
