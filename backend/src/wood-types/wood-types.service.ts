import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WoodTypesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, data: any) {
    return this.prisma.woodType.create({
      data: { ...data, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.woodType.findMany({
      where: { companyId },
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.woodType.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.woodType.deleteMany({
      where: { id, companyId },
    });
  }
}
