import { Controller, Get, Body, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/company-settings')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  @Get()
  findOne(@CurrentTenant() companyId: string) {
    return this.companySettingsService.findOne(companyId);
  }

  @Patch()
  update(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.companySettingsService.update(companyId, data);
  }
}
