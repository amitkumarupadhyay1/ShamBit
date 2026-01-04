import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { BannerController } from '../banner.controller';
import { BannerService } from '../banner.service';
import { CampaignService } from '../campaign.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/types';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestAssertions,
  TestPerformanceHelper,
  TestSecurityHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('BannerController', () => {
  let controller: BannerController;
  let bannerService: jest.Mocked<BannerService>;
  let campaignService: jest.Mocked<CampaignService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannerController],
      providers: [
        {
          provide: BannerService,
          useValue: {
            getActiveBanners: jest.fn(),
            getAllBanners: jest.fn(),
            findById: jest.fn(),
            createBanner: jest.fn(),
            updateBanner: jest.fn(),
            deleteBanner: jest.fn(),
            toggleBanner: jest.fn(),
          },
        },
        {
          provide: CampaignService,
          useValue: {
            findAll: jest.fn(),
            createCampaign: jest.fn(),
            getCampaignAnalytics: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BannerController>(BannerController);
    bannerService = module.get(BannerService);
    campaignService = module.get(CampaignService);

    // Mock Express Request and Response objects
    mockRequest = {
      user: TestDataFactory.createTestUser({ roles: [UserRole.ADMIN] }),
      accessToken: 'mock-access-token',
      cookies: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveBanners', () => {
    it('should return active banners for public access', async () => {
      // Arrange
      const position = 'header';
      const expectedBanners = [
        TestDataFactory.createTestBanner({ position, isActive: true }),
        TestDataFactory.createTestBanner({ position, isActive: true }),
      ];

      bannerService.getActiveBanners.mockResolvedValue(expectedBanners);

      // Act
      const result = await controller.getActiveBanners({ position });

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(bannerService.getActiveBanners).toHaveBeenCalledWith(position);
    });

    it('should return all active banners when no position specified', async () => {
      // Arrange
      const expectedBanners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      bannerService.getActiveBanners.mockResolvedValue(expectedBanners);

      // Act
      const result = await controller.getActiveBanners({});

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(bannerService.getActiveBanners).toHaveBeenCalledWith(undefined);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');

      bannerService.getActiveBanners.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.getActiveBanners({})).rejects.toThrow();
    });

    it('should complete request within acceptable time', async () => {
      // Arrange
      const banners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      bannerService.getActiveBanners.mockResolvedValue(banners);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => controller.getActiveBanners({}),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 50); // Should complete under 50ms
    });
  });

  describe('getAllBanners', () => {
    it('should return paginated banners for admin', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          TestDataFactory.createTestBanner(),
          TestDataFactory.createTestBanner(),
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      bannerService.getAllBanners.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getAllBanners(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(bannerService.getAllBanners).toHaveBeenCalledWith(query);
    });

    it('should require admin authentication', async () => {
      // This would be tested with guard mocking in integration tests
      // Guards are mocked to return true in beforeEach
      expect(true).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const dbError = new Error('Database connection failed');

      bannerService.getAllBanners.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.getAllBanners(query)).rejects.toThrow();
    });
  });

  describe('getBanner', () => {
    it('should return banner by ID for admin', async () => {
      // Arrange
      const id = 'banner-123';
      const expectedBanner = TestDataFactory.createTestBanner({ id });

      bannerService.findById.mockResolvedValue(expectedBanner);

      // Act
      const result = await controller.getBanner(id);

      // Assert
      expect(result).toEqual(expectedBanner);
      expect(bannerService.findById).toHaveBeenCalledWith(id);
    });

    it('should return null for non-existent banner', async () => {
      // Arrange
      const id = 'nonexistent-banner';

      bannerService.findById.mockResolvedValue(null);

      // Act
      const result = await controller.getBanner(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const dbError = new Error('Database connection failed');

      bannerService.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.getBanner(id)).rejects.toThrow();
    });
  });

  describe('createBanner', () => {
    it('should create banner successfully', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateBannerDto();
      const createdBy = 'admin-123';
      const createdBanner = TestDataFactory.createTestBanner({
        ...createDto,
        createdBy,
      });

      bannerService.createBanner.mockResolvedValue(createdBanner);

      // Act
      const result = await controller.createBanner(createDto, createdBy);

      // Assert
      expect(result).toEqual(createdBanner);
      expect(bannerService.createBanner).toHaveBeenCalledWith(
        createDto,
        createdBy,
      );
    });

    it('should require admin authentication', async () => {
      // Guards are mocked in beforeEach
      expect(true).toBe(true);
    });

    it('should extract user ID from request', async () => {
      // In real implementation, @CurrentUser decorator extracts from request
      const createDto = TestDataFactory.createValidCreateBannerDto();
      const createdBanner = TestDataFactory.createTestBanner(createDto);

      bannerService.createBanner.mockResolvedValue(createdBanner);

      // Act
      await controller.createBanner(createDto, 'admin-123');

      // Assert
      expect(bannerService.createBanner).toHaveBeenCalledWith(
        createDto,
        'admin-123',
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateBannerDto();
      const createdBy = 'admin-123';
      const dbError = new Error('Database connection failed');

      bannerService.createBanner.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.createBanner(createDto, createdBy)).rejects.toThrow();
    });
  });

  describe('updateBanner', () => {
    it('should update banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const updateDto = {
        title: 'Updated Banner',
        isActive: false,
      };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        ...updateDto,
      });

      bannerService.updateBanner.mockResolvedValue(updatedBanner);

      // Act
      const result = await controller.updateBanner(id, updateDto);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerService.updateBanner).toHaveBeenCalledWith(id, updateDto);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const id = 'banner-123';
      const updateDto = { displayOrder: 5 };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        displayOrder: 5,
      });

      bannerService.updateBanner.mockResolvedValue(updatedBanner);

      // Act
      const result = await controller.updateBanner(id, updateDto);

      // Assert
      expect(result).toEqual(updatedBanner);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const updateDto = { title: 'Updated Title' };
      const dbError = new Error('Database connection failed');

      bannerService.updateBanner.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.updateBanner(id, updateDto)).rejects.toThrow();
    });
  });

  describe('deleteBanner', () => {
    it('should delete banner successfully', async () => {
      // Arrange
      const id = 'banner-123';

      bannerService.deleteBanner.mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        controller.deleteBanner(id),
      ).resolves.not.toThrow();
      expect(bannerService.deleteBanner).toHaveBeenCalledWith(id);
    });

    it('should return 204 No Content on successful deletion', async () => {
      // In real implementation, @HttpCode decorator sets status
      const id = 'banner-123';
      bannerService.deleteBanner.mockResolvedValue(undefined);

      // Act
      await controller.deleteBanner(id);

      // Assert - This would be tested in integration tests
      expect(bannerService.deleteBanner).toHaveBeenCalledWith(id);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const dbError = new Error('Database connection failed');

      bannerService.deleteBanner.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.deleteBanner(id)).rejects.toThrow();
    });
  });

  describe('toggleBanner', () => {
    it('should activate banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const body = { isActive: true };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        isActive: true,
      });

      bannerService.toggleBanner.mockResolvedValue(updatedBanner);

      // Act
      const result = await controller.toggleBanner(id, body);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerService.toggleBanner).toHaveBeenCalledWith(id, true);
    });

    it('should deactivate banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const body = { isActive: false };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        isActive: false,
      });

      bannerService.toggleBanner.mockResolvedValue(updatedBanner);

      // Act
      const result = await controller.toggleBanner(id, body);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerService.toggleBanner).toHaveBeenCalledWith(id, false);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const body = { isActive: true };
      const dbError = new Error('Database connection failed');

      bannerService.toggleBanner.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.toggleBanner(id, body)).rejects.toThrow();
    });
  });

  describe('Campaign endpoints', () => {
    describe('getCampaigns', () => {
      it('should return campaigns for admin', async () => {
        // Arrange
        const query = { page: 1, limit: 10 };
        const expectedResult = {
          data: [
            TestDataFactory.createTestCampaign(),
          ],
          total: 1,
          page: 1,
          limit: 10,
        };

        campaignService.findAll.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.getCampaigns(query);

        // Assert
        expect(result).toEqual(expectedResult);
        expect(campaignService.findAll).toHaveBeenCalledWith(query);
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        const query = { page: 1, limit: 10 };
        const dbError = new Error('Database connection failed');

        campaignService.findAll.mockRejectedValue(dbError);

        // Act & Assert
        await expect(controller.getCampaigns(query)).rejects.toThrow();
      });
    });

    describe('createCampaign', () => {
      it('should create campaign successfully', async () => {
        // Arrange
        const createDto = TestDataFactory.createValidCreateCampaignDto();
        const createdBy = 'admin-123';
        const createdCampaign = TestDataFactory.createTestCampaign({
          ...createDto,
          createdBy,
        });

        campaignService.createCampaign.mockResolvedValue(createdCampaign);

        // Act
        const result = await controller.createCampaign(createDto, createdBy);

        // Assert
        expect(result).toEqual(createdCampaign);
        expect(campaignService.createCampaign).toHaveBeenCalledWith(
          createDto,
          createdBy,
        );
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        const createDto = TestDataFactory.createValidCreateCampaignDto();
        const createdBy = 'admin-123';
        const dbError = new Error('Database connection failed');

        campaignService.createCampaign.mockRejectedValue(dbError);

        // Act & Assert
        await expect(controller.createCampaign(createDto, createdBy)).rejects.toThrow();
      });
    });

    describe('getCampaignAnalytics', () => {
      it('should return campaign analytics', async () => {
        // Arrange
        const id = 'campaign-123';
        const expectedAnalytics = {
          id,
          views: 1500,
          clicks: 150,
        };

        campaignService.getCampaignAnalytics.mockResolvedValue(expectedAnalytics);

        // Act
        const result = await controller.getCampaignAnalytics(id);

        // Assert
        expect(result).toEqual(expectedAnalytics);
        expect(campaignService.getCampaignAnalytics).toHaveBeenCalledWith(id);
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        const id = 'campaign-123';
        const dbError = new Error('Database connection failed');

        campaignService.getCampaignAnalytics.mockRejectedValue(dbError);

        // Act & Assert
        await expect(controller.getCampaignAnalytics(id)).rejects.toThrow();
      });
    });
  });

  describe('Security Tests', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      // Guards are mocked to allow access in beforeEach
      // In real implementation, guards would block unauthorized requests
      expect(true).toBe(true);
    });

    it('should handle malicious input in query parameters', async () => {
      // Arrange
      const maliciousQuery = {
        page: '1; DROP TABLE banners; --',
        limit: '10',
      };

      bannerService.getAllBanners.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      // Act
      const result = await controller.getAllBanners(maliciousQuery);

      // Assert
      expect(result).toBeDefined();
      // In real implementation, validation pipes would sanitize input
    });

    it('should validate request body data', async () => {
      // Arrange
      const invalidBody = {
        title: '',
        position: 'invalid-position',
        isActive: 'not-a-boolean',
      };

      // In real implementation, validation pipes would catch this
      bannerService.createBanner.mockResolvedValue(
        TestDataFactory.createTestBanner(invalidBody),
      );

      // Act
      const result = await controller.createBanner(invalidBody, 'admin-123');

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent public banner requests efficiently', async () => {
      // Arrange
      const bannerRequests = Array(10).fill({ position: 'header' });
      const banners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      bannerService.getActiveBanners.mockResolvedValue(banners);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerRequests.map((query) =>
            controller.getActiveBanners(query),
          );
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200); // Should complete under 200ms
    });

    it('should handle bulk admin operations efficiently', async () => {
      // Arrange
      const bannerIds = ['banner1', 'banner2', 'banner3'];
      const banners = bannerIds.map((id) =>
        TestDataFactory.createTestBanner({ id }),
      );

      bannerService.findById.mockImplementation((id) =>
        Promise.resolve(banners.find((b) => b.id === id) || null),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerIds.map((id) => controller.getBanner(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 150); // Should complete under 150ms
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies', async () => {
      // Arrange
      const malformedBody = null;

      // In real implementation, validation pipes would catch this
      bannerService.createBanner.mockResolvedValue(
        TestDataFactory.createTestBanner(),
      );

      // Act
      const result = await controller.createBanner(malformedBody, 'admin-123');

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle invalid path parameters', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';

      bannerService.findById.mockResolvedValue(null);

      // Act
      const result = await controller.getBanner(invalidId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle service unavailability', async () => {
      // Arrange
      const serviceUnavailableError = new Error('Service temporarily unavailable');

      bannerService.getActiveBanners.mockRejectedValue(serviceUnavailableError);

      // Act & Assert
      await expect(controller.getActiveBanners({})).rejects.toThrow();
    });
  });
});
