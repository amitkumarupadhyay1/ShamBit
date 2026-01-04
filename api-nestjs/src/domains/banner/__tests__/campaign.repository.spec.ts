import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CampaignRepository } from '../campaign.repository';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
} from '../../../test/utils/test-helpers';

describe('CampaignRepository', () => {
  let repository: CampaignRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule =
      await TestModuleBuilder.createBannerTestingModule([CampaignRepository]);

    repository = module.get<CampaignRepository>(CampaignRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all campaigns with pagination', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          TestDataFactory.createTestCampaign(),
          TestDataFactory.createTestCampaign(),
        ],
        total: 2,
      };

      prismaService.campaign.findMany.mockResolvedValue(expectedResult.data);
      prismaService.campaign.count.mockResolvedValue(expectedResult.total);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.campaign.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prismaService.campaign.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const query = {
        page: 2,
        limit: 5,
        status: 'ACTIVE',
      };
      const expectedResult = { data: [], total: 0 };

      prismaService.campaign.findMany.mockResolvedValue([]);
      prismaService.campaign.count.mockResolvedValue(0);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.campaign.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = { data: [], total: 0 };

      prismaService.campaign.findMany.mockResolvedValue([]);
      prismaService.campaign.count.mockResolvedValue(0);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.campaign.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findAll(query)).rejects.toThrow();
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const campaigns = [TestDataFactory.createTestCampaign()];

      prismaService.campaign.findMany.mockResolvedValue(campaigns);
      prismaService.campaign.count.mockResolvedValue(1);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.findAll(query),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 100); // Should complete under 100ms
    });
  });

  describe('findById', () => {
    it('should find campaign by ID successfully', async () => {
      // Arrange
      const id = 'campaign-123';
      const expectedCampaign = TestDataFactory.createTestCampaign({ id });

      prismaService.campaign.findUnique.mockResolvedValue(expectedCampaign);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toEqual(expectedCampaign);
      expect(prismaService.campaign.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null when campaign not found', async () => {
      // Arrange
      const id = 'nonexistent-campaign';

      prismaService.campaign.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const id = 'campaign-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.campaign.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create campaign successfully', async () => {
      // Arrange
      const campaignData = {
        id: 'campaign-123',
        name: 'New Campaign',
        description: 'New campaign description',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        budget: 1000,
        targetImpressions: 10000,
        targetClicks: 1000,
        targetConversions: 100,
        bannerIds: ['banner-123'],
        createdBy: 'admin-123',
      };
      const createdCampaign = TestDataFactory.createTestCampaign(campaignData);

      prismaService.campaign.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await repository.create(campaignData);

      // Assert
      expect(result).toEqual(createdCampaign);
      expect(prismaService.campaign.create).toHaveBeenCalledWith({
        data: {
          ...campaignData,
          status: 'DRAFT',
          spent: 0,
          actualImpressions: 0,
          actualClicks: 0,
          actualConversions: 0,
        },
      });
    });

    it('should handle creation with optional fields', async () => {
      // Arrange
      const campaignData = {
        name: 'Minimal Campaign',
        startDate: new Date(),
        endDate: new Date(),
        createdBy: 'admin-123',
      };
      const createdCampaign = TestDataFactory.createTestCampaign(campaignData);

      prismaService.campaign.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await repository.create(campaignData);

      // Assert
      expect(result).toEqual(createdCampaign);
    });

    it('should handle creation errors gracefully', async () => {
      // Arrange
      const campaignData = {
        name: 'Test Campaign',
        startDate: new Date(),
        endDate: new Date(),
      };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.campaign.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.create(campaignData)).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent read operations efficiently', async () => {
      // Arrange
      const campaignIds = ['campaign1', 'campaign2', 'campaign3'];
      const campaigns = campaignIds.map((id) =>
        TestDataFactory.createTestCampaign({ id }),
      );

      prismaService.campaign.findUnique.mockImplementation((args: any) => {
        const id = args.where.id;
        return Promise.resolve(campaigns.find((c) => c.id === id) || null);
      });

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = campaignIds.map((id) => repository.findById(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200); // Should complete under 200ms
    });

    it('should handle bulk create operations efficiently', async () => {
      // Arrange
      const campaignData = Array(3).fill(null).map((_, index) => ({
        name: `Campaign ${index + 1}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        budget: 500,
        createdBy: 'admin-123',
      }));

      prismaService.campaign.create.mockImplementation((args: any) =>
        Promise.resolve(TestDataFactory.createTestCampaign(args.data)),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = campaignData.map((data) => repository.create(data));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 150); // Should complete under 150ms
      expect(prismaService.campaign.create).toHaveBeenCalledTimes(3);
    });
  });
});
