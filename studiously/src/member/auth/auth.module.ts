// src/member/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from './token_blacklist.service';
import { MemberModule } from '../member.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MemberModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_CUSTOM_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenBlacklistService],
  exports: [JwtModule],
})
export class AuthModule {}
