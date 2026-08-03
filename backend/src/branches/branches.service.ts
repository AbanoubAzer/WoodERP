import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.branch.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
    });
  }

  async findOne(companyId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId },
    });
    if (!branch) throw new NotFoundException('الفرع غير موجود');
    return branch;
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }

  async activate(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.branch.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async deactivate(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.branch.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
