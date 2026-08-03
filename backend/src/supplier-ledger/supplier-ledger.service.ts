import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierLedgerService {
  constructor(private prisma: PrismaService) {}

  async addTransaction(companyId: string, supplierId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, companyId },
      });
      if (!supplier) throw new BadRequestException('المورد غير موجود');

      // Get last transaction for balance
      const lastTx = await prisma.supplierTransaction.findFirst({
        where: { supplierId },
        orderBy: { date: 'desc' },
      });

      let currentBalance = lastTx ? lastTx.runningBalance : 0;
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) throw new BadRequestException('مبلغ غير صالح');

      if (data.type === 'PURCHASE' || data.type === 'DEBIT_ADJUSTMENT') {
        currentBalance += amount; // We owe them more
      } else if (data.type === 'PAYMENT' || data.type === 'RETURN' || data.type === 'CREDIT_ADJUSTMENT') {
        currentBalance -= amount; // We paid them or returned items
      } else {
        throw new BadRequestException('نوع الحركة غير صالح');
      }

      if ((data.type === 'PAYMENT' || data.type === 'RETURN') && data.treasuryAccountId) {
        await prisma.treasuryTransaction.create({
          data: {
            accountId: data.treasuryAccountId,
            type: 'WITHDRAWAL',
            amount,
            referenceId: `SUP-PAY-${supplierId.slice(0, 5)}`,
            description: data.reason || 'سداد / دفعة للمورد',
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: data.treasuryAccountId },
          data: { balance: { decrement: amount } },
        });
      } else if ((data.type === 'PURCHASE' || data.type === 'DEBIT_ADJUSTMENT') && data.treasuryAccountId) {
        await prisma.treasuryTransaction.create({
          data: {
            accountId: data.treasuryAccountId,
            type: 'DEPOSIT',
            amount,
            referenceId: `SUP-ADJ-${supplierId.slice(0, 5)}`,
            description: data.reason || 'تسوية مستحقات مورد',
          },
        });
        await prisma.treasuryAccount.update({
          where: { id: data.treasuryAccountId },
          data: { balance: { increment: amount } },
        });
      }

      const transaction = await prisma.supplierTransaction.create({
        data: {
          supplierId,
          type: data.type === 'DEBIT_ADJUSTMENT' ? 'PURCHASE' : (data.type === 'CREDIT_ADJUSTMENT' ? 'PAYMENT' : data.type),
          amount,
          runningBalance: currentBalance,
          reason: data.reason || (data.type === 'PAYMENT' ? 'سداد / دفعة للمورد' : 'تسوية مستحقات'),
          referenceId: data.referenceId,
          paymentMethodId: data.paymentMethodId || null,
        },
      });

      return transaction;
    });
  }

  async getStatement(companyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });
    if (!supplier) throw new BadRequestException('المورد غير موجود');

    const transactions = await this.prisma.supplierTransaction.findMany({
      where: { supplierId },
      include: { paymentMethod: true },
      orderBy: { date: 'asc' },
    });

    return { supplier, transactions };
  }
}
