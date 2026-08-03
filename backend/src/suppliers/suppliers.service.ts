import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const { openingBalance, ...supplierData } = data;
    const code = `SUP-${Date.now().toString().slice(-6)}`;

    const existing = await this.prisma.supplier.findFirst({
      where: { companyId, name: supplierData.name },
    });
    if (existing) {
      throw new ConflictException('يوجد مورد بنفس الاسم بالفعل');
    }

    return this.prisma.$transaction(async (prisma) => {
      const supplier = await prisma.supplier.create({
        data: { ...supplierData, code, companyId },
      });

      if (openingBalance && openingBalance > 0) {
        await prisma.supplierTransaction.create({
          data: {
            supplierId: supplier.id,
            type: 'PURCHASE', // PURCHASE increases what we owe the supplier
            amount: openingBalance,
            runningBalance: openingBalance,
            reason: 'رصيد افتتاحي',
          },
        });
      }

      return supplier;
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
      const [total, suppliersList] = await Promise.all([
        this.prisma.supplier.count({ where }),
        this.prisma.supplier.findMany({
          where,
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 1,
            },
            installmentPlans: {
              where: { status: 'ACTIVE' },
              include: { installments: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const data = suppliersList.map((s: any) => {
        const balance =
          s.transactions.length > 0 ? s.transactions[0].runningBalance : 0;
        
        let installmentType = 'CREDIT';
        if (s.installmentPlans && s.installmentPlans.length > 0) {
          const allInsts = s.installmentPlans.flatMap((p: any) => p.installments || []);
          if (allInsts.some((i: any) => i.dueDate === null || i.dueDate === undefined)) {
            installmentType = 'UNDATED';
          } else if (allInsts.length > 0) {
            installmentType = 'DATED';
          }
        }

        const { transactions, installmentPlans, ...rest } = s;
        return { ...rest, balance, installmentType };
      });

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        installmentPlans: {
          where: { status: 'ACTIVE' },
          include: { installments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return suppliers.map((s: any) => {
      const balance =
        s.transactions.length > 0 ? s.transactions[0].runningBalance : 0;
      
      let installmentType = 'CREDIT';
      if (s.installmentPlans && s.installmentPlans.length > 0) {
        const allInsts = s.installmentPlans.flatMap((p: any) => p.installments || []);
        if (allInsts.some((i: any) => i.dueDate === null || i.dueDate === undefined)) {
          installmentType = 'UNDATED';
        } else if (allInsts.length > 0) {
          installmentType = 'DATED';
        }
      }

      const { transactions, installmentPlans, ...rest } = s;
      return { ...rest, balance, installmentType };
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.supplier.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.supplier.deleteMany({
      where: { id, companyId },
    });
  }
}
