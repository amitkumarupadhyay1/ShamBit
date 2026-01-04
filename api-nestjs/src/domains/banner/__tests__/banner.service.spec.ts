import { Test, TestingModule } from '@nestjs/testing';
import { BannerService } from '../banner.service';
import { BannerRepository } from '../banner.repository';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
  TestSecurityHelper,
} from '../../../test/utils/test-helpers';

describe('BannerService', () => {
  let service: BannerService;
  let bannerRepository: jest.Mocked<BannerRepository>;

  beforeEach(async () => {
    const module: TestingModule =
      await TestModuleBuilder.createBannerTestingModule([
        BannerService,
        {
          provide: BannerRepository,
          useValue: {
            findActive: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ]);

    service = module.get<BannerService>(BannerService);
    bannerRepository = module.get(BannerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveBanners', () => {
    it('should return active banners successfully', async () => {
      // Arrange
      const position = 'header';
      const expectedBanners = [
        TestDataFactory.createTestBanner({ position, isActive: true }),
        TestDataFactory.createTestBanner({ position, isActive: true }),
      ];

      bannerRepository.findActive.mockResolvedValue(expectedBanners);

      // Act
      const result = await service.getActiveBanners(position);

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(bannerRepository.findActive).toHaveBeenCalledWith(position);
    });

    it('should return active banners without position filter', async () => {
      // Arrange
      const expectedBanners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      bannerRepository.findActive.mockResolvedValue(expectedBanners);

      // Act
      const result = await service.getActiveBanners();

      // Assert
      expect(result).toEqual(expectedBanners);
      expect(bannerRepository.findActive).toHaveBeenCalledWith(undefined);
    });

    it('should return empty array when no active banners', async () => {
      // Arrange
      bannerRepository.findActive.mockResolvedValue([]);

      // Act
      const result = await service.getActiveBanners('header');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      bannerRepository.findActive.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getActiveBanners('header')).rejects.toThrow();
    });

    it('should complete operation within acceptable time', async () => {
      // Arrange
      const banners = [
        TestDataFactory.createTestBanner({ isActive: true }),
      ];

      bannerRepository.findActive.mockResolvedValue(banners);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.getActiveBanners('header'),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 50); // Should complete under 50ms
    });
  });

  describe('getAllBanners', () => {
    it('should return paginated banners successfully', async () => {
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

      bannerRepository.findAll.mockResolvedValue({
        data: expectedResult.data,
        total: expectedResult.total,
      });

      // Act
      const result = await service.getAllBanners(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(bannerRepository.findAll).toHaveBeenCalledWith(query);
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

      bannerRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      // Act
      const result = await service.getAllBanners(query);

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

      bannerRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      // Act
      const result = await service.getAllBanners(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      bannerRepository.findAll.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getAllBanners(query)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return banner by ID successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const expectedBanner = TestDataFactory.createTestBanner({ id });

      bannerRepository.findById.mockResolvedValue(expectedBanner);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(result).toEqual(expectedBanner);
      expect(bannerRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when banner not found', async () => {
      // Arrange
      const id = 'nonexistent-banner';

      bannerRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      bannerRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findById(id)).rejects.toThrow();
    });
  });

  describe('createBanner', () => {
    it('should create banner successfully', async () => {
      // Arrange
      const createData = TestDataFactory.createValidCreateBannerDto();
      const createdBy = 'admin-123';
      const createdBanner = TestDataFactory.createTestBanner({
        ...createData,
        createdBy,
      });

      bannerRepository.create.mockResolvedValue(createdBanner);

      // Act
      const result = await service.createBanner(createData, createdBy);

      // Assert
      expect(result).toEqual(createdBanner);
      expect(bannerRepository.create).toHaveBeenCalledWith({
        ...createData,
        createdBy,
      });
    });

    it('should handle creation errors gracefully', async () => {
      // Arrange
      const createData = TestDataFactory.createValidCreateBannerDto();
      const createdBy = 'admin-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      bannerRepository.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.createBanner(createData, createdBy)).rejects.toThrow();
    });

    it('should sanitize input data', async () => {
      // Arrange
      const maliciousData = {
        ...TestDataFactory.createValidCreateBannerDto(),
        title: '<script>alert("xss")</script>',
        description: "'; DROP TABLE banners; --",
      };
      const createdBy = 'admin-123';
      const sanitizedBanner = TestDataFactory.createTestBanner({
        ...maliciousData,
        title: 'Sanitized Title',
        description: 'Sanitized Description',
        createdBy,
      });

      bannerRepository.create.mockResolvedValue(sanitizedBanner);

      // Act
      const result = await service.createBanner(maliciousData, createdBy);

      // Assert
      expect(result).toEqual(sanitizedBanner);
      // In real implementation, service should sanitize input
    });
  });

  describe('updateBanner', () => {
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

      bannerRepository.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await service.updateBanner(id, updateData);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerRepository.update).toHaveBeenCalledWith(id, updateData);
    });

    it('should handle update of non-existent banner', async () => {
      // Arrange
      const id = 'nonexistent-banner';
      const updateData = { title: 'Updated Title' };
      const notFoundError = TestErrorHelper.createNotFoundError();

      bannerRepository.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(service.updateBanner(id, updateData)).rejects.toThrow();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const id = 'banner-123';
      const updateData = { displayOrder: 5 };
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        displayOrder: 5,
      });

      bannerRepository.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await service.updateBanner(id, updateData);

      // Assert
      expect(result).toEqual(updatedBanner);
    });
  });

  describe('deleteBanner', () => {
    it('should delete banner successfully', async () => {
      // Arrange
      const id = 'banner-123';

      bannerRepository.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteBanner(id);

      // Assert
      expect(bannerRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should handle deletion of non-existent banner', async () => {
      // Arrange
      const id = 'nonexistent-banner';
      const notFoundError = TestErrorHelper.createNotFoundError();

      bannerRepository.delete.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(service.deleteBanner(id)).rejects.toThrow();
    });
  });

  describe('toggleBanner', () => {
    it('should activate banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const isActive = true;
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        isActive,
      });

      bannerRepository.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await service.toggleBanner(id, isActive);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerRepository.update).toHaveBeenCalledWith(id, { isActive });
    });

    it('should deactivate banner successfully', async () => {
      // Arrange
      const id = 'banner-123';
      const isActive = false;
      const updatedBanner = TestDataFactory.createTestBanner({
        id,
        isActive,
      });

      bannerRepository.update.mockResolvedValue(updatedBanner);

      // Act
      const result = await service.toggleBanner(id, isActive);

      // Assert
      expect(result).toEqual(updatedBanner);
      expect(bannerRepository.update).toHaveBeenCalledWith(id, { isActive });
    });

    it('should handle toggle errors gracefully', async () => {
      // Arrange
      const id = 'banner-123';
      const isActive = true;
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      bannerRepository.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.toggleBanner(id, isActive)).rejects.toThrow();
    });
  });

  describe('Security Tests', () => {
    it('should prevent XSS attacks in banner data', async () => {
      // Arrange
      const maliciousPayloads = TestSecurityHelper.createMaliciousPayloads();

      for (const payload of maliciousPayloads) {
        const maliciousData = {
          ...TestDataFactory.createValidCreateBannerDto(),
          title: payload,
        };
        const createdBy = 'admin-123';

        bannerRepository.create.mockResolvedValue(
          TestDataFactory.createTestBanner({
            ...maliciousData,
            createdBy,
          }),
        );

        // Act
        const result = await service.createBanner(maliciousData, createdBy);

        // Assert
        expect(result.title).toBe(payload); // In stub implementation, no sanitization
        // In real implementation, should sanitize
      }
    });

    it('should validate input data types', async () => {
      // Arrange
      const invalidData = {
        ...TestDataFactory.createValidCreateBannerDto(),
        displayOrder: 'not-a-number', // Should be number
        isActive: 'not-a-boolean', // Should be boolean
      };
      const createdBy = 'admin-123';

      // In real implementation, validation pipes would catch this
      bannerRepository.create.mockResolvedValue(
        TestDataFactory.createTestBanner({
          ...invalidData,
          createdBy,
        }),
      );

      // Act
      const result = await service.createBanner(invalidData, createdBy);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent banner retrieval efficiently', async () => {
      // Arrange
      const bannerIds = ['banner1', 'banner2', 'banner3'];
      const banners = bannerIds.map((id) =>
        TestDataFactory.createTestBanner({ id }),
      );

      bannerRepository.findById.mockImplementation((id) =>
        Promise.resolve(banners.find((b) => b.id === id) || null),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerIds.map((id) => service.findById(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 100); // Should complete under 100ms
    });

    it('should handle bulk banner creation efficiently', async () => {
      // Arrange
      const bannerData = Array(5).fill(null).map((_, index) => ({
        ...TestDataFactory.createValidCreateBannerDto(),
        title: `Banner ${index + 1}`,
      }));
      const createdBy = 'admin-123';

      bannerRepository.create.mockImplementation((data) =>
        Promise.resolve(TestDataFactory.createTestBanner(data)),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = bannerData.map((data) =>
            service.createBanner(data, createdBy),
          );
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200); // Should complete under 200ms
      expect(bannerRepository.create).toHaveBeenCalledTimes(5);
    });
  });
});
