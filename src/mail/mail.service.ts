import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private config: ConfigService
    ) { }

    async sendUserConfirmation(email: string, name: string, otp: string) {
        await this.mailerService.sendMail({
            to: email,
            // from: '"Support Team" <support@example.com>', // override default from
            subject: `Welcome to ${this.config.get('APP_NAME')}!  Confirm your Email`,
            template: './confirmation',
            context: {
                username: name,
                otp: otp,
                currentYear: new Date().getFullYear(),
                company_logo: this.config.get('COMPANY_LOGO'),
            },
        });
    }

    async sendPasswordConfirmation(email: string, name: string, otp: string) {
        await this.mailerService.sendMail({
            to: email,
            // from: '"Support Team" <support@example.com>', // override default from
            subject: `Welcome to ${this.config.get('APP_NAME')}!  Confirm your Email`,
            template: './confirmation',
            context: {
                username: name,
                otp: otp,
                currentYear: new Date().getFullYear(),
                company_logo: this.config.get('COMPANY_LOGO'),
            },
        });
    }
}
