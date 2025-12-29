import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Payment system models

  declare paymentIntent: any;

  declare paymentTransaction: any;

  declare paymentAttempt: any;
  // Brand request model (Prisma generated model)

  declare brandRequest: any;

  // Allow access to other generated model properties without strict typings

  [key: string]: any;

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
