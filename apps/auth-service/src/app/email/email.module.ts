import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailService } from './email.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getSmtpHost(),
          port: configService.getSmtpPort(),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.getSmtpUser(),
            pass: configService.getSmtpPass(),
          },
        },
        defaults: {
          from: configService.getSmtpFrom(),
        },
        template: {
          dir: join(__dirname, '..', '..', 'assets', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
