import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
// import { FileInterceptor } from "@nestjs/platform-express";
// import { MulterError, diskStorage } from "multer";
import * as bcrypt from 'bcrypt';
import { AuthGuard } from './auth.guard';
import { LoginDTO } from '../dtos/login.dto';
import { New_PasswordDTO } from '../dtos/newPassword.dto';
import { CreateUserDTO } from '../dtos/createUser.dto';

@Controller('api/member/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/index')
  // @UseGuards(SessionGuard)
  // @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  getIndex(): any {
    return 'Relax! Member Auth is working.';
  }

  @Post('/signup')
  // @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  async Signup(@Body() signup_info: CreateUserDTO): Promise<any> {
    try {
      const user_id: number = await this.authService.signUp(signup_info);
      if (user_id < 0) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Email Already Exists',
        });
      } else {
        return user_id;
      }
    } catch (e) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  @UsePipes(new ValidationPipe())
  async Login(@Body() login_info: LoginDTO): Promise<any> {
    return await this.authService.signIn(login_info);
  }

  @Get('/logout')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async Logout(@Request() req): Promise<any> {
    try {
      const email = (req as unknown as { user?: { email?: string } }).user
        ?.email;
      if (!email) {
        throw new UnauthorizedException('User not found on request');
      }

      const token = this.authService.extractTokenFromHeader(req);
      if (token != null && token != '') {
        return await this.authService.logout(email, token);
      } else {
        throw new BadRequestException(
          'Please provide the token inside header, along with the request',
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Logout AuthController Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  @Post('/change_password')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK) // Set the status code to 200 (OK)
  async Change_password(
    @Request() req,
    @Body()
    new_Password_Object_DTO: New_PasswordDTO,
  ): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('Request Headers:', req.headers);
    console.log('New Pass = ' + new_Password_Object_DTO.password);

    try {
      new_Password_Object_DTO.password = await bcrypt.hash(
        new_Password_Object_DTO.password,
        12,
      );
      const result = await this.authService.UpdatePassword(
        req,
        new_Password_Object_DTO.password,
      );
      if (result) {
        const decision = await this.authService.destroy_temporary_JWT(req);
        if (decision) {
          return true;
        } else {
          return new InternalServerErrorException(
            'Change_password AuthController issue = Temporary JWT could not be deleted',
          );
        }
      } else {
        return new InternalServerErrorException(
          'Change_password AuthController issue = Failed to Updated password',
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Change_password AuthController Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }
}
