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

      const transaction = await prisma.customerTransaction.create({
        data: {
          customerId,
          type: data.type,
          amount,
          runningBalance: currentBalance,
          reason: data.reason,
          referenceId: data.referenceId,
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
