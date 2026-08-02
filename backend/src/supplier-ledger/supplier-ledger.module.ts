import { Module } from '@nestjs/common';
import { SupplierLedgerService } from './supplier-ledger.service';
import { SupplierLedgerController } from './supplier-ledger.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SupplierLedgerController],
  providers: [SupplierLedgerService],
})
export class SupplierLedgerModule {}
