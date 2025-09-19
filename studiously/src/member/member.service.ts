import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { MapperService } from './mapper.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { instanceToPlain } from 'class-transformer';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { OtpEntity } from './entities/otp.entity';
import { LoginDTO } from './dtos/login.dto';
import { CreateUserDTO } from './dtos/createUser.dto';
import { JwtPayloadLike, RequestAuthContext } from './auth/auth-context';
import type { Request as ExpressRequest } from 'express';
import { TokenBlacklistService } from './auth/token_blacklist.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,

    private mailerService: MailerService,
    private mapperService: MapperService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  get_service(): string {
    return 'CustomerService is working!';
  }

  async Login(login_info: LoginDTO): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOneBy({
        email: login_info.email,
      });
      if (user != null) {
        return user;
      } else {
        throw new NotFoundException('There is no user using this email');
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Login MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async Create_Signup(signup_info: CreateUserDTO): Promise<number> {
    const user = this.mapperService.dtoToEntity(signup_info, UserEntity);
    const previous_data = await this.userRepository.findOneBy({
      email: user.email,
    });
    if (previous_data === null) {
      const saved_user = await this.userRepository.save(user);
      return saved_user.id;
    } else {
      return -1;
    }
  }

  async Update_Password(req: Request, hashedPassword: string): Promise<number> {
    try {
      const user = await this.get_user_from_Request(req);
      console.log('Update Password header Request  user email = ' + user.email);
      const result = await this.userRepository.update(user.id, {
        password: hashedPassword,
      });
      return result.affected ?? 0;
    } catch (e) {
      throw new InternalServerErrorException(
        `Update_Password MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async ForgetPassword(email: string) {
    try {
      const user = await this.userRepository.findOneBy({ email: email });
      if (user != null) {
        //   Generate OTP
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const OTP = await this.Generate_OTP();
        const user_has_pin = await this.otpRepository.findOneBy({ user: user });
        if (user_has_pin) {
          console.log('Okay, Already have OTP. Needs to be updated');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          await this.otpRepository.update(user_has_pin.id, { otp: OTP });
          const user_has_pin_updated = await this.otpRepository.findOneBy({
            user: user,
          });
          console.log('Updated OTP = ' + user_has_pin_updated!.otp);
        } else {
          const new_otp = new OtpEntity();
          new_otp.id = -1;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          new_otp.otp = OTP;
          new_otp.user = user;
          const saved_data = await this.otpRepository.save(new_otp);
          console.log('New OTP = ' + saved_data.otp);
        }

        //   Send the OTP through email
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body =
          process.env.EMAIL_BODY_P1 + OTP + process.env.EMAIL_BODY_P2;
        await this.Send_Email(email, process.env.EMAIL_SUBJECT!, body);
        const new_token = new LoginDTO();
        new_token.email = email;
        new_token.password = 'temp';
        console.log('Email Sending Done');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return await this.create_token(new_token);
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `ForgetPassword MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async otp_verification(req: ExpressRequest, otp: string): Promise<any> {
    try {
      // Get the user by the email
      const user = await this.get_user_from_Request(req);
      console.log('Got the user = ' + user.email);
      //   Get the saved otp for the user
      const saved_otp_row_for_user = await this.otpRepository.findOne({
        where: { user: { id: user.id } },
        order: { id: 'DESC' },
      });
      console.log('User provided otp = ' + otp);
      console.log('Saved otp = ' + saved_otp_row_for_user!.otp);

      if (saved_otp_row_for_user!.otp === otp) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `otp_verification MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  //region Supportive FunctionsA

  async addToBlacklist(
    token: string,
    date_time: string,
    email: string,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOneBy({ email: email });
      const session = new SessionEntity();
      if (!user) {
        throw new InternalServerErrorException(
          'User not found with that email in addToBlacklist MemberService',
        );
      }
      session.jwt_token = token;
      session.expiration_date = date_time;
      session.user = user;
      const saved_data = await this.sessionRepository.save(session);
      return saved_data.id > 0;
    } catch (e) {
      throw new InternalServerErrorException(
        `addToBlacklist MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async get_token_by_token(token: string): Promise<SessionEntity | null> {
    try {
      return await this.sessionRepository.findOneBy({ jwt_token: token });
    } catch (e) {
      throw new InternalServerErrorException(
        `get_token_by_token MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async create_token(payload: LoginDTO): Promise<any> {
    try {
      const payloadObject = instanceToPlain(payload);
      return {
        access_token: await this.jwtService.signAsync(payloadObject),
      };
    } catch (e: unknown) {
      throw new InternalServerErrorException(
        `create_token MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async decode_token(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (e: unknown) {
      // Handle decoding error
      throw new InternalServerErrorException(
        `decode_token MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }
  async Send_Email(
    emailTo: string,
    emailSubject: string,
    emailBody: string,
  ): Promise<any> {
    try {
      return await this.mailerService.sendMail({
        to: emailTo,
        subject: emailSubject,
        text: emailBody,
      });
    } catch (e) {
      throw new InternalServerErrorException(
        `Send_Email MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  Generate_OTP(): any {
    return (Math.floor(Math.random() * 900000) + 100000).toString();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    try {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    } catch (e) {
      throw new InternalServerErrorException(
        `extractTokenFromHeader MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  async get_user_from_Request(req: Request): Promise<UserEntity> {
    try {
      const token = this.extractTokenFromHeader(req)!;

      const decoded_object_login_dto: LoginDTO =
        await this.jwtService.verifyAsync<LoginDTO>(token);
      // Get the user by the email
      return await this.userRepository.findOneByOrFail({
        email: decoded_object_login_dto.email,
      });
    } catch (e) {
      throw new InternalServerErrorException(
        `get_user_from_Request MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  // async updateMember_SingleInfo(id: number, column: string, data: any) {
  //   const updateData = {};
  //   updateData[column] = data;
  //
  //   await this.memberRepository.update(id, updateData);
  // }

  get_current_timestamp(): string {
    return new Date().toISOString();
  }

  async user_validity(email: string, password: string): Promise<boolean> {
    try {
      const saved_user = await this.userRepository.findOneBy({ email: email });
      if (!saved_user) {
        return false; // User not found, return false
      }

      return await bcrypt.compare(password, saved_user.password);
    } catch (e) {
      throw new InternalServerErrorException(
        `user_validity MemberService Error = ${e instanceof Error ? e.message : String(e)}`,
        { cause: e instanceof Error ? e : undefined },
      );
    }
  }

  /**
   * All in ONE
   */

  private extractTokenFromRequest(req: ExpressRequest): string {
    const raw = req.headers['authorization'];
    const header = typeof raw === 'string' ? raw.trim() : '';
    if (!header) {
      throw new BadRequestException(
        'Authorization header missing. Use: Bearer <token>',
      );
    }
    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : header;
    if (!token) {
      throw new BadRequestException('Access token missing');
    }
    return token;
  }

  async getAuthContextFromRequest(
    req: ExpressRequest,
  ): Promise<RequestAuthContext> {
    // 1) Token
    const token = this.extractTokenFromRequest(req);

    // 2) প্রথমে AuthGuard বসানো req.user থাকলে সেখান থেকে ইমেইল
    const guardUser = (req as unknown as { user?: { email?: string } }).user;
    let email: string | null = guardUser?.email ?? null;

    // 3) payload verify করে ইমেইল নেওয়া (প্রয়োজন হলে)
    let payload: JwtPayloadLike | null = null;
    if (!email) {
      try {
        payload = await this.jwtService.verifyAsync<JwtPayloadLike>(token);
        email = payload.email ?? payload.user?.email ?? null;
      } catch {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    } else {
      // guard থেকে ইমেইল পেয়েছি—payload-ও চাইলে verify করে নিই যাতে iat/exp পাই
      try {
        payload = await this.jwtService.verifyAsync<JwtPayloadLike>(token);
      } catch {
        // guard true হলেও verify ফেল করলে টোকেনকে invalid ধরা ভালো
        throw new UnauthorizedException('Invalid or expired access token');
      }
    }

    if (!email) {
      throw new UnauthorizedException('Email not found in token payload');
    }

    // 4) ব্ল্যাকলিস্ট চেক
    const isBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(token);

    // 5) ডাটাবেজ ইউজার (optional, দরকার না হলে skip করতে পারো)
    const user = await this.userRepository.findOne({ where: { email } });

    return {
      token,
      email,
      isBlacklisted,
      user,
      payload,
      issuedAt: payload?.iat,
      expiresAt: payload?.exp,
      subject: payload?.sub?.toString(),
    };
  }

  //endregion Supportive Functions
}
