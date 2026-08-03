import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@CurrentTenant() companyId: string, @Body() data: any) {
    return this.usersService.create(companyId, data);
  }

  @Get()
  findAll(@CurrentTenant() companyId: string) {
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  findOne(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.usersService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.usersService.update(companyId, id, data);
  }

  @Patch(':id/activate')
  activate(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.usersService.activate(companyId, id);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentTenant() companyId: string, @Param('id') id: string) {
    return this.usersService.deactivate(companyId, id);
  }
}
