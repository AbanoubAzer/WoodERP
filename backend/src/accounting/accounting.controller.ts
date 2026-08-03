import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('accounts')
  createAccount(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.accountingService.createAccount(companyId, data);
  }

  @Get('accounts')
  getAccounts(@CurrentTenant() companyId: string) {
    return this.accountingService.getAccounts(companyId);
  }

  @Post('journal')
  createJournalEntry(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.accountingService.createJournalEntry(companyId, data);
  }

  @Get('journal')
  getJournalEntries(@CurrentTenant() companyId: string) {
    return this.accountingService.getJournalEntries(companyId);
  }

  @Post('expenses')
  createExpense(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.accountingService.createExpense(companyId, data);
  }

  @Get('expenses')
  getExpenses(@CurrentTenant() companyId: string) {
    return this.accountingService.getExpenses(companyId);
  }
}
