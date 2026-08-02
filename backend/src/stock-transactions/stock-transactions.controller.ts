import { Controller, Post, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { StockTransactionsService } from './stock-transactions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/stock-transactions')
export class StockTransactionsController {
  constructor(private readonly stockTransactionsService: StockTransactionsService) {}

  @Post('receive')
  receive(@CurrentTenant() companyId: string, @Request() req: any, @Body() data: any) {
    return this.stockTransactionsService.receive(companyId, req.user.sub, data);
  }

  @Post('issue')
  issue(@CurrentTenant() companyId: string, @Request() req: any, @Body() data: any) {
    return this.stockTransactionsService.issue(companyId, req.user.sub, data);
  }

  @Post('transfer')
  transfer(@CurrentTenant() companyId: string, @Request() req: any, @Body() data: any) {
    return this.stockTransactionsService.transfer(companyId, req.user.sub, data);
  }
}
