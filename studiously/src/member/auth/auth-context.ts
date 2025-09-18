import { UserEntity } from '../entities/user.entity';

export type JwtPayloadLike = {
  email?: string;
  user?: { email?: string };
  sub?: string | number;
  iat?: number;
  exp?: number;
} & Record<string, unknown>;

export interface RequestAuthContext {
  token: string;
  email: string | null;
  isBlacklisted: boolean;
  user: UserEntity | null;
  payload: JwtPayloadLike | null;
  issuedAt?: number;
  expiresAt?: number;
  subject?: string;
}
