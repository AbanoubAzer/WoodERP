import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, data: any) {
    return this.prisma.role.create({
      data: { ...data, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: { _count: { select: { users: true } } },
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.role.updateMany({
      where: { id, companyId, isDefault: false },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.role.deleteMany({
      where: { id, companyId, isDefault: false },
    });
  }
}
