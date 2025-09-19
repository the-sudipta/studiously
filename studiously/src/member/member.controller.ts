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
  Post,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  // UnauthorizedException,
  // BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtService } from '@nestjs/jwt';
import { MemberService } from './member.service';
import { AuthGuard } from './auth/auth.guard';
import { ForgetPasswordDTO } from './dtos/forgotPassword.dto';
import { OTP_ReceiverDTO } from './dtos/otpReceiver.dto';
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

  @Post('/forget_password')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  async Forget_Password(
    @Body() forgetPassword_DTO: ForgetPasswordDTO,
  ): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decision = await this.memberService.ForgetPassword(
        forgetPassword_DTO.email,
      );
      if (decision != false) {
        return decision;
      } else {
        throw new NotFoundException('Data not found');
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Forget_Password MemberController Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  @Post('/otp')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  async OTP_Verification(
    @Req() req: ExpressRequest,
    @Body() OTP_Object: OTP_ReceiverDTO,
  ): Promise<any> {
    // console.log('Request Headers:', req.headers);
    // eslint-disable-next-line no-useless-catch
    try {
      // console.log('User provided otp = ' + OTP_Object.otp);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decision = await this.memberService.otp_verification(
        req,
        OTP_Object.otp,
      );
      if (decision) {
        console.log('Returning True');
        return {
          success: true,
          message: 'OTP verification successful',
        };
      } else {
        console.log('Returning Error');
        throw new BadRequestException('OTP did not matched!');
      }
    } catch (e) {
      throw e;
    }
  }
}
