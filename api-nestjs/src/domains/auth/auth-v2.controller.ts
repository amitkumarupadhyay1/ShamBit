import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';
import { BetterAuthService } from '../../infrastructure/auth/better-auth.service';
import { BetterAuthGuard } from '../../infrastructure/auth/better-auth.guard';
import { CurrentUser, CurrentSession } from '../../infrastructure/auth/current-user.decorator';
import type { User, Session } from '../../infrastructure/auth/better-auth.config';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  roles?: string[];
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@ApiTags('Authentication v2 (Better Auth)')
@Controller('auth/v2')
export class AuthV2Controller {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account using Better Auth'
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            roles: { type: 'string' },
          }
        },
        session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            token: { type: 'string' },
            expiresAt: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const result = await this.betterAuthService.createUser(signUpDto);
      return {
        message: 'User created successfully',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Sign in user',
    description: 'Authenticate user with email and password using Better Auth'
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully signed in',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            roles: { type: 'string' },
          }
        },
        session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            token: { type: 'string' },
            expiresAt: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const result = await this.betterAuthService.signIn(
        signInDto.email,
        signInDto.password,
      );
      return {
        message: 'User signed in successfully',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('signout')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Sign out user',
    description: 'Sign out the current user and invalidate session'
  })
  @ApiResponse({ status: 200, description: 'User successfully signed out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signOut(@CurrentSession('token') sessionToken: string) {
    try {
      await this.betterAuthService.signOut(sessionToken);
      return {
        message: 'User signed out successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('me')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Get the current authenticated user information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user information',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            roles: { type: 'string' },
            isEmailVerified: { type: 'boolean' },
            isPhoneVerified: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          }
        },
        session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            expiresAt: { type: 'string' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @CurrentUser() user: User,
    @CurrentSession() session: Session,
  ) {
    return {
      user,
      session,
    };
  }

  @Get('session')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current session',
    description: 'Get the current session information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current session information',
    schema: {
      type: 'object',
      properties: {
        session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            expiresAt: { type: 'string' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentSession(@CurrentSession() session: Session) {
    return {
      session,
    };
  }
}