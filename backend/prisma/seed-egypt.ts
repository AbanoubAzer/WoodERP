import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed: Egyptian Market Data...');

  // 1. Create a dummy company
  const companyCode = `WOOD-EG-${Date.now()}`;
  const company = await prisma.company.create({
    data: {
      code: companyCode,
      name: 'الشركة المصرية لتجارة الأخشاب',
      email: `info-${companyCode}@wood-eg.com`,
      phone: '01001234567',
      taxNumber: '123-456-789',
      commercialRegistration: '987654321',
      address: 'القاهرة، مصر',
      settings: {
        create: {
          currency: 'EGP',
          decimalPrecision: 2,
        },
      },
    },
  });

  // 2. Create branch
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'الفرع الرئيسي - القاهرة',
      type: 'SHOWROOM',
      address: 'شارع جسر السويس، القاهرة',
    },
  });

  // 3. Create 5 Warehouses
  const warehouses = await Promise.all([
    'مخزن العبور',
    'مخزن العاشر من رمضان',
    'مخزن شبرا الخيمة',
    'مخزن دمياط الرئيسي',
    'مخزن جسر السويس'
  ].map(name => prisma.warehouse.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name,
      address: name,
    }
  })));

  // 4. Create Roles
  const accountantRole = await prisma.role.create({
    data: { companyId: company.id, name: 'محاسب', permissions: ['VIEW_REPORTS', 'MANAGE_FINANCE'] }
  });
  const branchManagerRole = await prisma.role.create({
    data: { companyId: company.id, name: 'أمين فرع', permissions: ['MANAGE_SALES', 'VIEW_INVENTORY'] }
  });
  const warehouseKeeperRole = await prisma.role.create({
    data: { companyId: company.id, name: 'أمين مخزن', permissions: ['MANAGE_INVENTORY'] }
  });

  // 5. Create Default SuperAdmin r@test.com
  const passwordHash = await bcrypt.hash('asd123', 10);
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'r@test.com' } },
    update: { passwordHash, isSuperAdmin: true, roleId: branchManagerRole.id },
    create: {
      companyId: company.id,
      email: 'r@test.com',
      passwordHash,
      name: 'المدير العام',
      isOwner: true,
      isSuperAdmin: true,
      branches: { connect: { id: branch.id } },
    }
  });

  // Create some employees
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'acc@test.com' } },
    update: {},
    create: {
      companyId: company.id,
      email: 'acc@test.com',
      passwordHash,
      name: 'أحمد محمود - محاسب',
      roleId: accountantRole.id,
      branches: { connect: { id: branch.id } },
    }
  });

  // 6. Master Data (WoodTypes & Categories)
  const categories = await Promise.all(['أخشاب صلبة', 'أخشاب لينة', 'أبلكاش', 'MDF'].map(name => 
    prisma.category.create({ data: { companyId: company.id, name }})
  ));

  const woodTypes = await Promise.all(['زان روماني', 'زان أبيض', 'موسكي', 'سويدي', 'أرو', 'عزيزي', 'كونتر'].map(name => 
    prisma.woodType.create({ data: { companyId: company.id, name }})
  ));

  // 7. Customers & Suppliers
  const customer = await prisma.customer.create({
    data: { companyId: company.id, name: 'ورشة النجاح للنجارة', phone: '01111111111', code: 'CUST-001' }
  });
  const supplier = await prisma.supplier.create({
    data: { companyId: company.id, name: 'الشركة المتحدة لاستيراد الأخشاب', phone: '01222222222', code: 'SUP-001' }
  });

  // 8. Products
  const products: any[] = [];
  let i = 1;
  for (const wood of woodTypes) {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[0].id,
        woodTypeId: wood.id,
        name: `خشب ${wood.name} مقاسات مختلفة`,
        variants: {
          create: {
            sku: `WD-${wood.name.substring(0,2)}-001-V${i++}-${Date.now()}`,
            retailPrice: 15000,
            purchasePrice: 12000,
            length: 3,
            width: 0.15,
            thickness: 0.05
          }
        }
      }
    });
    products.push(product);
  }

  // Add Inventory
  for (const warehouse of warehouses) {
    const variant = await prisma.productVariant.findFirst({ where: { productId: products[0].id } });
    if(variant) {
      await prisma.inventoryStock.create({
        data: {
          companyId: company.id,
          warehouseId: warehouse.id,
          variantId: variant.id,
          physicalQty: 50,
        }
      });
    }
  }

  // 9. Installments (اقساط)
  // 9.1 Installments TO the company (اقساط ليا من العملاء)
  const planForMe = await prisma.installmentPlan.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      totalAmount: 50000,
      numberOfMonths: 5,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)), // Started 2 months ago
      notes: 'تقسيط خشب زان لورشة النجاح',
    }
  });
  
  // Overdue Installment (Late)
  await prisma.installment.create({
    data: {
      planId: planForMe.id,
      installmentNumber: 1,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // Due last month
      amount: 10000,
      paidAmount: 0,
      status: 'OVERDUE'
    }
  });

  // Pending Installment (Due Next Month)
  await prisma.installment.create({
    data: {
      planId: planForMe.id,
      installmentNumber: 2,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      amount: 10000,
      paidAmount: 0,
      status: 'PENDING'
    }
  });

  // 9.2 Installments AGAINST the company (اقساط عليا للموردين)
  const planAgainstMe = await prisma.installmentPlan.create({
    data: {
      companyId: company.id,
      supplierId: supplier.id,
      totalAmount: 100000,
      numberOfMonths: 4,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // Started 1 month ago
      notes: 'أقساط فاتورة استيراد الشركة المتحدة',
    }
  });

  // Overdue Installment Against me
  await prisma.installment.create({
    data: {
      planId: planAgainstMe.id,
      installmentNumber: 1,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // Due 5 days ago
      amount: 25000,
      paidAmount: 0,
      status: 'OVERDUE'
    }
  });

  // Pending Installment
  await prisma.installment.create({
    data: {
      planId: planAgainstMe.id,
      installmentNumber: 2,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      amount: 25000,
      paidAmount: 0,
      status: 'PENDING'
    }
  });

  console.log('====================================');
  console.log('Seed Completed Successfully! 🎉');
  console.log('Login Email: r@test.com');
  console.log('Login Password: asd123');
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
