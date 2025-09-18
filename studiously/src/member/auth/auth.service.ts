import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { Request } from 'express';
import { TokenBlacklistService } from './token_blacklist.service';
import { LoginDTO } from '../dtos/login.dto';
import { MemberService } from '../member.service';
import { CreateUserDTO } from '../dtos/createUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private memberService: MemberService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}
  async signUp(myobj: CreateUserDTO): Promise<number> {
    myobj.password = await bcrypt.hash(myobj.password, 12);
    return await this.memberService.Create_Signup(myobj);
  }
  async signIn(logindata: LoginDTO): Promise<{ access_token: string }> {
    const user = await this.memberService.Login(logindata);
    if (!user) {
      throw new UnauthorizedException('Email is incorrect');
    }
    if (!(await bcrypt.compare(logindata.password, user.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    const payload = logindata;
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async logout(email: string, token: string): Promise<any> {
    try {
      // Blacklist the token
      const decision = await this.tokenBlacklistService.addToBlacklist(
        email,
        token,
      );

      if (decision != null) {
        return decision;
      } else {
        throw new InternalServerErrorException(
          'Problem in Token Blacklist Service',
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `logout AuthService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async UpdatePassword(req: Request, password: string): Promise<boolean> {
    try {
      password = await bcrypt.hash(password, 12);
      const decision = await this.memberService.Update_Password(req, password);
      if (decision !== null) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `UpdatePassword AuthService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async destroy_temporary_JWT(req: Request): Promise<boolean> {
    try {
      const token = this.extractTokenFromHeader(req);

      const user = await this.memberService.get_user_from_Request(req);

      // Blacklist the token
      const decision = await this.tokenBlacklistService.addToBlacklist(
        user.email,
        token!,
      );

      if (decision != null) {
        return decision;
      } else {
        throw new InternalServerErrorException(
          'Problem in Token Blacklist Service',
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `destroy_temporary_JWT AuthService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }
}
