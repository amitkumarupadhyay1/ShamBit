import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector, APP_GUARD } from '@nestjs/core';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TokenDenylistService } from '../../../infrastructure/security/token-denylist.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['BUYER'],
    },
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  const mockRequest = {
    cookies: {},
    headers: {},
    user: { sub: 'user-123', email: 'test@example.com', roles: ['BUYER'] },
    accessToken: 'access-token',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            googleAuth: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            getProfile: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                NODE_ENV: 'development',
                COOKIE_DOMAIN: 'localhost',
                JWT_SECRET: 'test-secret',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: TokenDenylistService,
          useValue: {
            denyToken: jest.fn(),
            isTokenDenied: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and set cookies', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto, mockResponse);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message', 'Registration successful');
      expect(result).toHaveProperty('user', mockAuthResponse.user);
    });
  });

  describe('login', () => {
    it('should login user and set cookies', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message', 'Login successful');
      expect(result).toHaveProperty('user', mockAuthResponse.user);
    });
  });

  describe('googleAuth', () => {
    it('should authenticate with Google and set cookies', async () => {
      const googleAuthDto = {
        googleToken: 'google-token',
      };

      authService.googleAuth.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleAuth(googleAuthDto, mockResponse);

      expect(authService.googleAuth).toHaveBeenCalledWith(googleAuthDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message', 'Google authentication successful');
      expect(result).toHaveProperty('user', mockAuthResponse.user);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens from cookie', async () => {
      const requestWithCookie = {
        ...mockRequest,
        cookies: { refreshToken: 'refresh-token' },
      };

      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refresh({}, requestWithCookie, mockResponse);

      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message', 'Token refreshed successfully');
    });

    it('should refresh tokens from body', async () => {
      const refreshTokenDto = { refreshToken: 'refresh-token' };

      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refresh(
        refreshTokenDto,
        mockRequest,
        mockResponse,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toHaveProperty('message', 'Token refreshed successfully');
    });

    it('should throw error if no refresh token provided', async () => {
      await expect(
        controller.refresh({}, mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token not provided');
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      authService.logout.mockResolvedValue();

      const result = await controller.logout(
        mockRequest.user,
        mockRequest,
        mockResponse,
      );

      expect(authService.logout).toHaveBeenCalledWith(
        mockRequest.user.sub,
        mockRequest.accessToken,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        roles: ['BUYER'],
        isEmailVerified: false,
        status: 'ACTIVE',
      };

      authService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockRequest.user);

      expect(authService.getProfile).toHaveBeenCalledWith(mockRequest.user.sub);
      expect(result).toEqual(mockProfile);
    });
  });
});
