import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    // If variants are provided, we should calculate their volumes before saving
    const variantsData =
      data.variants?.map((v) => {
        // Auto calculate volume (Length * Width * Thickness) if dimensions exist
        if (v.length && v.width && v.thickness) {
          // Assume mm, volume in m3: (L * W * T) / 1,000,000,000
          v.volume = (v.length * v.width * v.thickness) / 1000000000;
        }
        return v;
      }) || [];

    return this.prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        woodTypeId: data.woodTypeId,
        brand: data.brand,
        description: data.description,
        baseUnit: data.baseUnit,
        companyId,
        variants: {
          create: variantsData,
        },
      },
      include: { variants: true, category: true, woodType: true },
    });
  }

  findAll(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId },
      include: { variants: true, category: true, woodType: true },
    });
  }

  update(companyId: string, id: string, data: any) {
    return this.prisma.product.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.product.deleteMany({
      where: { id, companyId },
    });
  }
}
