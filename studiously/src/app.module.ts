import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MemberModule } from './member/member.module';
import { AuthModule } from './member/auth/auth.module';
import { CollabModule } from './collab/collab.module';
// import { AuthModule } from './customer/auth/auth.module';

@Module({
  imports: [
    CollabModule,
    AuthModule,
    MemberModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT!, 10),
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),

    MailerModule.forRoot({
      transport: {
        host: process.env.MAILER_HOST,
        port: parseInt(process.env.MAILER_PORT!, 10),
        requireTLS: true,
        secure: false,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASSWORD,
        },
        tls: { minVersion: 'TLSv1.2', servername: process.env.MAILER_HOST },
      },
      defaults: { from: process.env.MAILER_USER },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
