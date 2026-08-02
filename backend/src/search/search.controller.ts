import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  globalSearch(@CurrentTenant() companyId: string, @Query('q') query: string) {
    return this.searchService.globalSearch(companyId, query || '');
  }
}
