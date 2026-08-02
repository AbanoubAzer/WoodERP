import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierLedgerService {
  constructor(private prisma: PrismaService) {}

  async addTransaction(companyId: string, supplierId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, companyId }
      });
      if (!supplier) throw new BadRequestException('Supplier not found');

      // Get last transaction for balance
      const lastTx = await prisma.supplierTransaction.findFirst({
        where: { supplierId },
        orderBy: { date: 'desc' }
      });

      let currentBalance = lastTx ? lastTx.runningBalance : 0;
      let amount = parseFloat(data.amount);

      if (data.type === 'PURCHASE') {
        currentBalance += amount; // We owe them more
      } else if (data.type === 'PAYMENT' || data.type === 'RETURN') {
        currentBalance -= amount; // We paid them or returned items
      } else {
        throw new BadRequestException('Invalid transaction type');
      }

      const transaction = await prisma.supplierTransaction.create({
        data: {
          supplierId,
          type: data.type,
          amount,
          runningBalance: currentBalance,
          reason: data.reason,
          referenceId: data.referenceId
        }
      });

      return transaction;
    });
  }

  async getStatement(companyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId }
    });
    if (!supplier) throw new BadRequestException('Supplier not found');

    const transactions = await this.prisma.supplierTransaction.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' }
    });

    return { supplier, transactions };
  }
}
