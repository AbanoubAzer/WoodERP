import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { WoodTypesModule } from './wood-types/wood-types.module';
import { ProductsModule } from './products/products.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';
import { RolesModule } from './roles/roles.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockTransactionsModule } from './stock-transactions/stock-transactions.module';
import { CustomersModule } from './customers/customers.module';
import { CustomerLedgerModule } from './customer-ledger/customer-ledger.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SupplierLedgerModule } from './supplier-ledger/supplier-ledger.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { InstallmentsModule } from './installments/installments.module';
import { AccountingModule } from './accounting/accounting.module';
import { TreasuryModule } from './treasury/treasury.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BranchesModule,
    UsersModule,
    CategoriesModule,
    WoodTypesModule,
    ProductsModule,
    CompanySettingsModule,
    RolesModule,
    WarehousesModule,
    InventoryModule,
    StockTransactionsModule,
    CustomersModule,
    CustomerLedgerModule,
    SuppliersModule,
    SupplierLedgerModule,
    SalesModule,
    PurchasesModule,
    InstallmentsModule,
    AccountingModule,
    TreasuryModule,
    ReportsModule,
    NotificationsModule,
    SearchModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
