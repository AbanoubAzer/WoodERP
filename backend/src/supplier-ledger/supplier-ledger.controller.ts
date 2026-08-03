import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SupplierLedgerService } from './supplier-ledger.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/supplier-ledger')
export class SupplierLedgerController {
  constructor(private readonly supplierLedgerService: SupplierLedgerService) {}

  @Post(':supplierId/transaction')
  addTransaction(
    @CurrentTenant() companyId: string,
    @Param('supplierId') supplierId: string,
    @Body() data: any,
  ) {
    return this.supplierLedgerService.addTransaction(
      companyId,
      supplierId,
      data,
    );
  }

  @Get(':supplierId/statement')
  getStatement(
    @CurrentTenant() companyId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.supplierLedgerService.getStatement(companyId, supplierId);
  }
}
