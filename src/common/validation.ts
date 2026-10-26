import {
  UnprocessableEntityException,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';

export interface FieldError {
  field: string;
  message: string;
}

/** Перетворює дерево помилок class-validator на плоский список { field, message }. */
export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): FieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = Object.values(e.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    return [...own, ...flattenValidationErrors(e.children ?? [], field)];
  });
}

/**
 * Глобальний ValidationPipe:
 * whitelist – відкинути поля без декораторів; forbidNonWhitelisted – і повідомити про них;
 * transform – перетворити тіло/параметри на екземпляри класів DTO (і типи – через @Type).
 * Помилки – 422 з переліком полів (як у проєкті API практичної № 4).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        message: 'Дані не відповідають вимогам',
        errors: flattenValidationErrors(errors),
      }),
  });
}
