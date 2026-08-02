import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockTransactionsService {
  constructor(private prisma: PrismaService) {}

  async receive(companyId: string, userId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Update or create stock balance
      const existingStock = await prisma.inventoryStock.findFirst({
        where: {
          warehouseId: data.warehouseId,
          locationId: data.locationId || null,
          variantId: data.variantId
        }
      });

      let stock;
      if (existingStock) {
        stock = await prisma.inventoryStock.update({
          where: { id: existingStock.id },
          data: { physicalQty: { increment: data.quantity } }
        });
      } else {
        stock = await prisma.inventoryStock.create({
          data: {
            companyId,
            warehouseId: data.warehouseId,
            locationId: data.locationId || null,
            variantId: data.variantId,
            physicalQty: data.quantity
          }
        });
      }

      // 2. Record Movement
      const movement = await prisma.stockMovement.create({
        data: {
          companyId,
          type: 'RECEIVE',
          variantId: data.variantId,
          quantity: data.quantity,
          toWarehouseId: data.warehouseId,
          reason: data.reason,
          referenceId: data.referenceId,
          userId
        }
      });

      return { stock, movement };
    });
  }

  async issue(companyId: string, userId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Check stock
      const stock = await prisma.inventoryStock.findFirst({
        where: {
          warehouseId: data.warehouseId,
          locationId: data.locationId || null,
          variantId: data.variantId
        }
      });

      if (!stock || stock.physicalQty < data.quantity) {
        throw new BadRequestException('Insufficient stock in this location');
      }

      // 2. Decrease stock
      const updatedStock = await prisma.inventoryStock.update({
        where: { id: stock.id },
        data: { physicalQty: { decrement: data.quantity } }
      });

      // 3. Record Movement
      const movement = await prisma.stockMovement.create({
        data: {
          companyId,
          type: 'ISSUE',
          variantId: data.variantId,
          quantity: data.quantity,
          fromWarehouseId: data.warehouseId,
          reason: data.reason,
          referenceId: data.referenceId,
          userId
        }
      });

      return { stock: updatedStock, movement };
    });
  }

  async transfer(companyId: string, userId: string, data: any) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check stock in source warehouse
      const sourceStock = await prisma.inventoryStock.findFirst({
        where: {
          warehouseId: data.fromWarehouseId,
          locationId: null,
          variantId: data.variantId
        }
      });

      if (!sourceStock || sourceStock.physicalQty < data.quantity) {
        throw new BadRequestException('Insufficient stock in the source warehouse');
      }

      // 2. Decrease stock in source warehouse
      await prisma.inventoryStock.update({
        where: { id: sourceStock.id },
        data: { physicalQty: { decrement: data.quantity } }
      });

      // 3. Upsert (Increase or Create) stock in destination warehouse
      const destStockExist = await prisma.inventoryStock.findFirst({
        where: {
          warehouseId: data.toWarehouseId,
          locationId: null,
          variantId: data.variantId
        }
      });

      let destinationStock;
      if (destStockExist) {
        destinationStock = await prisma.inventoryStock.update({
          where: { id: destStockExist.id },
          data: { physicalQty: { increment: data.quantity } }
        });
      } else {
        destinationStock = await prisma.inventoryStock.create({
          data: {
            companyId,
            warehouseId: data.toWarehouseId,
            locationId: null,
            variantId: data.variantId,
            physicalQty: data.quantity
          }
        });
      }

      // 4. Record Movement
      const movement = await prisma.stockMovement.create({
        data: {
          companyId,
          type: 'TRANSFER',
          variantId: data.variantId,
          quantity: data.quantity,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          reason: data.reason,
          userId
        }
      });

      return { sourceStock, destinationStock, movement };
    });
  }
}
