import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from Authorization header or cookies
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const sessionData = await this.betterAuthService.verifySession(token);
      
      if (!sessionData) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Attach user and session to request
      request.user = sessionData.user;
      request.session = sessionData.session;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    // Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    const sessionCookie = request.cookies?.['better-auth.session_token'];
    if (sessionCookie) {
      return sessionCookie;
    }

    return null;
  }
}