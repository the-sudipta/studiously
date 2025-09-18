import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../config/roles';

// --- Decorator (same file) ---
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// --- Minimal request shape (no Express import) ---
type ReqWithUser = { user?: { role?: Role } };

// --- Guard ---
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (!required.length) return true;

    const req = ctx.switchToHttp().getRequest<ReqWithUser>();
    const role = req?.user?.role;

    return !!role && required.includes(role);
  }
}
