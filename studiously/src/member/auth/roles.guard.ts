import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { Role } from '../../config/roles';
import { MemberService } from '../member.service';

// ----- decorator (unchanged) -----
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// ----- guard -----
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly members: MemberService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (!required.length) return true;

    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = await this.members.getAuthContextFromRequest(req); // verifies token etc. :contentReference[oaicite:0]{index=0}

    if (auth.isBlacklisted) {
      throw new ForbiddenException('Access token is blacklisted');
    }

    const userRole = auth.user?.role as Role | undefined;
    if (!userRole) {
      throw new ForbiddenException('User role not found');
    }

    const ok = required.includes(userRole);
    if (!ok) {
      throw new ForbiddenException('Forbidden resource');
    }
    return true;
  }
}
