import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  createAccount(companyId: string, data: any) {
    return this.prisma.account.create({
      data: {
        companyId,
        code: data.code,
        name: data.name,
        type: data.type,
        parentId: data.parentId || null,
      },
    });
  }

  getAccounts(companyId: string) {
    return this.prisma.account.findMany({
      where: { companyId },
      include: { children: true },
      orderBy: { code: 'asc' },
    });
  }

  async createJournalEntry(companyId: string, data: any) {
    // Validate Debits == Credits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of data.lines) {
      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `قيد غير متزن. المدين: ${totalDebit}، الدائن: ${totalCredit}`,
      );
    }
    if (totalDebit <= 0) {
      throw new BadRequestException('يجب أن يكون إجمالي المبلغ أكبر من صفر');
    }

    return this.prisma.journalEntry.create({
      data: {
        companyId,
        date: data.date ? new Date(data.date) : new Date(),
        description: data.description,
        referenceId: data.referenceId,
        lines: {
          create: data.lines.map((l: any) => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit || 0),
            credit: parseFloat(l.credit || 0),
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  getJournalEntries(companyId: string) {
    return this.prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        lines: { include: { account: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createExpense(companyId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      // Create the expense record
      const expense = await prisma.expense.create({
        data: {
          companyId,
          accountId: data.accountId,
          amount: parseFloat(data.amount),
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          referenceNumber: data.referenceNumber,
        },
        include: { account: true },
      });

      // Find the "Cash" account for this company (assuming code '1001' or similar, we'll try to find a CASH type or default to first ASSET)
      // For simplicity in MVP, we require the client to send the "paymentAccountId"
      if (data.paymentAccountId) {
        await prisma.journalEntry.create({
          data: {
            companyId,
            date: expense.date,
            description: `Expense: ${expense.description}`,
            referenceId: expense.id,
            lines: {
              create: [
                {
                  accountId: expense.accountId, // Debit Expense
                  debit: expense.amount,
                  credit: 0,
                },
                {
                  accountId: data.paymentAccountId, // Credit Cash/Bank
                  debit: 0,
                  credit: expense.amount,
                },
              ],
            },
          },
        });
      }

      return expense;
    });
  }

  getExpenses(companyId: string) {
    return this.prisma.expense.findMany({
      where: { companyId },
      include: { account: true },
      orderBy: { date: 'desc' },
    });
  }
}
