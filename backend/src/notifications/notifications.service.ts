import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  getNotifications(companyId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { companyId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markAsRead(id: string, companyId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, companyId, userId },
      data: { isRead: true },
    });
  }

  async triggerLowStockAlerts(companyId: string) {
    // 1. Find all items with stock below their minimum level
    const lowStockItems = await this.prisma.inventoryStock.findMany({
      where: { companyId, physicalQty: { lt: 10 } }, // Assuming 10 is the hardcoded min for this MVP
      include: {
        variant: { include: { product: true } },
        warehouse: { include: { branch: true } },
      },
    });

    if (lowStockItems.length === 0)
      return { message: 'No low stock items found.' };

    // 2. Find all warehouse managers for this company
    const managers = await this.prisma.user.findMany({
      where: { companyId, role: { name: 'WAREHOUSE_MANAGER' } },
    });

    if (managers.length === 0)
      return { message: 'No warehouse managers to notify.' };

    let createdCount = 0;

    // 3. Create notifications for each manager for each item
    for (const item of lowStockItems) {
      for (const manager of managers) {
        // Check if an unread notification already exists to avoid spam
        const existing = await this.prisma.notification.findFirst({
          where: {
            companyId,
            userId: manager.id,
            relatedEntityId: item.id,
            isRead: false,
          },
        });

        if (!existing) {
          await this.prisma.notification.create({
            data: {
              companyId,
              userId: manager.id,
              title: 'تنبيه نقص مخزون',
              message: `المنتج ${item.variant.product.name} وصل إلى الحد الأدنى للمخزون في فرع ${item.warehouse.branch.name}. الكمية الحالية: ${item.physicalQty}`,
              type: 'WARNING',
              relatedEntityId: item.id,
            },
          });
          createdCount++;
        }
      }
    }

    return { message: `Generated ${createdCount} low stock notifications.` };
  }
}
