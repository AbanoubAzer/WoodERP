import { PartialType } from '@nestjs/mapped-types';
import { CreateTreasuryDto } from './create-treasury.dto';

export class UpdateTreasuryDto extends PartialType(CreateTreasuryDto) {}
