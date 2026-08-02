import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstallmentsService {
  constructor(private prisma: PrismaService) {}

  async createPlan(companyId: string, data: any) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: data.customerId, companyId }
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const totalAmount = parseFloat(data.totalAmount);
    const numberOfMonths = parseInt(data.numberOfMonths);
    if (totalAmount <= 0 || numberOfMonths <= 0) {
      throw new BadRequestException('Invalid amount or duration');
    }

    const startDate = new Date(data.startDate || Date.now());
    
    // Auto-generate installments (dividing totalAmount equally)
    // Note: The frontend can optionally pass a custom `installments` array. If provided, we use that.
    const installmentsData = data.installments || Array.from({ length: numberOfMonths }).map((_, i) => {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      return {
        installmentNumber: i + 1,
        dueDate,
        amount: totalAmount / numberOfMonths
      };
    });

    return this.prisma.installmentPlan.create({
      data: {
        companyId,
        customerId: customer.id,
        totalAmount,
        numberOfMonths,
        startDate,
        installments: {
          create: installmentsData.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            amount: parseFloat(inst.amount)
          }))
        }
      },
      include: {
        installments: true
      }
    });
  }

  async payInstallment(companyId: string, installmentId: string, data: any) {
    return this.prisma.$transaction(async (prisma) => {
      const installment = await prisma.installment.findUnique({
        where: { id: installmentId },
        include: { plan: { include: { customer: true } } }
      });

      if (!installment) throw new BadRequestException('Installment not found');
      if (installment.plan.companyId !== companyId) throw new BadRequestException('Unauthorized');
      if (installment.status === 'PAID') throw new BadRequestException('Installment is already paid in full');

      const payAmount = parseFloat(data.amount);
      if (payAmount <= 0) throw new BadRequestException('Invalid payment amount');

      const remaining = installment.amount - installment.paidAmount;
      if (payAmount > remaining) {
        throw new BadRequestException(`Cannot pay more than remaining amount: ${remaining}`);
      }

      const newPaidAmount = installment.paidAmount + payAmount;
      const newStatus = newPaidAmount >= installment.amount ? 'PAID' : 'PARTIAL';

      // Update Installment
      const updatedInstallment = await prisma.installment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });

      // Record Customer Payment
      const payment = await prisma.customerPayment.create({
        data: {
          customerId: installment.plan.customerId!,
          amount: payAmount,
          method: data.method || 'CASH',
          referenceId: `INST-${installment.installmentNumber}-${installment.plan.id.slice(0, 5)}`
        }
      });

      // Update Ledger (CREDIT reduces debt)
      const lastTx = await prisma.customerTransaction.findFirst({
        where: { customerId: installment.plan.customerId! },
        orderBy: { date: 'desc' }
      });
      const currentBalance = lastTx ? lastTx.runningBalance : 0;

      await prisma.customerTransaction.create({
        data: {
          customerId: installment.plan.customerId!,
          type: 'CREDIT',
          amount: payAmount,
          runningBalance: currentBalance - payAmount,
          referenceId: payment.id,
          reason: `Payment for Installment #${installment.installmentNumber}`
        }
      });

      // Check if plan is completed
      const allInstallments = await prisma.installment.findMany({
        where: { planId: installment.planId }
      });
      const allPaid = allInstallments.every(i => i.status === 'PAID' || (i.id === installment.id && newStatus === 'PAID'));
      if (allPaid) {
        await prisma.installmentPlan.update({
          where: { id: installment.planId },
          data: { status: 'COMPLETED' }
        });
      }

      return updatedInstallment;
    });
  }

  findAllPlans(companyId: string) {
    return this.prisma.installmentPlan.findMany({
      where: { companyId },
      include: { customer: true, supplier: true, installments: { orderBy: { installmentNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOnePlan(companyId: string, id: string) {
    return this.prisma.installmentPlan.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        supplier: true,
        installments: { orderBy: { installmentNumber: 'asc' } }
      }
    });
  }

  async updatePlanNotes(id: string, notes: string) {
    return this.prisma.installmentPlan.update({
      where: { id },
      data: { notes }
    });
  }

  async settlePlanEarly(planId: string, companyId: string, settlementAmount: number, treasuryAccountId?: string) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id: planId, companyId },
      include: {
        installments: true,
      }
    });
    
    if (!plan) throw new Error('Plan not found');
    if (plan.status === 'COMPLETED') throw new Error('Plan is already completed');

    const totalPaid = plan.installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const remainingAmount = plan.totalAmount - totalPaid;
    const writeOffAmount = remainingAmount - settlementAmount;

    // Mark all pending/partial installments as PAID
    await this.prisma.installment.updateMany({
      where: { planId, status: { not: 'PAID' } },
      data: {
        status: 'PAID',
        paidAmount: { set: 0 } // Just close them
      }
    });

    // Mark plan as completed
    await this.prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: 'COMPLETED' }
    });

    // Handle Treasury
    if (treasuryAccountId && settlementAmount > 0) {
      if (plan.customerId) {
        await this.prisma.treasuryTransaction.create({
          data: {
            accountId: treasuryAccountId,
            type: 'DEPOSIT',
            amount: settlementAmount,
            referenceId: `SETTLE-${planId.slice(0,5)}`,
            description: `تسوية مبكرة عميل / القسط #${plan.id}`
          }
        });
        await this.prisma.treasuryAccount.update({
          where: { id: treasuryAccountId },
          data: { balance: { increment: settlementAmount } }
        });
      } else if (plan.supplierId) {
        await this.prisma.treasuryTransaction.create({
          data: {
            accountId: treasuryAccountId,
            type: 'WITHDRAWAL',
            amount: settlementAmount,
            referenceId: `SETTLE-${planId.slice(0,5)}`,
            description: `تسوية مبكرة مورد / القسط #${plan.id}`
          }
        });
        await this.prisma.treasuryAccount.update({
          where: { id: treasuryAccountId },
          data: { balance: { decrement: settlementAmount } }
        });
      }
    }

    // Ledger handling
    if (plan.customerId) {
      const lastTx = await this.prisma.customerTransaction.findFirst({
        where: { customerId: plan.customerId },
        orderBy: { date: 'desc' }
      });
      let newBalance = (lastTx?.runningBalance || 0) - settlementAmount;
      
      await this.prisma.customerTransaction.create({
        data: {
          customerId: plan.customerId!,
          type: 'CREDIT',
          amount: settlementAmount,
          runningBalance: newBalance,
          referenceId: `تسوية مبكرة نقدا`
        }
      });
      
      if (writeOffAmount > 0) {
        newBalance -= writeOffAmount;
        await this.prisma.customerTransaction.create({
          data: {
            customerId: plan.customerId!,
            type: 'CREDIT',
            amount: writeOffAmount,
            runningBalance: newBalance,
            referenceId: `تسوية مبكرة خصم`
          }
        });
      }
    } else if (plan.supplierId) {
      const lastTx = await this.prisma.supplierTransaction.findFirst({
        where: { supplierId: plan.supplierId },
        orderBy: { date: 'desc' }
      });
      let newBalance = (lastTx?.runningBalance || 0) - settlementAmount;
      
      await this.prisma.supplierTransaction.create({
        data: {
          supplierId: plan.supplierId!,
          type: 'DEBIT',
          amount: settlementAmount,
          runningBalance: newBalance,
          referenceId: `تسوية مبكرة نقدا`
        }
      });
      
      if (writeOffAmount > 0) {
        newBalance -= writeOffAmount;
        await this.prisma.supplierTransaction.create({
          data: {
            supplierId: plan.supplierId!,
            type: 'DEBIT',
            amount: writeOffAmount,
            runningBalance: newBalance,
            referenceId: `تسوية مبكرة خصم`
          }
        });
      }
    }
  }
}
