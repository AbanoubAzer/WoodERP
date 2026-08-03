import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, data: any) {
    return this.prisma.category.create({
      data: { ...data, companyId },
    });
  }

  findAll(companyId: string) {
    return this.prisma.category.findMany({
      where: { companyId },
      include: { parent: true, children: true },
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.category.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.category.deleteMany({
      where: { id, companyId },
    });
  }
}
