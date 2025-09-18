import {
  Body,
  Controller,
  Get,
  HttpStatus,
  // InternalServerErrorException,
  // Post,
  // UseGuards,
  // UsePipes,
  // ValidationPipe,
  // Request,
  // Put,
  // NotFoundException,
  // UseInterceptors,
  // UploadedFile,
  // Res,
  Req,
  HttpCode,
  UseGuards,
  // UnauthorizedException,
  // BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtService } from '@nestjs/jwt';
import { MemberService } from './member.service';
import { AuthGuard } from './auth/auth.guard';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage, MulterError } from 'multer';

@Controller('api/member')
export class MemberController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly memberService: MemberService,
  ) {
    // Empty Constructor
  }

  @Get('/index')
  // @UseGuards(AuthGuard)
  // @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  getIndex(): any {
    return 'Relax! Member is Alive.';
  }

  @Get('/getService')
  // @UseGuards(AuthGuard)
  // @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  getService(): any {
    return this.memberService.get_service();
  }

  @Get('/access_token_validation')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateAccessToken(@Req() req: ExpressRequest) {
    const ctx = await this.memberService.getAuthContextFromRequest(req);

    return {
      message: 'Access Token Validation Complete',
      token: ctx.token,
      email: ctx.email!,
      iat: ctx.issuedAt,
      exp: ctx.expiresAt,
      subject: ctx.subject,
      blacklisted: ctx.isBlacklisted,
    };
  }
}
