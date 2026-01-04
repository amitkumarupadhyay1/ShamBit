import { Module } from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';
import { BetterAuthController } from './better-auth.controller';
import { BetterAuthGuard } from './better-auth.guard';

@Module({
  controllers: [BetterAuthController],
  providers: [BetterAuthService, BetterAuthGuard],
  exports: [BetterAuthService, BetterAuthGuard],
})
export class BetterAuthModule {}