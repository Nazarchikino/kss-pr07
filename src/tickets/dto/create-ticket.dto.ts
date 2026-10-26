import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { PRIORITIES, type Priority } from '../ticket.model.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTicketDto {
  @Transform(trim)
  @IsString()
  @Length(1, 80, { message: 'назва – від 1 до 80 символів' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsIn(PRIORITIES, { message: `пріоритет – одне з: ${PRIORITIES.join(', ')}` })
  priority: Priority;

  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}
