import { Module } from '@nestjs/common';
import { CustomerLedgerService } from './customer-ledger.service';
import { CustomerLedgerController } from './customer-ledger.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomerLedgerController],
  providers: [CustomerLedgerService],
})
export class CustomerLedgerModule {}
