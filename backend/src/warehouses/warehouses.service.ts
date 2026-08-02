import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, data: any) {
    return this.prisma.warehouse.create({
      data: { ...data, companyId }
    });
  }

  findAll(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId },
      include: { branch: true, manager: true, locations: true }
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.warehouse.updateMany({
      where: { id, companyId },
      data
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.warehouse.deleteMany({
      where: { id, companyId }
    });
  }
}
