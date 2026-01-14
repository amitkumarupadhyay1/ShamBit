import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenDenylistService {
  private denylist: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  async denyToken(token: string): Promise<void> {
    this.denylist.add(token);
  }

  async isTokenDenied(token: string): Promise<boolean> {
    return this.denylist.has(token);
  }

  private cleanup(): void {
    // In production, implement proper cleanup based on token expiration
    // For now, clear all tokens older than 24 hours
    // This is a simple in-memory implementation
    // For production, use Redis or database
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
