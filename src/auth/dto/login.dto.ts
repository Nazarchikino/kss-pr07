import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'вкажіть коректну адресу електронної пошти' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'пароль не може бути порожнім' })
  password: string;
}
