import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { CustomerLedgerService } from './customer-ledger.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/customer-ledger')
export class CustomerLedgerController {
  constructor(private readonly customerLedgerService: CustomerLedgerService) {}

  @Post(':customerId/transaction')
  addTransaction(
    @CurrentTenant() companyId: string,
    @Param('customerId') customerId: string,
    @Body() data: any
  ) {
    return this.customerLedgerService.addTransaction(companyId, customerId, data);
  }

  @Get(':customerId/statement')
  getStatement(
    @CurrentTenant() companyId: string,
    @Param('customerId') customerId: string
  ) {
    return this.customerLedgerService.getStatement(companyId, customerId);
  }
}
