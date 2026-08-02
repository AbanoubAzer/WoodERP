import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerLedgerDto } from './create-customer-ledger.dto';

export class UpdateCustomerLedgerDto extends PartialType(CreateCustomerLedgerDto) {}
