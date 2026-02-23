import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your Upwin account',
      template: './verification', // Relative to the template dir defined in EmailModule
      context: {
        otp: token, // The token is now a 6-digit OTP
      },
    });

    console.log(`Verification email sent to ${email}`);
  }
}