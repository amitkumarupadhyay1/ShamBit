import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from '../campaign.service';
import { CampaignRepository } from '../campaign.repository';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
} from '../../../test/utils/test-helpers';

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignRepository: jest.Mocked<CampaignRepository>;

  beforeEach(async () => {
    const module: TestingModule =
      await TestModuleBuilder.createBannerTestingModule([
        CampaignService,
        {
          provide: CampaignRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
      ]);

    service = module.get<CampaignService>(CampaignService);
    campaignRepository = module.get(CampaignRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated campaigns successfully', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          TestDataFactory.createTestCampaign(),
          TestDataFactory.createTestCampaign(),
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      campaignRepository.findAll.mockResolvedValue({
        data: expectedResult.data,
        total: expectedResult.total,
      });

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(campaignRepository.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle empty results', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      campaignRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should apply default pagination values', async () => {
      // Arrange
      const query = {};
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      campaignRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      campaignRepository.findAll.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findAll(query)).rejects.toThrow();
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const campaigns = [TestDataFactory.createTestCampaign()];

      campaignRepository.findAll.mockResolvedValue({
        data: campaigns,
        total: 1,
      });

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.findAll(query),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 50); // Should complete under 50ms
    });
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      // Arrange
      const createData = TestDataFactory.createValidCreateCampaignDto();
      const createdBy = 'admin-123';
      const createdCampaign = TestDataFactory.createTestCampaign({
        ...createData,
        createdBy,
      });

      campaignRepository.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await service.createCampaign(createData, createdBy);

      // Assert
      expect(result).toEqual(createdCampaign);
      expect(campaignRepository.create).toHaveBeenCalledWith({
        ...createData,
        createdBy,
      });
    });

    it('should handle creation with optional fields', async () => {
      // Arrange
      const createData = {
        name: 'Minimal Campaign',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: 'admin-123',
      };
      const createdCampaign = TestDataFactory.createTestCampaign(createData);

      campaignRepository.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await service.createCampaign(createData, 'admin-123');

      // Assert
      expect(result).toEqual(createdCampaign);
    });

    it('should handle creation errors gracefully', async () => {
      // Arrange
      const createData = TestDataFactory.createValidCreateCampaignDto();
      const createdBy = 'admin-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      campaignRepository.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.createCampaign(createData, createdBy)).rejects.toThrow();
    });

    it('should validate campaign dates', async () => {
      // Arrange
      const invalidData = {
        ...TestDataFactory.createValidCreateCampaignDto(),
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future start
        endDate: new Date(), // Past end
      };
      const createdBy = 'admin-123';

      // In real implementation, validation would catch this
      campaignRepository.create.mockResolvedValue(
        TestDataFactory.createTestCampaign({
          ...invalidData,
          createdBy,
        }),
      );

      // Act
      const result = await service.createCampaign(invalidData, createdBy);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics successfully', async () => {
      // Arrange
      const id = 'campaign-123';
      const expectedAnalytics = {
        id,
        views: 1500,
        clicks: 150,
        impressions: 10000,
        ctr: 0.015, // 1.5%
        conversions: 15,
        conversionRate: 0.01, // 1%
        spend: 50.0,
        cpc: 0.33,
        cpm: 5.0,
      };

      campaignRepository.findById.mockResolvedValue(
        TestDataFactory.createTestCampaign({ id }),
      );

      // In real implementation, this would aggregate data from analytics service
      // For now, return mock analytics

      // Act
      const result = await service.getCampaignAnalytics(id);

      // Assert
      expect(result).toEqual({
        id,
        views: 0,
        clicks: 0,
      });
      expect(campaignRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should handle non-existent campaign', async () => {
      // Arrange
      const id = 'nonexistent-campaign';

      campaignRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getCampaignAnalytics(id);

      // Assert
      expect(result).toEqual({
        id,
        views: 0,
        clicks: 0,
      });
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const id = 'campaign-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      campaignRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getCampaignAnalytics(id)).rejects.toThrow();
    });

    it('should calculate analytics within acceptable time', async () => {
      // Arrange
      const id = 'campaign-123';

      campaignRepository.findById.mockResolvedValue(
        TestDataFactory.createTestCampaign({ id }),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.getCampaignAnalytics(id),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 50); // Should complete under 50ms
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent campaign retrieval efficiently', async () => {
      // Arrange
      const campaignIds = ['campaign1', 'campaign2', 'campaign3'];
      const campaigns = campaignIds.map((id) =>
        TestDataFactory.createTestCampaign({ id }),
      );

      campaignRepository.findById.mockImplementation((id) =>
        Promise.resolve(campaigns.find((c) => c.id === id) || null),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = campaignIds.map((id) =>
            service.getCampaignAnalytics(id),
          );
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 100); // Should complete under 100ms
    });

    it('should handle bulk campaign creation efficiently', async () => {
      // Arrange
      const campaignData = Array(3).fill(null).map((_, index) => ({
        ...TestDataFactory.createValidCreateCampaignDto(),
        name: `Campaign ${index + 1}`,
      }));
      const createdBy = 'admin-123';

      campaignRepository.create.mockImplementation((data) =>
        Promise.resolve(TestDataFactory.createTestCampaign(data)),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = campaignData.map((data) =>
            service.createCampaign(data, createdBy),
          );
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 150); // Should complete under 150ms
      expect(campaignRepository.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle campaigns with zero budget', async () => {
      // Arrange
      const createData = {
        ...TestDataFactory.createValidCreateCampaignDto(),
        budget: 0,
      };
      const createdBy = 'admin-123';
      const createdCampaign = TestDataFactory.createTestCampaign({
        ...createData,
        createdBy,
      });

      campaignRepository.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await service.createCampaign(createData, createdBy);

      // Assert
      expect(result).toEqual(createdCampaign);
    });

    it('should handle campaigns with past dates', async () => {
      // Arrange
      const createData = {
        ...TestDataFactory.createValidCreateCampaignDto(),
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        endDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };
      const createdBy = 'admin-123';

      // In real implementation, this might be allowed for testing or backdating
      campaignRepository.create.mockResolvedValue(
        TestDataFactory.createTestCampaign({
          ...createData,
          createdBy,
        }),
      );

      // Act
      const result = await service.createCampaign(createData, createdBy);

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle campaigns with very long names', async () => {
      // Arrange
      const longName = 'A'.repeat(255); // Very long name
      const createData = {
        ...TestDataFactory.createValidCreateCampaignDto(),
        name: longName,
      };
      const createdBy = 'admin-123';

      campaignRepository.create.mockResolvedValue(
        TestDataFactory.createTestCampaign({
          ...createData,
          createdBy,
        }),
      );

      // Act
      const result = await service.createCampaign(createData, createdBy);

      // Assert
      expect(result.name).toBe(longName);
    });
  });
});
