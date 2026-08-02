import { Module } from '@nestjs/common';
import { StockTransactionsService } from './stock-transactions.service';
import { StockTransactionsController } from './stock-transactions.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StockTransactionsController],
  providers: [StockTransactionsService],
})
export class StockTransactionsModule {}
