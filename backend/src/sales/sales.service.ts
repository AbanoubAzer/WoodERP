import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(companyId: string, data: any, userId?: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Validate Customer
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, companyId },
      });
      if (!customer) throw new BadRequestException('العميل غير موجود');

      // 2. Validate Inventory & Calculate Totals
      let subtotal = 0;
      for (const item of data.items) {
        const stock = await prisma.inventoryStock.findFirst({
          where: {
            companyId,
            warehouseId: item.warehouseId,
            variantId: item.variantId,
          },
        });

        if (!stock || stock.physicalQty < item.quantity) {
          throw new BadRequestException(`رصيد غير كاف للصنف ${item.variantId}`);
        }

        subtotal += item.quantity * item.unitPrice;
      }

      const totalAmount =
        subtotal - (data.discount || 0) + (data.taxAmount || 0);

      // 3. Credit Check (unless CASH)
      if (customer.paymentTerms !== 'CASH') {
        const lastTx = await prisma.customerTransaction.findFirst({
          where: { customerId: customer.id },
          orderBy: { date: 'desc' },
        });
        const currentBalance = lastTx ? lastTx.runningBalance : 0;

        if (
          customer.creditLimit > 0 &&
          currentBalance + totalAmount > customer.creditLimit
        ) {
          throw new BadRequestException(
            `تم تجاوز الحد الائتماني. الرصيد الحالي: ${currentBalance}، الحد: ${customer.creditLimit}`,
          );
        }
      }

      // 4. Create Invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      const amountPaid = Number(data.amountPaid) || 0;

      const invoice = await prisma.salesInvoice.create({
        data: {
          companyId,
          warehouseId: data.warehouseId || null,
          customerId: customer.id,
          invoiceNumber,
          subtotal,
          discount: data.discount || 0,
          taxAmount: data.taxAmount || 0,
          totalAmount,
          amountPaid: data.amountPaid || 0,
          paymentMethodId: data.paymentMethodId || null,
          paymentReference: data.paymentReference || null,
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
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      // 5. Update Inventory & Movements
      for (const item of data.items) {
        await prisma.inventoryStock.updateMany({
          where: {
            companyId,
            warehouseId: item.warehouseId,
            variantId: item.variantId,
          },
          data: { physicalQty: { decrement: item.quantity } },
        });

        await prisma.stockMovement.create({
          data: {
            companyId,
            type: 'ISSUE_SALE',
            referenceId: invoice.id,
            variantId: item.variantId,
            quantity: item.quantity,
            fromWarehouseId: item.warehouseId,
            reason: `Sales Invoice ${invoiceNumber}`,
          },
        });
      }

      // 6. Update Customer Ledger
      const lastTx = await prisma.customerTransaction.findFirst({
        where: { customerId: customer.id },
        orderBy: { date: 'desc' },
      });
      const currentBalance = lastTx ? lastTx.runningBalance : 0;

      await prisma.customerTransaction.create({
        data: {
          customerId: customer.id,
          type: 'DEBIT', // Sales increase customer debt
          amount: totalAmount,
          runningBalance: currentBalance + totalAmount,
          referenceId: invoice.id,
          reason: `Sales Invoice ${invoiceNumber}`,
        },
      });

      let updatedBalance = currentBalance + totalAmount;

      // 7. Handle Down Payment (Amount Paid Now)
      if (amountPaid > 0 && data.treasuryAccountId) {
        // A. Credit Customer Ledger
        updatedBalance -= amountPaid;
        await prisma.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'CREDIT',
            amount: amountPaid,
            runningBalance: updatedBalance,
            referenceId: invoice.id,
            reason: `دفعة مقدمة للفاتورة ${invoiceNumber}`,
          },
        });

        // B. Deposit into Treasury
        const treasury = await prisma.treasuryAccount.findFirst({
          where: { id: data.treasuryAccountId, companyId },
        });
        if (treasury) {
          await prisma.treasuryTransaction.create({
            data: {
              accountId: treasury.id,
              type: 'DEPOSIT',
              amount: amountPaid,
              referenceId: invoice.id,
              description: `تحصيل مقدم فاتورة بيع ${invoiceNumber}`,
            },
          });
          // Update treasury balance
          await prisma.treasuryAccount.update({
            where: { id: treasury.id },
            data: { balance: { increment: amountPaid } },
          });
        }
      }

      // 8. Handle Installments
      if (data.createInstallments && data.installmentsCount > 0) {
        const remainingPrincipal = totalAmount - amountPaid;
        if (remainingPrincipal > 0) {
          const interestRate = Number(data.interestRate) || 0;
          const totalInterest = remainingPrincipal * (interestRate / 100);
          const totalWithInterest = remainingPrincipal + totalInterest;
          const installmentAmount = totalWithInterest / data.installmentsCount;

          // Note: If interest > 0, we must add another DEBIT to the customer for the interest amount
          if (totalInterest > 0) {
            updatedBalance += totalInterest;
            await prisma.customerTransaction.create({
              data: {
                customerId: customer.id,
                type: 'DEBIT',
                amount: totalInterest,
                runningBalance: updatedBalance,
                referenceId: invoice.id,
                reason: `فوائد تقسيط للفاتورة ${invoiceNumber}`,
              },
            });
          }

          // Create Installment Plan
          const plan = await prisma.installmentPlan.create({
            data: {
              companyId,
              customerId: customer.id,
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
                dueDate: inst.dueDate ? new Date(inst.dueDate) : null,
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
        { customer: { name: { contains: search, mode: 'insensitive' } } },
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
      this.prisma.salesInvoice.count({ where }),
      this.prisma.salesInvoice.findMany({
        where,
        include: {
          customer: true,
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
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            variant: { include: { product: true } },
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
