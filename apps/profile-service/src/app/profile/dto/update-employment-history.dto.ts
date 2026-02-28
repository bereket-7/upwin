import { PartialType } from '@nestjs/mapped-types';
import { CreateEmploymentHistoryDto } from './create-employment-history.dto';

export class UpdateEmploymentHistoryDto extends PartialType(CreateEmploymentHistoryDto) { }
