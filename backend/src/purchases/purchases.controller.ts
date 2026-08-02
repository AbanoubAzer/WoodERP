import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post('invoice')
  createInvoice(@CurrentTenant() companyId: string, @Body() data: any, @CurrentUser() user: any) {
    return this.purchasesService.createInvoice(companyId, data, user.sub);
  }

  @Get('invoices')
  findAllInvoices(
    @CurrentTenant() companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('locationType') locationType?: string,
  ) {
    return this.purchasesService.findAllInvoices(
      companyId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      search,
      locationId,
      locationType
    );
  }

  @Get('invoices/:id')
  findOneInvoice(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.purchasesService.findOneInvoice(companyId, id);
  }
}
