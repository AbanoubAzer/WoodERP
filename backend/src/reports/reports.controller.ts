import { Controller, Get, UseGuards, UseInterceptors, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardData(
    @CurrentTenant() companyId: string,
    @Query('locationId') locationId?: string,
    @Query('locationType') locationType?: string,
  ) {
    return this.reportsService.getDashboardData(companyId, locationId, locationType);
  }

  @Get('ar-aging')
  getArAgingReport(@CurrentTenant() companyId: string) {
    return this.reportsService.getArAgingReport(companyId);
  }

  @Get('ap-aging')
  getApAgingReport(@CurrentTenant() companyId: string) {
    return this.reportsService.getApAgingReport(companyId);
  }

  @Get('sales')
  getSalesReports(@CurrentTenant() companyId: string) {
    return this.reportsService.getSalesReports(companyId);
  }

  @Get('inventory')
  getInventoryReports(@CurrentTenant() companyId: string) {
    return this.reportsService.getInventoryReports(companyId);
  }

  @Get('customers')
  getCustomerReports(@CurrentTenant() companyId: string) {
    return this.reportsService.getCustomerReports(companyId);
  }

  @Get('suppliers')
  getSupplierReports(@CurrentTenant() companyId: string) {
    return this.reportsService.getSupplierReports(companyId);
  }

  @Get('customers/:id/statement')
  getCustomerStatement(@CurrentTenant() companyId: string, @Param('id') customerId: string) {
    return this.reportsService.getCustomerStatement(companyId, customerId);
  }
}
