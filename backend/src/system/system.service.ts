import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getCompanies() {
    return this.prisma.company.findMany({
      include: {
        users: {
          where: { isOwner: true },
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCompanyStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('الشركة غير موجودة');

    return this.prisma.company.update({
      where: { id },
      data: { status },
    });
  }
}
