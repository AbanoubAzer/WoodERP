import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(companyId: string, q: string) {
    if (!q || q.length < 2)
      return {
        customers: [],
        products: [],
        invoices: [],
        suppliers: [],
        purchaseInvoices: [],
        categories: [],
        woodTypes: [],
        users: [],
      };

    const [
      customers,
      products,
      invoices,
      suppliers,
      purchaseInvoices,
      categories,
      woodTypes,
      users,
    ] = await Promise.all([
      // Search Customers
      this.prisma.customer.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true, phone: true },
      }),
      // Search Products (including variant SKU search)
      this.prisma.product.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            {
              variants: { some: { sku: { contains: q, mode: 'insensitive' } } },
            },
          ],
        },
        take: 5,
        select: { id: true, name: true, category: { select: { name: true } } },
      }),
      // Search Sales Invoices
      this.prisma.salesInvoice.findMany({
        where: {
          companyId,
          invoiceNumber: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          issuedAt: true,
          customer: { select: { name: true } },
        },
      }),
      // Search Suppliers
      this.prisma.supplier.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true, phone: true },
      }),
      // Search Purchase Invoices
      this.prisma.purchaseInvoice.findMany({
        where: {
          companyId,
          invoiceNumber: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          issuedAt: true,
          supplier: { select: { name: true } },
        },
      }),
      // Search Categories
      this.prisma.category.findMany({
        where: {
          companyId,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true },
      }),
      // Search Wood Types
      this.prisma.woodType.findMany({
        where: {
          companyId,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true },
      }),
      // Search Users
      this.prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      }),
    ]);

    return {
      customers,
      products,
      invoices,
      suppliers,
      purchaseInvoices,
      categories,
      woodTypes,
      users,
    };
  }
}
