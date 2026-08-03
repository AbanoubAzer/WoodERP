import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  getBalance(companyId: string, warehouseId?: string, variantId?: string) {
    const where: any = { companyId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (variantId) where.variantId = variantId;

    return this.prisma.inventoryStock.findMany({
      where,
      include: {
        warehouse: true,
        location: true,
        variant: {
          include: { product: true },
        },
      },
    });
  }
}
