import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  OTPAuthDto,
  OtpPasswordDto,
  PasswordAuthDto,
  SigninAuthDto,
  SignupAuthDto,
  SigninGoogleAuthDto,
} from './dto';
import { UtilService } from 'src/util/util.service';
import * as argon from 'argon2';
import { MailService } from 'src/mail/mail.service';
import { Unverified_User_Type } from 'src/types/user.types';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private admin: any;
  constructor(
    private prismaService: PrismaService,
    private utility: UtilService,
    private mailer: MailService,
    private config: ConfigService,
  ) {
    this.admin = new OAuth2Client({
      clientId: this.config.get('GOOGLE_CLIENT_ID'),
    }); // GOOGLE_CLIENT_ID must be same as frontend
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await this.utility.hashData(rt);
    await this.prismaService.users.update({
      where: {
        id: userId,
      },
      data: {
        hashRT: hash,
      },
    });
  }
  async updateOtp(userId: number) {
    const otp = await this.utility.generateOtp();
    const hashedOtp = await this.utility.hashData(String(otp));
    const user = await this.prismaService.unverified_Users.update({
      where: {
        id: userId,
      },
      data: {
        otp: hashedOtp,
      },
    });
    delete user.otp;
    return { ...user, otp: String(otp) };
  }

  async signupLocal(dto: SignupAuthDto) {
    var user: Unverified_User_Type, otp: string;
    // if user already exist in as verified user
    const preExist = await this.prismaService.users.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (preExist) throw new HttpException('Already Exist', HttpStatus.CONFLICT);
    const reSend = await this.prismaService.unverified_Users.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (reSend) {
      user = await this.updateOtp(reSend.id);
      otp = user.otp;
    } else {
      const hash = await this.utility.hashData(dto.password);
      otp = String(await this.utility.generateOtp());
      const hashedOtp = await this.utility.hashData(String(otp));
      user = await this.prismaService.unverified_Users.create({
        data: {
          email: dto.email,
          password: hash,
          username: dto.username,
          otp: hashedOtp,
        },
      });
    }

    // user is added to a temp db as unverified and will be tranferred to verified

    // call mail service and send otp
    delete user.password;
    delete user.otp;

    await this.mailer.sendUserConfirmation(user.email, user.username, otp);
    return user;
  }

  async verifyLocal(dto: OTPAuthDto) {
    const user = await this.prismaService.unverified_Users.findUnique({
      where: {
        id: +dto.id,
      },
    });
    if (!user) return false;
    const otpMatch = await argon.verify(user.otp, dto.otp);
    if (otpMatch) {
      delete user.otp;
      delete user.id;
      const newUser = await this.prismaService.users.create({
        data: { ...user },
      });
      await this.prismaService.unverified_Users.delete({
        where: {
          email: user.email,
        },
      });
      if (newUser) return true;
      return false;
    } else return false;
  }

  async changePassword(dto: PasswordAuthDto) {
    try {
      await this.prismaService.passwordOtp.delete({
        where: {
          user_mail: dto.email,
        },
      });
    } catch (err) {}

    const user = await this.prismaService.users.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);

    const otp = String(await this.utility.generateOtp());
    const hashOtp = await this.utility.hashData(otp);
    // create a reln table to store user vs otp
    await this.mailer.sendUserConfirmation(user.email, user.username, otp);

    const newPassOtp = await this.prismaService.passwordOtp.create({
      data: {
        user_mail: dto.email,
        hashOtp,
      },
    });

    if (!newPassOtp)
      if (!user) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);

    return {
      message: 'Email Sent',
    };
  }

  async verifyPasswordChange(dto: OtpPasswordDto) {
    const passOtp = await this.prismaService.passwordOtp.findUnique({
      where: {
        user_mail: dto.email,
      },
    });
    const isOtp = await argon.verify(passOtp.hashOtp, dto.otp);
    if (!isOtp)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const password = await argon.hash(dto.password);
    const user = await this.prismaService.users.update({
      where: {
        email: dto.email,
      },
      data: {
        password,
      },
    });
    if (!user)
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    await this.prismaService.passwordOtp.delete({
      where: {
        id: passOtp.id,
      },
    });
  }

  async localLogin(dto: SigninAuthDto) {
    // find user and if not present throw error
    const user = await this.prismaService.users.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    // verify user's password
    const isUser = await argon.verify(user.password, dto.password);
    if (!isUser) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const tokens = await this.utility.getToken(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    delete user.hashRT;
    delete user.password;
    return { ...tokens, ...user };
  }

  async googleLogin(dto: SigninGoogleAuthDto) {
    try {
      const ticket = await this.admin.verifyIdToken({
        idToken: dto.token,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });
      const decodedToken = ticket.getPayload();
      var user = await this.prismaService.users.findUnique({
        where: {
          email: decodedToken.email,
        },
      });
      // if user doesnt exist create one
      if (!user) {
        const newUserObject = {
          email: decodedToken.email,
          username: decodedToken.name,
          signInMethod: 'google.com',
          password: await this.utility.hashData(dto.token),
        };
        user = await this.prismaService.users.create({
          data: newUserObject,
        });
      }
      const tokens = await this.utility.getToken(user.id, user.email);
      await this.updateRtHash(user.id, tokens.refresh_token);
      // delete stuff to return user
      delete user.hashRT;
      delete user.password;

      return { ...tokens, ...user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error('Google sign-in failed');
    }
  }

  async logout(id: number) {
    await this.prismaService.users.updateMany({
      where: {
        id: id,
        hashRT: {
          not: null,
        },
      },
      data: {
        hashRT: null,
      },
    });
  }

  async refreshToken(id: number, rt: string) {
    const user = await this.prismaService.users.findUnique({
      where: {
        id,
      },
    });
    if (!user)
      throw new HttpException('Unauthorized1', HttpStatus.UNAUTHORIZED);

    const Validity = await argon.verify(user.hashRT, rt);
    if (!Validity)
      throw new HttpException('Unauthorized2', HttpStatus.UNAUTHORIZED);

    const tokens = await this.utility.getToken(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async getPayload(access_token: string) {
    return this.utility.getPayload(access_token);
  }
}
