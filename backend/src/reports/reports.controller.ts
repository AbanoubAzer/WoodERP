import { Controller, Get, UseGuards, UseInterceptors,  Param,
  Query,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
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

  @Get('installments')
  @Get('profiles')
  getReportProfiles(
    @CurrentTenant() companyId: string,
    @Query('type') type?: string,
  ) {
    return this.reportsService.getReportProfiles(companyId, type);
  }

  @Post('profiles')
  saveReportProfile(
    @CurrentTenant() companyId: string,
    @Body() data: any,
  ) {
    return this.reportsService.saveReportProfile(companyId, data);
  }

  @Delete('profiles/:id')
  deleteReportProfile(
    @CurrentTenant() companyId: string,
    @Param('id') id: string,
  ) {
    return this.reportsService.deleteReportProfile(companyId, id);
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

  @Get('sales')
  getSalesReport(
    @CurrentTenant() companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport(companyId, startDate, endDate);
  }

  @Get('inventory-movements')
  getInventoryMovementsReport(
    @CurrentTenant() companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getInventoryMovementsReport(companyId, startDate, endDate);
  }

  @Get('inventory-movements/:variantId')
  getItemLedgerReport(
    @CurrentTenant() companyId: string,
    @Param('variantId') variantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getItemLedgerReport(companyId, variantId, startDate, endDate);
  }

  @Get('customers/:id/dispatch-history')
  getCustomerDispatchHistory(
    @CurrentTenant() companyId: string,
    @Param('id') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return this.reportsService.getCustomerDispatchHistory(companyId, customerId, p, l);
  }
}
