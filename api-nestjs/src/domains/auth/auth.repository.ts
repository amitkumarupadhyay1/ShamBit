import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../infrastructure/observability/logger.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new LoggerService('AuthRepository');

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  async create(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roles: string[];
    isEmailVerified: boolean;
  }) {
    return this.prisma.user.create({
      data: {
        ...userData,
        status: 'ACTIVE',
      },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  async findByRefreshToken(refreshToken: string) {
    // Find user by refresh token stored in database
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          refreshToken: refreshToken,
          refreshTokenExpiresAt: {
            gt: new Date(),
          },
        },
      });

      return user;
    } catch (error) {
      return null;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateUser(userId: string, updateData: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Store refresh token in database with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
      },
    });
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true, refreshTokenExpiresAt: true },
    });

    if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
      return null;
    }

    // Check if token is expired
    if (user.refreshTokenExpiresAt < new Date()) {
      return null;
    }

    return user.refreshToken;
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });
  }
}
