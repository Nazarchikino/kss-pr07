import {
  createParamDecorator,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { RequestWithId } from '../common/http/request-id.middleware.js';
import type { User } from '../users/user.model.js';

export interface AuthRequest extends RequestWithId {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!req.user) {
      throw new UnauthorizedException('Користувача не автентифіковано');
    }
    return req.user;
  },
);
