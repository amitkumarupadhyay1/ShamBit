import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { BannerRepository } from '../banner.repository';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('BannerRepository', () => {
  let repository: BannerRepository;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule =
      await TestModuleBuilder.createBannerTestingModule([BannerRepository]);

    repository = module.get<BannerRepository>(BannerRepository);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findActive', () => {
    it('should find active banners successfully', async () => {
      // Arrange
      const position = 'header';
      const expectedBanners = [
        TestDataFactory.createTestBanner({ position, isActive: true }),
        TestDataFactory.createTestBanner({ position, isActive: true }),
      ];

      prismaService.banner.findMany.mockResolvedValue(expectedBanners);

      // Act
      const result = await repository.findActive(position);

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(prismaService.banner.findMany).toHaveBeenCalledWith({
        where: {
          position,
          isActive: true,
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
        },
        orderBy: { priority: 'asc' },
      });
    });

    it('should find active banners without position filter', async () => {
      // Arrange
      const expectedBanners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      prismaService.banner.findMany.mockResolvedValue(expectedBanners);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(prismaService.banner.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
        },
        orderBy: { priority: 'asc' },
      });
    });

    it('should return empty array when no active banners found', async () => {
      // Arrange
      prismaService.banner.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findActive('header');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.banner.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findActive('header')).rejects.toThrow();
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const banners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      prismaService.banner.findMany.mockResolvedValue(banners);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.findActive('header'),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 100); // Should complete under 100ms
    });
  });

  describe('findAll', () => {
    it('should find all banners with pagination', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          TestDataFactory.createTestBanner(),
          TestDataFactory.createTestBanner(),
        ],
        total: 2,
      };

      prismaService.banner.findMany.mockResolvedValue(expectedResult.data);
      prismaService.banner.count.mockResolvedValue(expectedResult.total);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.banner.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prismaService.banner.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const query = {
        page: 2,
        limit: 5,
        position: 'header',
        isActive: true,
      };
      const expectedResult = { data: [], total: 0 };

      prismaService.banner.findMany.mockResolvedValue([]);
      prismaService.banner.count.mockResolvedValue(0);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.banner.findMany).toHaveBeenCalledWith({
        where: {
          position: 'header',
          isActive: true,
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

      prismaService.banner.findMany.mockResolvedValue([]);
      prismaService.banner.count.mockResolvedValue(0);

      // Act
      const result = await repository.findAll(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should find banner by ID successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const expectedBanner = TestDataFactory.createTestBanner({ id });

      prismaService.banner.findUnique.mockResolvedValue(expectedBanner);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toEqual(expectedBanner);
      expect(prismaService.banner.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null when banner not found', async () => {
      // Arrange
      const id = 'nonexistent-banner';

      prismaService.banner.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.banner.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create banner successfully', async () => {
      // Arrange
      const bannerData = {
        title: 'New Banner',
        description: 'New banner description',
        imageUrl: 'https://example.com/banner.jpg',
        position: 'header',
        isActive: true,
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(),
        targetAudience: ['all'],
        metadata: { key: 'value' },
        createdBy: 'admin-123',
      };
      const createdBanner = TestDataFactory.createTestBanner(bannerData);

      prismaService.banner.create.mockResolvedValue(createdBanner);

      // Act
      const result = await repository.create(bannerData);

      // Assert
      expect(result).toEqual(createdBanner);
      expect(prismaService.banner.create).toHaveBeenCalledWith({
        data: bannerData,
      });
    });

    it('should handle creation errors gracefully', async () => {
      // Arrange
      const bannerData = {
        title: 'Test Banner',
        position: 'header',
        isActive: true,
      };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      prismaService.banner.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.create(bannerData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const updateData = {
        title: 'Updated Banner',
        isActive: false,
      };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        ...updateData,
      });

      prismaService.banner.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await repository.update(id, updateData);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(prismaService.banner.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
      });
    });

    it('should handle update of non-existent banner', async () => {
      // Arrange
      const id = 'nonexistent-banner';
      const updateData = { title: 'Updated Title' };
      const notFoundError = TestErrorHelper.createNotFoundError();

      prismaService.banner.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(repository.update(id, updateData)).rejects.toThrow();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const id = 'banner-123';
      const updateData = { displayOrder: 5 };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        displayOrder: 5,
      });

      prismaService.banner.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await repository.update(id, updateData);

      // Assert
      expect(result).toEqual(updatedBanner);
    });
  });

  describe('delete', () => {
    it('should delete banner successfully', async () => {
      // Arrange
      const id = 'banner-123';

      prismaService.banner.delete.mockResolvedValue(
        TestDataFactory.createTestBanner({ id }),
      );

      // Act
      await repository.delete(id);

      // Assert
      expect(prismaService.banner.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should handle deletion of non-existent banner', async () => {
      // Arrange
      const id = 'nonexistent-banner';
      const notFoundError = TestErrorHelper.createNotFoundError();

      prismaService.banner.delete.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(repository.delete(id)).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent read operations efficiently', async () => {
      // Arrange
      const bannerIds = ['banner1', 'banner2', 'banner3'];
      const banners = bannerIds.map((id) =>
        TestDataFactory.createTestBanner({ id }),
      );

      prismaService.banner.findUnique.mockImplementation((args: any) => {
        const id = args.where.id;
        return Promise.resolve(banners.find((b) => b.id === id) || null);
      });

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerIds.map((id) => repository.findById(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200); // Should complete under 200ms
    });

    it('should handle bulk create operations efficiently', async () => {
      // Arrange
      const bannerData = Array(5).fill(null).map((_, index) => ({
        title: `Banner ${index + 1}`,
        position: 'header',
        isActive: true,
        displayOrder: index + 1,
      }));

      prismaService.banner.create.mockImplementation((args: any) =>
        Promise.resolve(TestDataFactory.createTestBanner(args.data)),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerData.map((data) => repository.create(data));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 150); // Should complete under 150ms
      expect(prismaService.banner.create).toHaveBeenCalledTimes(5);
    });
  });
});
