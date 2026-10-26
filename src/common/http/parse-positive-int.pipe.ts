import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';

const DIGITS_ONLY = /^\d+$/;

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const paramName = metadata.data ?? 'id';
    const parsed = Number(value);
    if (
      !DIGITS_ONLY.test(value) ||
      !Number.isSafeInteger(parsed) ||
      parsed < 1
    ) {
      throw new BadRequestException(
        `Параметр "${paramName}" має бути цілим числом ≥ 1`,
      );
    }
    return parsed;
  }
}
