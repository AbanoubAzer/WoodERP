import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post('accounts')
  createAccount(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.treasuryService.createAccount(companyId, data);
  }

  @Get('accounts')
  getAccounts(@CurrentTenant() companyId: string) {
    return this.treasuryService.getAccounts(companyId);
  }

  @Post('transfer')
  createTransfer(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.treasuryService.createTransfer(companyId, data);
  }
}
