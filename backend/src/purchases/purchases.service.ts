import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(companyId: string, data: any, userId?: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Validate Supplier
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, companyId },
      });
      if (!supplier) throw new BadRequestException('المورد غير موجود');

      // 2. Calculate Totals
      let subtotal = 0;
      for (const item of data.items) {
        subtotal += item.quantity * item.unitCost;
      }

      const totalAmount =
        subtotal - (data.discount || 0) + (data.taxAmount || 0);

      // 3. Create Invoice
      const invoiceNumber =
        data.invoiceNumber ||
        `PINV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      const amountPaid = Number(data.amountPaid) || 0;

      const invoice = await prisma.purchaseInvoice.create({
        data: {
          companyId,
          warehouseId: data.warehouseId || null,
          supplierId: supplier.id,
          invoiceNumber,
          subtotal,
          discount: data.discount || 0,
          taxAmount: data.taxAmount || 0,
          totalAmount,
          amountPaid: data.amountPaid || 0,
          status:
            data.amountPaid >= totalAmount
              ? 'COMPLETED'
              : data.amountPaid > 0
                ? 'PARTIALLY_PAID'
                : 'PENDING',
          notes: data.notes,
          createdById: userId,
          items: {
            create: data.items.map((item: any) => ({
              variantId: item.variantId,
              warehouseId: item.warehouseId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.quantity * item.unitCost,
            })),
          },
        },
      });

      // 4. Update Inventory & Movements (INCREASE STOCK)
      for (const item of data.items) {
        // Upsert inventory stock
        const existingStock = await prisma.inventoryStock.findFirst({
          where: {
            companyId,
            warehouseId: item.warehouseId,
            variantId: item.variantId,
          },
        });

        if (existingStock) {
          await prisma.inventoryStock.update({
            where: { id: existingStock.id },
            data: { physicalQty: { increment: item.quantity } },
          });
        } else {
          await prisma.inventoryStock.create({
            data: {
              companyId,
              warehouseId: item.warehouseId,
              variantId: item.variantId,
              physicalQty: item.quantity,
            },
          });
        }

        await prisma.stockMovement.create({
          data: {
            companyId,
            type: 'RECEIVE_PURCHASE',
            referenceId: invoice.id,
            variantId: item.variantId,
            quantity: item.quantity,
            toWarehouseId: item.warehouseId,
            reason: `Purchase Invoice ${invoiceNumber}`,
          },
        });
      }

      // 5. Update Supplier Ledger
      const lastTx = await prisma.supplierTransaction.findFirst({
        where: { supplierId: supplier.id },
        orderBy: { date: 'desc' },
      });
      const currentBalance = lastTx ? lastTx.runningBalance : 0;

      await prisma.supplierTransaction.create({
        data: {
          supplierId: supplier.id,
          type: 'PURCHASE', // Purchases increase our debt to supplier
          amount: totalAmount,
          runningBalance: currentBalance + totalAmount,
          referenceId: invoice.id,
          reason: `Purchase Invoice ${invoiceNumber}`,
        },
      });

      let updatedBalance = currentBalance + totalAmount;

      // 6. Handle Down Payment (Amount Paid Now)
      if (amountPaid > 0 && data.treasuryAccountId) {
        // A. Debit Supplier Ledger (we paid them)
        updatedBalance -= amountPaid;
        await prisma.supplierTransaction.create({
          data: {
            supplierId: supplier.id,
            type: 'PAYMENT',
            amount: amountPaid,
            runningBalance: updatedBalance,
            referenceId: invoice.id,
            reason: `دفعة مقدمة لفاتورة ${invoiceNumber}`,
          },
        });

        // B. Withdraw from Treasury
        const treasury = await prisma.treasuryAccount.findFirst({
          where: { id: data.treasuryAccountId, companyId },
        });
        if (treasury) {
          await prisma.treasuryTransaction.create({
            data: {
              accountId: treasury.id,
              type: 'WITHDRAWAL',
              amount: amountPaid,
              referenceId: invoice.id,
              description: `صرف مقدم فاتورة شراء ${invoiceNumber}`,
            },
          });
          // Update treasury balance
          await prisma.treasuryAccount.update({
            where: { id: treasury.id },
            data: { balance: { decrement: amountPaid } },
          });
        }
      }

      // 7. Handle Installments
      if (data.createInstallments && data.installmentsCount > 0) {
        const remainingPrincipal = totalAmount - amountPaid;
        if (remainingPrincipal > 0) {
          const interestRate = Number(data.interestRate) || 0;
          const totalInterest = remainingPrincipal * (interestRate / 100);
          const totalWithInterest = remainingPrincipal + totalInterest;
          const installmentAmount = totalWithInterest / data.installmentsCount;

          if (totalInterest > 0) {
            updatedBalance += totalInterest;
            await prisma.supplierTransaction.create({
              data: {
                supplierId: supplier.id,
                type: 'PURCHASE', // Interest increases our debt
                amount: totalInterest,
                runningBalance: updatedBalance,
                referenceId: invoice.id,
                reason: `فوائد تقسيط لفاتورة ${invoiceNumber}`,
              },
            });
          }

          // Create Installment Plan
          const plan = await prisma.installmentPlan.create({
            data: {
              companyId,
              supplierId: supplier.id,
              totalAmount: totalWithInterest,
              numberOfMonths: data.installmentsCount,
              referenceInvoiceId: invoice.id,
              startDate: new Date(),
              status: 'ACTIVE',
            },
          });

          // Create Individual Installments
          const installmentsToCreate: any[] = [];

          if (data.customInstallments && data.customInstallments.length > 0) {
            data.customInstallments.forEach((inst, index) => {
              installmentsToCreate.push({
                planId: plan.id,
                installmentNumber: index + 1,
                amount: inst.amount,
                dueDate: new Date(inst.dueDate),
                status: 'PENDING',
              });
            });
          } else {
            // Fallback to old behavior
            const baseDate = data.firstInstallmentDate
              ? new Date(data.firstInstallmentDate)
              : new Date();
            for (let i = 1; i <= data.installmentsCount; i++) {
              const dueDate = new Date(baseDate);
              if (data.firstInstallmentDate) {
                dueDate.setMonth(dueDate.getMonth() + (i - 1));
              } else {
                dueDate.setMonth(dueDate.getMonth() + i);
              }

              installmentsToCreate.push({
                planId: plan.id,
                installmentNumber: i,
                amount: installmentAmount,
                dueDate,
                status: 'PENDING',
              });
            }
          }
          await prisma.installment.createMany({ data: installmentsToCreate });
        }
      }

      return invoice;
    });
  }

  async findAllInvoices(
    companyId: string,
    page = 1,
    limit = 50,
    search = '',
    locationId?: string,
    locationType?: string,
  ) {
    const where: any = { companyId };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (locationId) {
      if (locationType === 'BRANCH') {
        where.warehouse = { branchId: locationId };
      } else if (locationType === 'WAREHOUSE') {
        where.warehouseId = locationId;
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.purchaseInvoice.count({ where }),
      this.prisma.purchaseInvoice.findMany({
        where,
        include: {
          supplier: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneInvoice(companyId: string, id: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            variant: {
              include: { product: true },
            },
            warehouse: true,
          },
        },
      },
    });

    if (!invoice) return null;

    const installmentPlan = await this.prisma.installmentPlan.findFirst({
      where: { companyId, referenceInvoiceId: invoice.id },
      include: { installments: { orderBy: { installmentNumber: 'asc' } } },
    });

    return { ...invoice, installmentPlan };
  }
}
