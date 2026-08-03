import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentMethods(companyId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPaymentMethod(companyId: string, data: any) {
    return this.prisma.paymentMethod.create({
      data: {
        companyId,
        name: data.name,
        type: data.type || 'CASH',
        isActive: data.isActive !== undefined ? data.isActive : true,
        requiresReference: data.requiresReference || false
      }
    });
  }

  async updatePaymentMethod(companyId: string, id: string, data: any) {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new NotFoundException('Payment method not found');

    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        isActive: data.isActive,
        requiresReference: data.requiresReference
      }
    });
  }

  async deletePaymentMethod(companyId: string, id: string) {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new NotFoundException('Payment method not found');

    // Soft delete or hard delete? Let's just hard delete for now. 
    // In production, we might want to check if it's used before deleting, 
    // but the schema doesn't have a strict foreign key constraint yet on the invoice methods.
    return this.prisma.paymentMethod.delete({
      where: { id }
    });
  }
}
