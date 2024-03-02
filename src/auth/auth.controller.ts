import {
  Controller,
  Post,
  Body,
  Res,
  Put,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  OTPAuthDto,
  OtpPasswordDto,
  PasswordAuthDto,
  SigninAuthDto,
  SignupAuthDto,
  SigninGoogleAuthDto,
} from './dto';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // using email
  @Post('local/signup')
  async signupLocal(@Body() dto: SignupAuthDto) {
    const res = await this.authService.signupLocal(dto);
    return res;
  }

  @Post('local/verify')
  async verifyLocal(@Body() dto: OTPAuthDto, @Res() res: Response) {
    const isValid = await this.authService.verifyLocal(dto);
    if (isValid) {
      res.status(200).send({
        message: 'Verified',
      });
    } else {
      // Optionally, you can also set a different status code for invalid cases
      res.status(400).send({ error: 'Invalid verification' });
    }
  }

  @Put('local/password')
  async verifyPasswordChange(@Body() dto: OtpPasswordDto) {
    await this.authService.verifyPasswordChange(dto);
    return {
      message: 'Changed Successfully',
    };
  }

  @Post('local/password/otp')
  async changePassword(@Body() dto: PasswordAuthDto) {
    return this.authService.changePassword(dto);
  }

  // using email
  @Post('local/login')
  async loginLocal(@Body() dto: SigninAuthDto) {
    return await this.authService.localLogin(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logout')
  async logout(@Req() req: Request) {
    const user = req.user;
    return await this.authService.logout(user['sub']);
  }

  // using gmail
  @Post('/google/login')
  async googleLogin(@Body() dto: SigninGoogleAuthDto) {
    return await this.authService.googleLogin(dto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('refresh')
  async refreshToken(@Req() req: Request) {
    const user = req.user;
    return await this.authService.refreshToken(
      user['sub'],
      user['refreshToken'],
    );
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('payload')
  async getTokenPayload(@Req() req: Request) {
    const user = req.user;
    return user;
  }

  @Post('pay')
  async getPayload(@Body() dto: { access_token: string }) {
    return this.authService.getPayload(dto.access_token);
  }
}
