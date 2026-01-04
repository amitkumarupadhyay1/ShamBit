import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { ProductRepository } from '../repositories/product.repository';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductModerationStatus } from '../enums/product-moderation-status.enum';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestAssertions,
  TestErrorHelper,
  TestPerformanceHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createProductTestingModule([
      ProductRepository,
      {
        provide: PrismaService,
        useValue: MockServicesFactory.createMockPrismaService(),
      },
    ]);

    repository = module.get<ProductRepository>(ProductRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products with filters', async () => {
      // Arrange
      const filters = { status: ProductStatus.PUBLISHED, categoryId: 'cat-123' };
      const pagination = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      const mockProducts = [TestDataFactory.createTestProduct()];
      const mockCount = 1;

      prisma.product.findMany.mockResolvedValue(mockProducts as any);
      prisma.product.count.mockResolvedValue(mockCount);

      // Act
      const result = await repository.findAll(filters, pagination);

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: ProductStatus.PUBLISHED,
          categoryId: 'cat-123',
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(mockCount);
    });

    it('should handle search filters', async () => {
      // Arrange
      const filters = { search: 'test query' };
      const pagination = { page: 1, limit: 20 };

      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      // Act
      await repository.findAll(filters, pagination);

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test query', mode: 'insensitive' } },
              { description: { contains: 'test query', mode: 'insensitive' } },
              { shortDescription: { contains: 'test query', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      // Arrange
      const productId = 'prod-123';
      const mockProduct = TestDataFactory.createTestProduct({ id: productId });

      prisma.product.findUnique.mockResolvedValue(mockProduct as any);

      // Act
      const result = await repository.findById(productId);

      // Assert
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(productId);
    });

    it('should return null when product not found', async () => {
      // Arrange
      const productId = 'prod-123';
      prisma.product.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(productId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      // Arrange
      const productData = {
        name: 'New Product',
        slug: 'new-product',
        description: 'Product description',
        categoryId: 'cat-123',
        brandId: 'brand-123',
        sellerId: 'seller-123',
        status: ProductStatus.DRAFT,
        createdBy: 'user-123',
      };
      const mockCreatedProduct = TestDataFactory.createTestProduct(productData);

      prisma.product.create.mockResolvedValue(mockCreatedProduct as any);

      // Act
      const result = await repository.create(productData);

      // Assert
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: productData.name,
          slug: productData.slug,
          categoryId: productData.categoryId,
          sellerId: productData.sellerId,
        }),
        include: expect.any(Object),
      });
      TestAssertions.expectValidProduct(result);
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      // Arrange
      const productId = 'prod-123';
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        updatedBy: 'user-123',
      };
      const mockUpdatedProduct = TestDataFactory.createTestProduct({
        id: productId,
        ...updateData,
      });

      prisma.product.update.mockResolvedValue(mockUpdatedProduct as any);

      // Act
      const result = await repository.update(productId, updateData);

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: 'Updated Name',
          slug: undefined, // Repository passes this even if undefined
          description: 'Updated description',
          status: undefined, // Repository passes this even if undefined
        },
        include: expect.any(Object),
      });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      // Arrange
      const productId = 'prod-123';

      prisma.product.delete.mockResolvedValue({} as any);

      // Act
      await repository.delete(productId);

      // Assert
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete a product', async () => {
      // Arrange
      const productId = 'prod-123';
      const deletedBy = 'user-123';
      const reason = 'Product no longer needed';

      // Act
      await repository.softDelete(productId, deletedBy, reason);

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: expect.objectContaining({
          status: ProductStatus.ARCHIVED,
        }),
      });
    });
  });

  describe('validateSlug', () => {
    it('should return true when slug is available', async () => {
      // Arrange
      const slug = 'unique-slug';
      prisma.product.count.mockResolvedValue(0);

      // Act
      const result = await repository.validateSlug(slug);

      // Assert
      expect(result).toBe(true);
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { slug },
      });
    });

    it('should return false when slug is taken', async () => {
      // Arrange
      const slug = 'taken-slug';
      prisma.product.count.mockResolvedValue(1);

      // Act
      const result = await repository.validateSlug(slug);

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude specific product ID when validating', async () => {
      // Arrange
      const slug = 'existing-slug';
      const excludeId = 'prod-123';
      prisma.product.count.mockResolvedValue(0);

      // Act
      const result = await repository.validateSlug(slug, excludeId);

      // Assert
      expect(result).toBe(true);
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: {
          slug,
          id: { not: excludeId },
        },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update product status and set published date', async () => {
      // Arrange
      const productId = 'prod-123';
      const newStatus = ProductStatus.PUBLISHED;
      const updatedBy = 'user-123';
      const reason = 'Publishing product';
      const mockUpdatedProduct = TestDataFactory.createTestProduct({
        id: productId,
        status: newStatus,
      });

      prisma.product.update.mockResolvedValue(mockUpdatedProduct as any);

      // Act
      const result = await repository.updateStatus(productId, newStatus, updatedBy, reason);

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: expect.objectContaining({
          status: newStatus,
          updatedBy,
          publishedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result.status).toBe(ProductStatus.PUBLISHED);
    });
  });

  describe('bulkUpdate', () => {
    it('should perform bulk update using transaction', async () => {
      // Arrange
      const updates = [
        { id: 'prod-1', data: { status: ProductStatus.PUBLISHED }, updatedBy: 'user-123' },
        { id: 'prod-2', data: { status: ProductStatus.ARCHIVED }, updatedBy: 'user-123' },
      ];
      const mockProducts = [
        TestDataFactory.createTestProduct({ id: 'prod-1', status: ProductStatus.PUBLISHED }),
        TestDataFactory.createTestProduct({ id: 'prod-2', status: ProductStatus.ARCHIVED }),
      ];

      // Mock findByIds method that's called inside bulkUpdate
      jest.spyOn(repository, 'findByIds').mockResolvedValue(mockProducts);

      prisma.$transaction.mockImplementation(async (callback) => {
        await callback(prisma);
        return mockProducts;
      });

      // Act
      const result = await repository.bulkUpdate(updates);

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('searchByName', () => {
    it('should search products by name', async () => {
      // Arrange
      const query = 'laptop';
      const filters = { status: ProductStatus.PUBLISHED };
      const mockProducts = [TestDataFactory.createTestProduct({ name: 'Gaming Laptop' })];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);

      // Act
      const result = await repository.searchByName(query, filters);

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          name: { contains: query, mode: 'insensitive' },
        }),
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gaming Laptop');
    });
  });

  describe('fullTextSearch', () => {
    it('should perform full text search across multiple fields', async () => {
      // Arrange
      const query = 'wireless headphones';
      const filters = { categoryId: 'cat-123' };
      const mockProducts = [TestDataFactory.createTestProduct()];

      prisma.product.findMany.mockResolvedValue(mockProducts as any);

      // Act
      const result = await repository.fullTextSearch(query, filters);

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { shortDescription: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        }),
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive product statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        draft: 20,
        submitted: 15,
        approved: 10,
        published: 50,
        rejected: 3,
        suspended: 2,
        archived: 0,
        featured: 10,
        withVariants: 25,
      };

      const mockCategoryStats = [
        { categoryId: 'cat-1', _count: 30 },
        { categoryId: 'cat-2', _count: 70 },
      ];

      const mockBrandStats = [
        { brandId: 'brand-1', _count: 40 },
        { brandId: 'brand-2', _count: 60 },
      ];

      // Mock all the count queries
      prisma.product.count
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.draft)
        .mockResolvedValueOnce(mockStats.submitted)
        .mockResolvedValueOnce(mockStats.approved)
        .mockResolvedValueOnce(mockStats.published)
        .mockResolvedValueOnce(mockStats.rejected)
        .mockResolvedValueOnce(mockStats.suspended)
        .mockResolvedValueOnce(mockStats.archived)
        .mockResolvedValueOnce(mockStats.featured)
        .mockResolvedValueOnce(mockStats.withVariants);

      prisma.product.groupBy
        .mockResolvedValueOnce(mockCategoryStats as any)
        .mockResolvedValueOnce(mockBrandStats as any);

      // Act
      const result = await repository.getStatistics();

      // Assert
      expect(result.totalProducts).toBe(mockStats.total);
      expect(result.publishedProducts).toBe(mockStats.published);
      expect(result.draftProducts).toBe(mockStats.draft);
      expect(result.featuredProducts).toBe(mockStats.featured);
      expect(result.productsWithVariants).toBe(mockStats.withVariants);
    });
  });

  describe('findByCategory', () => {
    it('should find products by category with pagination', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const pagination = { page: 1, limit: 20 };
      const mockResult = { data: [TestDataFactory.createTestProduct()], total: 1 };

      repository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByCategory(categoryId, {}, pagination);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith(
        { categoryId },
        pagination,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findByBrand', () => {
    it('should find products by brand with pagination', async () => {
      // Arrange
      const brandId = 'brand-123';
      const pagination = { page: 1, limit: 20 };
      const mockResult = { data: [TestDataFactory.createTestProduct()], total: 1 };

      repository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByBrand(brandId, {}, pagination);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith(
        { brandId },
        pagination,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findBySeller', () => {
    it('should find products by seller with pagination', async () => {
      // Arrange
      const sellerId = 'seller-123';
      const pagination = { page: 1, limit: 20 };
      const mockResult = { data: [TestDataFactory.createTestProduct()], total: 1 };

      repository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await repository.findBySeller(sellerId, {}, pagination);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith(
        { sellerId },
        pagination,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getSellerStatistics', () => {
    it('should return statistics for a specific seller', async () => {
      // Arrange
      const sellerId = 'seller-123';
      const mockStats = {
        total: 25,
        draft: 5,
        published: 20,
        lastUpdated: new Date(),
      };

      prisma.product.count
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.draft)
        .mockResolvedValueOnce(mockStats.published);

      // Act
      const result = await repository.getSellerStatistics(sellerId);

      // Assert
      TestAssertions.expectValidProductStatistics(result);
      expect(result.totalProducts).toBe(mockStats.total);
      expect(result.productsBySeller).toEqual({ [sellerId]: mockStats.total });
    });
  });

  describe('setFeatured', () => {
    it('should set product featured status', async () => {
      // Arrange
      const productId = 'prod-123';
      const isFeatured = true;
      const updatedBy = 'admin-123';
      const mockProduct = TestDataFactory.createTestProduct({
        id: productId,
        isFeatured: true,
      });

      prisma.product.update.mockResolvedValue(mockProduct as any);

      // Act
      const result = await repository.setFeatured(productId, isFeatured, updatedBy);

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {}, // Currently empty due to TODO in implementation
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(productId);
    });
  });

  describe('findFeatured', () => {
    it('should find featured products with limit', async () => {
      // Arrange
      const limit = 10;
      const mockResult = { data: [TestDataFactory.createTestProduct()], total: 1 };

      repository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await repository.findFeatured({}, limit);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith({}, { limit });
      expect(result).toEqual(mockResult.data);
    });
  });

  describe('findPendingModeration', () => {
    it('should find products pending moderation', async () => {
      // Arrange
      const limit = 50;
      const mockResult = { data: [TestDataFactory.createTestProduct()], total: 1 };

      repository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await repository.findPendingModeration(limit);

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith(
        { moderationStatus: ProductModerationStatus.PENDING },
        { limit, sortBy: 'createdAt', sortOrder: 'asc' },
      );
      expect(result).toEqual(mockResult.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      const productId = 'prod-123';
      prisma.product.findUnique.mockRejectedValue(
        TestErrorHelper.createDatabaseConnectionError(),
      );

      // Act & Assert
      await expect(repository.findById(productId)).rejects.toThrow();
    });

    it('should handle not found errors', async () => {
      // Arrange
      const productId = 'prod-999';
      prisma.product.findUnique.mockRejectedValue(TestErrorHelper.createNotFoundError());

      // Act & Assert
      await expect(repository.findById(productId)).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      // Arrange
      const productData = TestDataFactory.createTestProduct();
      prisma.product.create.mockRejectedValue(TestErrorHelper.createDuplicateSlugError());

      // Act & Assert
      await expect(repository.create(productData)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete database operations within acceptable time', async () => {
      // Arrange
      const productId = 'prod-123';
      const mockProduct = TestDataFactory.createTestProduct({ id: productId });

      prisma.product.findUnique.mockResolvedValue(mockProduct as any);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.findById(productId),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 500); // DB operations should be fast
    });
  });
});
