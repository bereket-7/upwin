import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '@org/shared';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      const adminEmail = 'admin@upwin.com';
      const adminPassword = process.env.ADMIN_SEED_PASSWORD;

      if (!adminPassword) {
        this.logger.warn('Skipping admin seed because ADMIN_SEED_PASSWORD is not set');
        return;
      }
      
      // Check if admin already exists
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      // Create admin user
      const hashedPassword = await hashPassword(adminPassword);
      
      const admin = await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
        },
      });

      this.logger.log(`Admin user created successfully: ${admin.email}`);
    } catch (error) {
      this.logger.error('Failed to seed admin user:', error);
    }
  }
}
