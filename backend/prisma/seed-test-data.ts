import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { fakerAR as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed: 1 year of dummy data...');

  // 1. Create a dummy company
  const companyCode = 'TEST-' + faker.string.alphanumeric(6).toUpperCase();
  console.log(`Creating company: ${companyCode}`);
  
  const company = await prisma.company.create({
    data: {
      code: companyCode,
      name: 'شركة اختبار (بيانات سنة)',
      email: `admin@${companyCode.toLowerCase()}.com`,
      phone: faker.phone.number(),
      taxNumber: faker.finance.accountNumber(9),
      commercialRegistration: faker.finance.accountNumber(9),
      address: faker.location.streetAddress(),
      settings: {
        create: {
          currency: 'EGP',
          decimalPrecision: 2,
        },
      },
    },
  });

  // 2. Create branch and warehouse
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'الفرع الرئيسي',
      type: 'SHOWROOM',
      address: faker.location.streetAddress(),
    },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name: 'المخزن الرئيسي',
      address: faker.location.streetAddress(),
    },
  });

  // 3. Create Treasury Account
  const treasury = await prisma.treasuryAccount.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name: 'الخزينة الرئيسية',
      type: 'CASH',
      balance: 1000000, // Initial cash injection for purchasing
    },
  });

  // 4. Create Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminEmail = `admin@${companyCode.toLowerCase()}.com`;
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      email: adminEmail,
      passwordHash,
      name: 'مدير النظام',
      isOwner: true,
      branches: { connect: { id: branch.id } },
    },
  });
  console.log(`Admin User Created: ${adminEmail} / password123`);

  // 5. Create Master Data: Categories, WoodTypes, Products, Variants
  console.log('Creating Master Data...');
  const categories = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.category.create({
        data: {
          companyId: company.id,
          name: faker.commerce.department() + ' ' + faker.string.alphanumeric(4),
          description: faker.commerce.productDescription(),
        },
      })
    )
  );

  const woodTypes = await Promise.all(
    ['زان', 'صنوبر', 'ماهوجني', 'جوز', 'كرز'].map((name) =>
      prisma.woodType.create({
        data: {
          companyId: company.id,
          name: `${name} ${faker.string.alphanumeric(4)}`,
          species: name,
        },
      })
    )
  );

  const variants: any[] = [];
  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: faker.helpers.arrayElement(categories).id,
        woodTypeId: faker.helpers.arrayElement(woodTypes).id,
        name: faker.commerce.productName(),
        baseUnit: faker.helpers.arrayElement(['PIECE', 'CUBIC_METER', 'SQM']),
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'SKU-' + faker.string.alphanumeric(8).toUpperCase(),
        purchasePrice: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
        retailPrice: parseFloat(faker.commerce.price({ min: 1500, max: 5000 })),
        inventory: {
          create: {
            companyId: company.id,
            warehouseId: warehouse.id,
            physicalQty: 0,
          },
        },
      },
    });
    variants.push(variant);
  }

  // 6. Create Customers and Suppliers
  const customers = await Promise.all(
    Array.from({ length: 30 }).map(() =>
      prisma.customer.create({
        data: {
          companyId: company.id,
          code: 'CUS-' + faker.string.alphanumeric(6).toUpperCase(),
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          creditLimit: 50000,
        },
      })
    )
  );

  const suppliers = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.supplier.create({
        data: {
          companyId: company.id,
          code: 'SUP-' + faker.string.alphanumeric(6).toUpperCase(),
          name: faker.company.name(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        },
      })
    )
  );

  console.log('Generating 1 Year of Transactions...');
  
  // 7. Loop 365 Days
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  let currentInvNumber = 1;
  let currentPurchaseInvNumber = 1;

  for (let day = 0; day < 365; day++) {
    const currentDate = new Date(oneYearAgo.getTime() + day * 24 * 60 * 60 * 1000);
    
    // Sometimes do a Purchase to restock
    if (day % 10 === 0) {
      const supplier = faker.helpers.arrayElement(suppliers);
      const itemsToBuy = faker.helpers.arrayElements(variants, faker.number.int({ min: 3, max: 8 }));
      
      let totalAmount = 0;
      const purchaseItemsData = itemsToBuy.map((v) => {
        const qty = faker.number.int({ min: 50, max: 200 });
        const subtotal = qty * v.purchasePrice;
        totalAmount += subtotal;
        return {
          variantId: v.id,
          warehouseId: warehouse.id,
          quantity: qty,
          unitCost: v.purchasePrice,
          subtotal: subtotal,
        };
      });

      const purchaseInvoice = await prisma.purchaseInvoice.create({
        data: {
          companyId: company.id,
          supplierId: supplier.id,
          invoiceNumber: `PINV-${currentPurchaseInvNumber++}`,
          subtotal: totalAmount,
          totalAmount: totalAmount,
          issuedAt: currentDate,
          createdAt: currentDate,
          items: {
            create: purchaseItemsData,
          },
        },
      });

      // Update Inventory
      for (const item of purchaseItemsData) {
        await prisma.inventoryStock.updateMany({
          where: { variantId: item.variantId, warehouseId: warehouse.id },
          data: { physicalQty: { increment: item.quantity } },
        });
      }

      // Record Supplier Transaction and Payment (Randomly partial or full)
      const paidAmount = faker.helpers.arrayElement([totalAmount, totalAmount * 0.5, 0]);
      
      await prisma.supplierTransaction.create({
        data: {
          supplierId: supplier.id,
          type: 'PURCHASE',
          amount: totalAmount,
          runningBalance: totalAmount, // Simplification for seeding
          referenceId: purchaseInvoice.id,
          date: currentDate,
        },
      });

      if (paidAmount > 0) {
        await prisma.supplierPayment.create({
          data: {
            supplierId: supplier.id,
            amount: paidAmount,
            method: 'CASH',
            referenceId: purchaseInvoice.id,
            date: currentDate,
          },
        });
        await prisma.supplierTransaction.create({
          data: {
            supplierId: supplier.id,
            type: 'PAYMENT',
            amount: paidAmount,
            runningBalance: totalAmount - paidAmount,
            referenceId: purchaseInvoice.id,
            date: currentDate,
          },
        });
        await prisma.treasuryTransaction.create({
          data: {
            accountId: treasury.id,
            type: 'OUT',
            amount: paidAmount,
            description: `Payment for ${purchaseInvoice.invoiceNumber}`,
            date: currentDate,
            createdAt: currentDate,
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: treasury.id },
          data: { balance: { decrement: paidAmount } },
        });
      }
    }

    // Do 1 to 5 sales per day
    const salesCount = faker.number.int({ min: 1, max: 5 });
    for (let s = 0; s < salesCount; s++) {
      const customer = faker.helpers.arrayElement(customers);
      const itemsToSell = faker.helpers.arrayElements(variants, faker.number.int({ min: 1, max: 5 }));
      
      let totalAmount = 0;
      const salesItemsData = itemsToSell.map((v) => {
        const qty = faker.number.int({ min: 1, max: 10 });
        const subtotal = qty * v.retailPrice;
        totalAmount += subtotal;
        return {
          variantId: v.id,
          warehouseId: warehouse.id,
          quantity: qty,
          unitPrice: v.retailPrice,
          subtotal: subtotal,
        };
      });

      const salesInvoice = await prisma.salesInvoice.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          invoiceNumber: `INV-${currentInvNumber++}`,
          subtotal: totalAmount,
          totalAmount: totalAmount,
          issuedAt: currentDate,
          createdAt: currentDate,
          items: {
            create: salesItemsData,
          },
        },
      });

      // Update Inventory
      for (const item of salesItemsData) {
        await prisma.inventoryStock.updateMany({
          where: { variantId: item.variantId, warehouseId: warehouse.id },
          data: { physicalQty: { decrement: item.quantity } },
        });
      }

      // Record Customer Transaction and Payment
      const paidAmount = faker.helpers.arrayElement([totalAmount, totalAmount * 0.5, totalAmount]); // biased towards full payment
      
      await prisma.customerTransaction.create({
        data: {
          customerId: customer.id,
          type: 'DEBIT',
          amount: totalAmount,
          runningBalance: totalAmount, 
          referenceId: salesInvoice.id,
          date: currentDate,
        },
      });

      if (paidAmount > 0) {
        await prisma.customerPayment.create({
          data: {
            customerId: customer.id,
            amount: paidAmount,
            method: 'CASH',
            referenceId: salesInvoice.id,
            date: currentDate,
          },
        });
        await prisma.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'CREDIT',
            amount: paidAmount,
            runningBalance: totalAmount - paidAmount,
            referenceId: salesInvoice.id,
            date: currentDate,
          },
        });
        await prisma.treasuryTransaction.create({
          data: {
            accountId: treasury.id,
            type: 'IN',
            amount: paidAmount,
            description: `Payment for ${salesInvoice.invoiceNumber}`,
            date: currentDate,
            createdAt: currentDate,
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: treasury.id },
          data: { balance: { increment: paidAmount } },
        });
      }

      // If there's a remaining balance, create an InstallmentPlan
      const remainingBalance = totalAmount - paidAmount;
      if (remainingBalance > 0 && faker.datatype.boolean()) {
        const months = faker.number.int({ min: 2, max: 6 });
        const installmentAmount = remainingBalance / months;

        const plan = await prisma.installmentPlan.create({
          data: {
            companyId: company.id,
            customerId: customer.id,
            totalAmount: remainingBalance,
            numberOfMonths: months,
            startDate: currentDate,
            createdAt: currentDate,
          },
        });

        const installmentsData: any[] = [];
        for (let i = 1; i <= months; i++) {
          const dueDate = new Date(currentDate.getTime() + i * 30 * 24 * 60 * 60 * 1000);
          installmentsData.push({
            planId: plan.id,
            installmentNumber: i,
            amount: installmentAmount,
            dueDate: dueDate,
            status: dueDate < new Date() ? 'OVERDUE' : 'PENDING',
            createdAt: currentDate,
          });
        }

        await prisma.installment.createMany({
          data: installmentsData,
        });
      }
    }
    
    if (day % 30 === 0 && day > 0) {
      console.log(`...Generated month ${Math.floor(day/30)}`);
    }
  }

  console.log('Shifting dates for Stagnant Inventory...');
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 90);
  
  // Pick 5 random variants to make stagnant
  const stagnantVariants = faker.helpers.arrayElements(variants, 5);
  for (const v of stagnantVariants) {
    await prisma.inventoryStock.updateMany({
      where: { variantId: v.id, warehouseId: warehouse.id },
      data: { lastUpdated: oldDate }
    });
  }

  console.log('Seed completed successfully!');
  console.log('====================================');
  console.log(`Login Email: ${adminEmail}`);
  console.log(`Login Password: password123`);
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
