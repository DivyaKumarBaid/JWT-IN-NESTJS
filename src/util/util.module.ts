import { Global, Module } from '@nestjs/common';
import { UtilService } from './util.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [UtilService],
  exports: [UtilService]
})
export class UtilModule { }
