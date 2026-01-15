import { Module, Global, DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { TokenDenylistService } from '../../infrastructure/security/token-denylist.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Global()
@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET'),
            signOptions: {
              expiresIn: config.get('JWT_EXPIRES_IN', '15m'),
            },
          }),
        }),
        PrismaModule,
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthRepository,
        JwtStrategy,
        TokenDenylistService,
        // Conditionally provide GoogleStrategy only if credentials are configured
        {
          provide: GoogleStrategy,
          useFactory: (configService: ConfigService) => {
            const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
            const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
            
            // Only instantiate GoogleStrategy if OAuth credentials are provided
            if (clientId && clientSecret) {
              return new GoogleStrategy(configService);
            }
            // Return null if credentials are not configured
            return null;
          },
          inject: [ConfigService],
        },
      ],
      exports: [AuthService, JwtModule, TokenDenylistService],
    };
  }
}
