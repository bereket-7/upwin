import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // TODO: Implement actual email sending (SendGrid, AWS SES, etc.)
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    console.log(`Verification email for ${email}:`);
    console.log(`Click here to verify: ${verificationUrl}`);
    
    // For now, just log the verification URL
    // In production, replace with actual email service
  }
}