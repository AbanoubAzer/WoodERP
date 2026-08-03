import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  Delete,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.customersService.create(companyId, data);
  }

  @Get()
  findAll(
    @CurrentTenant() companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.customersService.findAll(
      companyId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      search,
      warehouseId,
    );
  }

  @Patch(':id')
  update(
    @CurrentTenant() companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.customersService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.customersService.remove(companyId, id);
  }
}
