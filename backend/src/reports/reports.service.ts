import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardData(companyId: string, locationId?: string, locationType?: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    let salesWhere: any = { companyId, issuedAt: { gte: startOfMonth } };
    let purchasesWhere: any = { companyId, issuedAt: { gte: startOfMonth } };
    let treasuryWhere: any = { companyId };
    let inventoryWhere: any = { companyId };
    let customerWhere: any = { companyId };
    let supplierWhere: any = { companyId };
    let expenseWhere: any = { companyId, date: { gte: startOfMonth } };

    if (locationId) {
      if (locationType === 'BRANCH') {
        salesWhere.warehouse = { branchId: locationId };
        purchasesWhere.warehouse = { branchId: locationId };
        treasuryWhere.branchId = locationId;
        inventoryWhere.warehouse = { branchId: locationId };
        customerWhere = { companyId, warehouse: { branchId: locationId } };
        supplierWhere = { companyId, warehouse: { branchId: locationId } };
      } else if (locationType === 'WAREHOUSE') {
        salesWhere.warehouseId = locationId;
        purchasesWhere.warehouseId = locationId;
        // Treasury accounts are linked to branches, not warehouses
        inventoryWhere.warehouseId = locationId;
        customerWhere = { companyId, warehouseId: locationId };
        supplierWhere = { companyId, warehouseId: locationId };
      }
    }

    // Sales
    const salesAgg = await this.prisma.salesInvoice.aggregate({
      where: salesWhere,
      _sum: { totalAmount: true }
    });

    // Purchases
    const purchasesAgg = await this.prisma.purchaseInvoice.aggregate({
      where: purchasesWhere,
      _sum: { totalAmount: true }
    });

    // Expenses
    const expensesAgg = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true }
    });

    // Receivables (Debits - Credits)
    const customerDebits = await this.prisma.customerTransaction.aggregate({
      where: { customer: customerWhere, type: 'DEBIT' },
      _sum: { amount: true }
    });
    const customerCredits = await this.prisma.customerTransaction.aggregate({
      where: { customer: customerWhere, type: 'CREDIT' },
      _sum: { amount: true }
    });
    const receivables = (customerDebits._sum.amount || 0) - (customerCredits._sum.amount || 0);

    // Payables (Purchases - Payments)
    const supplierPurchases = await this.prisma.supplierTransaction.aggregate({
      where: { supplier: supplierWhere, type: 'PURCHASE' },
      _sum: { amount: true }
    });
    const supplierPayments = await this.prisma.supplierTransaction.aggregate({
      where: { supplier: supplierWhere, type: { in: ['PAYMENT', 'RETURN'] } },
      _sum: { amount: true }
    });
    const payables = (supplierPurchases._sum.amount || 0) - (supplierPayments._sum.amount || 0);

    // Cash Position
    const treasury = await this.prisma.treasuryAccount.aggregate({
      where: treasuryWhere,
      _sum: { balance: true }
    });

    // Inventory Total
    const inventory = await this.prisma.inventoryStock.aggregate({
      where: inventoryWhere,
      _sum: { physicalQty: true }
    });

    // Sales Trend (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInvoices = await this.prisma.salesInvoice.findMany({
      where: { ...salesWhere, issuedAt: { gte: thirtyDaysAgo } },
      select: { issuedAt: true, totalAmount: true },
      orderBy: { issuedAt: 'asc' }
    });

    const salesTrend = recentInvoices.reduce((acc, inv) => {
      const d = inv.issuedAt.toISOString().split('T')[0];
      acc[d] = (acc[d] || 0) + inv.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const trendData = Object.keys(salesTrend).map(date => ({
      date,
      sales: salesTrend[date]
    }));

    // Recent Activity (Customer Transactions)
    const recentActivity = await this.prisma.customerTransaction.findMany({
      where: { customer: customerWhere },
      include: { customer: true },
      orderBy: { date: 'desc' },
      take: 50
    });

    const today = new Date();
    const overdueInstallments = await this.prisma.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
        plan: {
          companyId,
          OR: [
            { customer: customerWhere },
            { supplier: supplierWhere }
          ]
        }
      },
      include: {
        plan: {
          include: {
            customer: true,
            supplier: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Stagnant Inventory
    const stagnantDate = new Date();
    stagnantDate.setDate(stagnantDate.getDate() - 60);
    const stagnantInventory = await this.prisma.inventoryStock.findMany({
      where: { ...inventoryWhere, lastUpdated: { lt: stagnantDate }, physicalQty: { gt: 0 } },
      include: { variant: { include: { product: true } } },
      orderBy: { lastUpdated: 'asc' },
      take: 50
    });

    // Upcoming Installments (Customer)
    const upcomingInstallments = await this.prisma.installment.findMany({
      where: {
        plan: { customer: customerWhere },
        status: { not: 'PAID' }
      },
      include: { plan: { include: { customer: true } } },
      orderBy: { dueDate: 'asc' },
      take: 50
    });

    // Upcoming Installments (Supplier)
    const supplierInstallments = await this.prisma.installment.findMany({
      where: {
        plan: { supplier: supplierWhere },
        status: { not: 'PAID' }
      },
      include: { plan: { include: { supplier: true } } },
      orderBy: { dueDate: 'asc' },
      take: 50
    });

    // Recent Transfers
    let transferWhere: any = { companyId, type: 'TRANSFER' };
    if (locationId) {
      if (locationType === 'BRANCH') {
        transferWhere.OR = [
          { fromWarehouse: { branchId: locationId } },
          { toWarehouse: { branchId: locationId } }
        ];
      } else if (locationType === 'WAREHOUSE') {
        transferWhere.OR = [
          { fromWarehouseId: locationId },
          { toWarehouseId: locationId }
        ];
      }
    }
    const recentTransfers = await this.prisma.stockMovement.findMany({
      where: transferWhere,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        variant: { include: { product: true } },
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return {
      salesTotal: salesAgg._sum.totalAmount || 0,
      purchasesTotal: purchasesAgg._sum.totalAmount || 0,
      expensesTotal: expensesAgg._sum.amount || 0,
      receivables,
      payables,
      cashPosition: treasury._sum.balance || 0,
      inventoryTotal: inventory._sum.physicalQty || 0,
      salesTrend: trendData,
      recentActivity,
      overdueInstallments,
      stagnantInventory,
      upcomingInstallments,
      supplierInstallments,
      recentTransfers
    };
  }

  async getArAgingReport(companyId: string) {
    // Get all pending and partial customer installments
    const installments = await this.prisma.installment.findMany({
      where: {
        plan: { companyId, customerId: { not: null } },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: { plan: { include: { customer: true } } }
    });

    const report = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
      totalOverdue: 0,
      customers: {} as Record<string, any>
    };

    const now = new Date();

    installments.forEach(inst => {
      const remaining = inst.amount - inst.paidAmount;
      if (remaining <= 0) return;

      const customer = inst.plan.customer!;
      if (!report.customers[customer.id]) {
        report.customers[customer.id] = {
          name: customer.name,
          phone: customer.phone,
          '0-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0,
          total: 0
        };
      }

      if (inst.dueDate && inst.dueDate < now) {
        report?.totalOverdue += remaining;
        report.customers[customer.id].total += remaining;

        const diffTime = Math.abs(now.getTime() - inst.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          report['0-30'] += remaining;
          report.customers[customer.id]['0-30'] += remaining;
        } else if (diffDays <= 60) {
          report['31-60'] += remaining;
          report.customers[customer.id]['31-60'] += remaining;
        } else if (diffDays <= 90) {
          report['61-90'] += remaining;
          report.customers[customer.id]['61-90'] += remaining;
        } else {
          report['90+'] += remaining;
          report.customers[customer.id]['90+'] += remaining;
        }
      }
    });

    return {
      summary: {
        '0-30': report['0-30'],
        '31-60': report['31-60'],
        '61-90': report['61-90'],
        '90+': report['90+'],
        totalOverdue: report?.totalOverdue
      },
      customers: Object.values(report.customers)
    };
  }

  async getApAgingReport(companyId: string) {
    const installments = await this.prisma.installment.findMany({
      where: {
        plan: { companyId, supplierId: { not: null } },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: { plan: { include: { supplier: true } } }
    });

    const report = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
      totalOverdue: 0,
      suppliers: {} as Record<string, any>
    };

    const now = new Date();

    installments.forEach(inst => {
      const remaining = inst.amount - inst.paidAmount;
      if (remaining <= 0) return;

      const supplier = inst.plan.supplier!;
      if (!report.suppliers[supplier.id]) {
        report.suppliers[supplier.id] = {
          name: supplier.name,
          phone: supplier.phone,
          '0-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0,
          total: 0
        };
      }

      if (inst.dueDate && inst.dueDate < now) {
        report?.totalOverdue += remaining;
        report.suppliers[supplier.id].total += remaining;

        const diffTime = Math.abs(now.getTime() - inst.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          report['0-30'] += remaining;
          report.suppliers[supplier.id]['0-30'] += remaining;
        } else if (diffDays <= 60) {
          report['31-60'] += remaining;
          report.suppliers[supplier.id]['31-60'] += remaining;
        } else if (diffDays <= 90) {
          report['61-90'] += remaining;
          report.suppliers[supplier.id]['61-90'] += remaining;
        } else {
          report['90+'] += remaining;
          report.suppliers[supplier.id]['90+'] += remaining;
        }
      }
    });

    return {
      summary: {
        '0-30': report['0-30'],
        '31-60': report['31-60'],
        '61-90': report['61-90'],
        '90+': report['90+'],
        totalOverdue: report?.totalOverdue
      },
      suppliers: Object.values(report.suppliers)
    };
  }

  async getSalesReports(companyId: string) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: { companyId },
      include: { customer: true },
      orderBy: { issuedAt: 'desc' },
      take: 500
    });
    return { data: invoices };
  }

  async getInventoryReports(companyId: string) {
    const stock = await this.prisma.inventoryStock.findMany({
      where: { companyId },
      include: { variant: { include: { product: true } }, warehouse: true }
    });
    return { data: stock };
  }

  async getCustomerReports(companyId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { companyId },
      include: { transactions: { orderBy: { date: 'desc' }, take: 50 } }
    });
    return { data: customers };
  }

  async getSupplierReports(companyId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { companyId },
      include: { transactions: { orderBy: { date: 'desc' }, take: 50 } }
    });
    return { data: suppliers };
  }

  async getCustomerStatement(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId, companyId },
    });

    if (!customer) throw new Error('Customer not found');

    const transactions = await this.prisma.customerTransaction.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
      include: { paymentMethod: true }
    });

    const invoiceIds = transactions.filter(t => t.type === 'DEBIT' && t.referenceId).map(t => t.referenceId);

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { id: { in: invoiceIds as string[] } },
      include: {
        paymentMethod: true,
        items: {
          include: { variant: { include: { product: true } } }
        }
      }
    });

    const invoiceMap = new Map(invoices.map(inv => [inv.id, inv]));

    const allCustomerInvoices = await this.prisma.salesInvoice.findMany({
      where: { customerId },
      select: { id: true, invoiceNumber: true }
    });
    const customerInvoiceMap = new Map(allCustomerInvoices.map(inv => [inv.id, inv.invoiceNumber]));

    const plans = await this.prisma.installmentPlan.findMany({
      where: { customerId }
    });

    const defaultInvoiceNumber = allCustomerInvoices.length === 1
      ? allCustomerInvoices[0].invoiceNumber
      : (plans.find(p => p.referenceInvoiceId && customerInvoiceMap.has(p.referenceInvoiceId))
        ? customerInvoiceMap.get(plans.find(p => p.referenceInvoiceId && customerInvoiceMap.has(p.referenceInvoiceId))!.referenceInvoiceId!)
        : (allCustomerInvoices.length > 0 ? allCustomerInvoices[allCustomerInvoices.length - 1].invoiceNumber : ''));

    const statementLines = transactions.map(t => {
      if (t.type === 'DEBIT' && t.referenceId) {
        const inv = invoiceMap.get(t.referenceId);
        if (inv) {
          return {
            id: t.id,
            date: t.date,
            description: `فاتورة مبيعات ${inv.invoiceNumber}`,
            invoiceNumber: inv.invoiceNumber,
            totalAmount: inv.totalAmount,
            amountPaid: inv.amountPaid,
            remainingBalance: inv.totalAmount - inv.amountPaid,
            items: inv.items.map(item => ({
              productName: item.variant.product.name,
              quantity: item.quantity,
              price: item.unitPrice,
              subtotal: item.subtotal
            })),
            value: t.amount,
            payment: 0,
            balance: t.runningBalance,
            paymentMethodName: inv.paymentMethod?.name || (inv.amountPaid >= inv.totalAmount ? 'نقدي' : inv.amountPaid > 0 ? 'دفع جزئي' : 'آجل / تقسيط'),
            paymentReference: inv.paymentReference
          };
        }
      }
      let formattedReason = t.reason
        ? t.reason
          .replace(/Payment for Installment #?(\d+)/gi, 'سداد قسط رقم #$1')
          .replace(/Payment for Installment/gi, 'سداد قسط')
          .replace(/Opening Balance/gi, 'رصيد افتتاحي')
          .replace(/Payment Receipt/gi, 'سند تحصيل / إيصال سداد')
          .replace(/Sales Invoice/gi, 'فاتورة مبيعات')
          .replace(/Purchase Invoice/gi, 'فاتورة مشتريات')
          .replace(/Down payment/gi, 'دفعة مقدمة')
          .replace(/Installment interest/gi, 'فوائد تقسيط')
        : (t.type === 'CREDIT' ? 'ايداع بنك/نقدي' : 'معاملة');

      if (formattedReason.includes('سداد قسط') && !formattedReason.includes('فاتورة رقم') && defaultInvoiceNumber) {
        formattedReason += ` (فاتورة رقم ${defaultInvoiceNumber})`;
      }

      return {
        id: t.id,
        date: t.date,
        description: formattedReason,
        items: [],
        value: t.type === 'DEBIT' ? t.amount : 0,
        payment: t.type === 'CREDIT' ? t.amount : 0,
        balance: t.runningBalance,
        paymentMethodName: t.paymentMethod?.name || (t.type === 'CREDIT' ? 'نقدي / تحصيل' : 'آجل'),
        paymentReference: t.paymentReference
      };
    });

    const pendingInstallments = await this.prisma.installment.findMany({
      where: {
        plan: { customerId },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      orderBy: { dueDate: 'asc' }
    });

    return { customer, statement: statementLines, pendingInstallments };
  }

  async getReportProfiles(companyId: string, type?: string) {
    return this.prisma.reportProfile.findMany({
      where: {
        companyId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveReportProfile(companyId: string, data: any) {
    return this.prisma.reportProfile.create({
      data: {
        companyId,
        name: data.name,
        type: data.type || 'CUSTOMER_ORDER',
        data: data.data,
      },
    });
  }

  async deleteReportProfile(companyId: string, id: string) {
    return this.prisma.reportProfile.delete({
      where: {
        id,
      },
    });
  }

  async getSalesReport(companyId: string, startDate?: string, endDate?: string) {
    const whereClause: any = { companyId };

    if (startDate || endDate) {
      whereClause.issuedAt = {};
      if (startDate) {
        whereClause.issuedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.issuedAt.lte = end;
      }
    }

    const invoices = await this.prisma.salesInvoice.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, code: true } },
        paymentMethod: true,
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    let totalSales = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const totalInvoices = invoices.length;

    const productsMap = new Map<string, { id: string, name: string, quantity: number, revenue: number }>();

    invoices.forEach(inv => {
      // Exclude cancelled from totals if needed, but standard is to include COMPLETED
      if (inv.status !== 'CANCELLED') {
        totalSales += inv.totalAmount;
        totalCollected += inv.amountPaid;
        totalOutstanding += (inv.totalAmount - inv.amountPaid);

        inv.items.forEach(item => {
          const prodName = `${item.variant.product.name} ${item.variant.sku ? `(${item.variant.sku})` : ''}`.trim();
          const prodId = item.variant.id;

          if (!productsMap.has(prodId)) {
            productsMap.set(prodId, { id: prodId, name: prodName, quantity: 0, revenue: 0 });
          }

          const p = productsMap.get(prodId)!;
          p.quantity += item.quantity;
          p.revenue += item.subtotal;
        });
      }
    });

    const topProducts = Array.from(productsMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      kpis: {
        totalSales,
        totalInvoices,
        totalCollected,
        totalOutstanding,
      },
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        issuedAt: inv.issuedAt,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        balance: inv.totalAmount - inv.amountPaid,
        status: inv.status,
        paymentMethodName: inv.paymentMethod?.name || (inv.amountPaid >= inv.totalAmount ? 'نقدي' : inv.amountPaid > 0 ? 'دفع جزئي' : 'آجل / تقسيط'),
        paymentReference: inv.paymentReference || ''
      })),
      topProducts
    };
  }

  async getInventoryMovementsReport(companyId: string, startDate?: string, endDate?: string) {
    const movementWhere: any = { companyId };
    if (startDate || endDate) {
      movementWhere.createdAt = {};
      if (startDate) movementWhere.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        movementWhere.createdAt.lte = end;
      }
    }

    const products = await this.prisma.productVariant.findMany({
      where: { product: { companyId } },
      include: {
        product: {
          include: { category: true }
        },
        stockMovements: {
          where: movementWhere
        },
        inventory: true
      }
    });

    const report = products.map(variant => {
      let inflow = 0;
      let outflow = 0;

      variant.stockMovements.forEach(m => {
        if (m.type === 'RECEIVE') {
          inflow += m.quantity;
        } else if (m.type === 'ISSUE') {
          outflow += m.quantity;
        } else if (m.type === 'ADJUST') {
          if (m.quantity > 0) inflow += m.quantity;
          else outflow += Math.abs(m.quantity);
        }
      });

      const currentStock = variant.inventory.reduce((sum, s) => sum + s.physicalQty, 0);

      return {
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        code: variant.sku,
        category: variant.product.category?.name || 'غير مصنف',
        inflow,
        outflow,
        currentStock,
        unit: variant.product.baseUnit || 'قطعة'
      };
    });

    return report;
  }

  async getItemLedgerReport(companyId: string, variantId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId, variantId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        customer: true,
        supplier: true
      }
    });

    return movements.map(m => ({
      id: m.id,
      date: m.createdAt,
      type: m.type,
      quantity: m.quantity,
      referenceId: m.referenceId,
      reason: m.reason,
      fromWarehouse: m.fromWarehouse?.name,
      toWarehouse: m.toWarehouse?.name,
      customerName: m.customer?.name,
      supplierName: m.supplier?.name
    }));
  }

  async getCustomerDispatchHistory(companyId: string, customerId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [total, movements] = await Promise.all([
      this.prisma.stockMovement.count({
        where: { companyId, customerId }
      }),
      this.prisma.stockMovement.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          variant: {
            include: { product: true }
          },
          fromWarehouse: true
        }
      })
    ]);

    return {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      movements: movements.map(m => ({
        id: m.id,
        date: m.createdAt,
        type: m.type,
        quantity: m.quantity,
        referenceId: m.referenceId,
        productName: m.variant.product.name,
        size: `${m.variant.thickness || '-'} x ${m.variant.width || '-'} x ${m.variant.length || '-'}`,
        warehouse: m.fromWarehouse?.name,
        reason: m.reason
      }))
    };
  }
}

