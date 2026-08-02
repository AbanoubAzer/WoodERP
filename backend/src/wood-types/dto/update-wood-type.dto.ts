import { PartialType } from '@nestjs/mapped-types';
import { CreateWoodTypeDto } from './create-wood-type.dto';

export class UpdateWoodTypeDto extends PartialType(CreateWoodTypeDto) {}
