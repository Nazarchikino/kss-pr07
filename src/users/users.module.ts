import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // сервіс доступний модулям, що імпортують UsersModule
})
export class UsersModule {}
