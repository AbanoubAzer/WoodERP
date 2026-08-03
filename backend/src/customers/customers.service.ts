import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async create(companyId: string, data: any) {
    const { openingBalance, ...customerData } = data;
    const code = `CUS-${Date.now().toString().slice(-6)}`;

    // Ensure phone/name uniqueness could be checked here
    const existing = await this.prisma.customer.findFirst({
      where: { companyId, name: customerData.name },
    });
    if (existing) {
      throw new ConflictException('يوجد عميل بنفس الاسم بالفعل');
    }
    

    return this.prisma.$transaction(async (prisma) => {
      const customer = await prisma.customer.create({
        data: { ...customerData, code, companyId },
      });

      if (openingBalance && openingBalance > 0) {
        await prisma.customerTransaction.create({
          data: {
            customerId: customer.id,
            type: 'DEBIT',
            amount: openingBalance,
            runningBalance: openingBalance,
            reason: 'Opening Balance',
          },
        });
      }

      return customer;
    });
  }

  async findAll(
    companyId: string,
    page?: number,
    limit?: number,
    search?: string,
    warehouseId?: string,
  ) {
    const where: any = { companyId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [total, customers] = await Promise.all([
        this.prisma.customer.count({ where }),
        this.prisma.customer.findMany({
          where,
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const data = customers.map((c) => {
        const balance =
          c.transactions.length > 0 ? c.transactions[0].runningBalance : 0;
        const { transactions, ...rest } = c;
        return { ...rest, balance };
      });

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const balance =
        c.transactions.length > 0 ? c.transactions[0].runningBalance : 0;
      const { transactions, ...rest } = c;
      return { ...rest, balance };
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.customer.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.customer.deleteMany({
      where: { id, companyId },
    });
  }
}
