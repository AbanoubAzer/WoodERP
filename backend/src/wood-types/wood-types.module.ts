import { Module } from '@nestjs/common';
import { WoodTypesService } from './wood-types.service';
import { WoodTypesController } from './wood-types.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WoodTypesController],
  providers: [WoodTypesService],
})
export class WoodTypesModule {}
