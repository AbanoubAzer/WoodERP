import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerLedgerService {
  constructor(private prisma: PrismaService) {}

  async addTransaction(companyId: string, customerId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!customer) throw new BadRequestException('العميل غير موجود');

      // Get last transaction for balance
      const lastTx = await prisma.customerTransaction.findFirst({
        where: { customerId },
        orderBy: { date: 'desc' },
      });

      let currentBalance = lastTx ? lastTx.runningBalance : 0;
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) throw new BadRequestException('مبلغ غير صالح');

      if (data.type === 'DEBIT') {
        if (
          customer.creditLimit > 0 &&
          currentBalance + amount > customer.creditLimit
        ) {
          throw new BadRequestException(
            `تم تجاوز الحد الائتماني! حد العميل هو ${customer.creditLimit}`,
          );
        }
        currentBalance += amount;
      } else if (data.type === 'CREDIT') {
        currentBalance -= amount;
      } else {
        throw new BadRequestException('نوع الحركة غير صالح');
      }

      if (data.type === 'CREDIT' && data.treasuryAccountId) {
        await prisma.treasuryTransaction.create({
          data: {
            accountId: data.treasuryAccountId,
            type: 'DEPOSIT',
            amount,
            referenceId: `ADV-${customerId.slice(0, 5)}`,
            description: data.reason || 'دفعة مقدمة / سداد عميل',
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: data.treasuryAccountId },
          data: { balance: { increment: amount } },
        });
      } else if (data.type === 'DEBIT' && data.treasuryAccountId) {
        await prisma.treasuryTransaction.create({
          data: {
            accountId: data.treasuryAccountId,
            type: 'WITHDRAWAL',
            amount,
            referenceId: `ADJ-${customerId.slice(0, 5)}`,
            description: data.reason || 'تسوية رصيد عميل',
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: data.treasuryAccountId },
          data: { balance: { decrement: amount } },
        });
      }

      if (data.type === 'CREDIT') {
        await prisma.customerPayment.create({
          data: {
            customerId,
            amount,
            method: data.method || 'CASH',
            paymentMethodId: data.paymentMethodId || null,
            referenceId: data.referenceId || 'ADVANCE',
          },
        });
      }

      const transaction = await prisma.customerTransaction.create({
        data: {
          customerId,
          type: data.type,
          amount,
          runningBalance: currentBalance,
          reason: data.reason || (data.type === 'CREDIT' ? 'دفعة مقدمة / سداد' : 'تسوية رصيد'),
          referenceId: data.referenceId,
          paymentMethodId: data.paymentMethodId || null,
        },
      });

      return transaction;
    });
  }

  async getStatement(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new BadRequestException('العميل غير موجود');

    const transactions = await this.prisma.customerTransaction.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
      include: {
        paymentMethod: true
      }
    });

    const pendingInstallments = await this.prisma.installment.findMany({
      where: {
        plan: { customerId },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      orderBy: { dueDate: 'asc' }
    });

    return { customer, transactions, pendingInstallments };
  }
}
