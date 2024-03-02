import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UtilModule } from './util/util.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    UtilModule,
    MailModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
