import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  createAccount(companyId: string, data: any) {
    return this.prisma.treasuryAccount.create({
      data: {
        companyId,
        name: data.name,
        type: data.type,
        branchId: data.branchId || null,
        balance: parseFloat(data.balance || 0),
        glAccountId: data.glAccountId || null,
      },
    });
  }

  getAccounts(companyId: string) {
    return this.prisma.treasuryAccount.findMany({
      where: { companyId },
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
  }

  async createTransfer(companyId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      const fromAcc = await prisma.treasuryAccount.findFirst({
        where: { id: data.fromAccountId, companyId },
      });
      const toAcc = await prisma.treasuryAccount.findFirst({
        where: { id: data.toAccountId, companyId },
      });

      if (!fromAcc || !toAcc) throw new BadRequestException('الحساب غير موجود');

      const amount = parseFloat(data.amount);
      if (amount <= 0)
        throw new BadRequestException('يجب أن يكون المبلغ أكبر من صفر');
      if (fromAcc.balance < amount)
        throw new BadRequestException('الرصيد غير كاف في الحساب المرسل');

      // 1. Decrease From
      const updatedFrom = await prisma.treasuryAccount.update({
        where: { id: fromAcc.id },
        data: { balance: { decrement: amount } },
      });
      await prisma.treasuryTransaction.create({
        data: {
          accountId: fromAcc.id,
          type: 'TRANSFER',
          amount: -amount,
          description: data.description,
        },
      });

      // 2. Increase To
      const updatedTo = await prisma.treasuryAccount.update({
        where: { id: toAcc.id },
        data: { balance: { increment: amount } },
      });
      await prisma.treasuryTransaction.create({
        data: {
          accountId: toAcc.id,
          type: 'TRANSFER',
          amount: amount,
          description: data.description,
        },
      });

      // 3. GL Entry if mapped
      if (fromAcc.glAccountId && toAcc.glAccountId) {
        await prisma.journalEntry.create({
          data: {
            companyId,
            description: `Internal Transfer: ${data.description}`,
            lines: {
              create: [
                { accountId: toAcc.glAccountId, debit: amount, credit: 0 },
                { accountId: fromAcc.glAccountId, debit: 0, credit: amount },
              ],
            },
          },
        });
      }

      return { updatedFrom, updatedTo };
    });
  }
}
