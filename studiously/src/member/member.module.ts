import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { MapperService } from './mapper.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { OtpEntity } from './entities/otp.entity';
import { TokenBlacklistService } from './auth/token_blacklist.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SessionEntity, OtpEntity])],
  controllers: [MemberController],
  providers: [MemberService, MapperService, TokenBlacklistService],
  exports: [MemberService],
})
export class MemberModule {}
