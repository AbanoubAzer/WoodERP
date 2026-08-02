import { Module } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
})
export class WarehousesModule {}
