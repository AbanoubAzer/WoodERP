import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierLedgerDto } from './create-supplier-ledger.dto';

export class UpdateSupplierLedgerDto extends PartialType(CreateSupplierLedgerDto) {}
