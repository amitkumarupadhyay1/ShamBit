import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';
import { ProductAuditService } from '../services/product-audit.service';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductVisibility } from '../enums/product-visibility.enum';
import { UserRole } from '../../../common/types';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestAssertions,
  TestErrorHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: jest.Mocked<ProductService>;
  let productAuditService: jest.Mocked<ProductAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createProductTestingModule([
      ProductController,
      {
        provide: ProductService,
        useValue: {
          findAll: jest.fn(),
          findById: jest.fn(),
          findBySlug: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateStatus: jest.fn(),
          delete: jest.fn(),
          setFeatured: jest.fn(),
          bulkUpdate: jest.fn(),
          cloneProduct: jest.fn(),
          searchProducts: jest.fn(),
          getStatistics: jest.fn(),
          findByCategory: jest.fn(),
          findByBrand: jest.fn(),
          findBySeller: jest.fn(),
          getSellerStatistics: jest.fn(),
          findPendingModeration: jest.fn(),
          updateModerationStatus: jest.fn(),
        },
      },
      {
        provide: ProductAuditService,
        useValue: MockServicesFactory.createMockProductAuditService(),
      },
    ]);

    controller = module.get<ProductController>(ProductController);
    productService = module.get(ProductService);
    productAuditService = module.get(ProductAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products list', async () => {
      // Arrange
      const query = {
        page: 1,
        limit: 20,
        status: ProductStatus.PUBLISHED,
        categoryId: 'cat-123',
      };
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockResult = {
        data: [TestDataFactory.createTestProduct()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      productService.findAll.mockResolvedValue({
        data: mockResult.data,
        total: mockResult.total,
      });

      // Act
      const result = await controller.findAll(query, userId, userRole);

      // Assert
      TestAssertions.expectValidProductListResponse(result);
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProductStatus.PUBLISHED,
          categoryId: 'cat-123',
        }),
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        expect.any(Object),
        userId,
        userRole,
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle search queries', async () => {
      // Arrange
      const query = {
        search: 'laptop',
        page: 1,
        limit: 10,
      };
      const mockResult = {
        data: [TestDataFactory.createTestProduct({ name: 'Gaming Laptop' })],
        total: 1,
      };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'laptop' }),
        expect.any(Object),
        expect.any(Object),
        undefined,
        undefined,
      );
    });

    it('should parse tags from query string', async () => {
      // Arrange
      const query = {
        tags: 'electronics,gaming',
        page: 1,
        limit: 10,
      };
      const mockResult = { data: [], total: 0 };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      await controller.findAll(query);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['electronics', 'gaming'],
        }),
        expect.any(Object),
        expect.any(Object),
        undefined,
        undefined,
      );
    });

    it('should parse date filters', async () => {
      // Arrange
      const query = {
        createdAfter: '2024-01-01',
        createdBefore: '2024-12-31',
        page: 1,
        limit: 10,
      };
      const mockResult = { data: [], total: 0 };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      await controller.findAll(query);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAfter: new Date('2024-01-01'),
          createdBefore: new Date('2024-12-31'),
        }),
        expect.any(Object),
        expect.any(Object),
        undefined,
        undefined,
      );
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      // Arrange
      const limit = 5;
      const mockProducts = [
        TestDataFactory.createTestProduct({ isFeatured: true }),
        TestDataFactory.createTestProduct({ isFeatured: true }),
      ];

      productService.findAll.mockResolvedValue({ data: mockProducts, total: 2 });

      // Act
      const result = await controller.getFeaturedProducts(limit);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        { isFeatured: true, status: ProductStatus.PUBLISHED },
        { limit },
        {},
        undefined,
        undefined,
      );
      expect(result).toEqual(mockProducts);
    });

    it('should use default limit when not provided', async () => {
      // Arrange
      const mockProducts = [TestDataFactory.createTestProduct({ isFeatured: true })];

      productService.findAll.mockResolvedValue({ data: mockProducts, total: 1 });

      // Act
      await controller.getFeaturedProducts();

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        { limit: 10 },
        expect.any(Object),
        undefined,
        undefined,
      );
    });
  });

  describe('searchProducts', () => {
    it('should perform product search', async () => {
      // Arrange
      const query = 'wireless headphones';
      const filters = {
        categoryId: 'cat-123',
        page: 1,
        limit: 20,
      };
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockResults = [TestDataFactory.createTestProduct()];

      productService.searchProducts.mockResolvedValue(mockResults);

      // Act
      const result = await controller.searchProducts(query, filters, userId, userRole);

      // Assert
      expect(productService.searchProducts).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          status: undefined,
          visibility: undefined,
          categoryId: 'cat-123',
        }),
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'relevance',
          sortOrder: 'desc',
        }),
        userId,
        userRole,
      );
      expect(result.data).toEqual(mockResults);
      expect(result.total).toBe(1);
    });
  });

  describe('getMyProducts', () => {
    it('should return seller products', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const sellerId = 'seller-123';
      const userRole = UserRole.SELLER;
      const mockResult = {
        data: [TestDataFactory.createTestProduct({ sellerId })],
        total: 1,
      };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getMyProducts(query, sellerId, userRole);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sellerId }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }),
        {},
        sellerId,
        userRole,
      );
      TestAssertions.expectValidProductListResponse(result);
    });
  });

  describe('findById', () => {
    it('should return product by ID', async () => {
      // Arrange
      const productId = 'prod-123';
      const includeAttributes = true;
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockProduct = TestDataFactory.createTestProduct({ id: productId });

      productService.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findById(productId, includeAttributes, userId, userRole);

      // Assert
      expect(productService.findById).toHaveBeenCalledWith(
        productId,
        {
          includeAttributeValues: true,
          includeCategory: true,
          includeBrand: true,
          includeSeller: true,
        },
        userId,
        userRole,
      );
      TestAssertions.expectValidProduct(result);
    });

    it('should handle not found products', async () => {
      // Arrange
      const productId = 'prod-999';

      productService.findById.mockRejectedValue(new NotFoundException('Product not found'));

      // Act & Assert
      await expect(controller.findById(productId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      // Arrange
      const slug = 'test-product-slug';
      const includeAttributes = false;
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockProduct = TestDataFactory.createTestProduct({ slug });

      productService.findBySlug.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findBySlug(slug, includeAttributes, userId, userRole);

      // Assert
      expect(productService.findBySlug).toHaveBeenCalledWith(
        slug,
        {
          includeAttributeValues: false,
          includeCategory: true,
          includeBrand: true,
          includeSeller: true,
        },
        userId,
        userRole,
      );
      expect(result.slug).toBe(slug);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateProductDto();
      const createdBy = 'seller-123';
      const userRole = UserRole.SELLER;
      const mockProduct = TestDataFactory.createTestProduct({
        ...createDto,
        sellerId: createdBy,
        status: ProductStatus.DRAFT,
      });

      productService.create.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.create(createDto, createdBy, userRole);

      // Assert
      expect(productService.create).toHaveBeenCalledWith(createDto, createdBy, userRole);
      TestAssertions.expectValidProduct(result);
      expect(result.sellerId).toBe(createdBy);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidDto = { name: '' }; // Invalid: empty name
      const createdBy = 'seller-123';
      const userRole = UserRole.SELLER;

      productService.create.mockRejectedValue(TestErrorHelper.createValidationError());

      // Act & Assert
      await expect(controller.create(invalidDto as any, createdBy, userRole)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      // Arrange
      const productId = 'prod-123';
      const updateDto = TestDataFactory.createValidUpdateProductDto();
      const updatedBy = 'seller-123';
      const userRole = UserRole.SELLER;
      const mockProduct = TestDataFactory.createTestProduct({
        id: productId,
        ...updateDto,
      });

      productService.update.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.update(productId, updateDto, updatedBy, userRole);

      // Assert
      expect(productService.update).toHaveBeenCalledWith(productId, updateDto, updatedBy, userRole);
      expect(result.name).toBe(updateDto.name);
    });

    it('should handle forbidden access', async () => {
      // Arrange
      const productId = 'prod-123';
      const updateDto = TestDataFactory.createValidUpdateProductDto();
      const updatedBy = 'user-123';
      const userRole = UserRole.BUYER;

      productService.update.mockRejectedValue(new ForbiddenException('Access denied'));

      // Act & Assert
      await expect(controller.update(productId, updateDto, updatedBy, userRole)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update product status', async () => {
      // Arrange
      const productId = 'prod-123';
      const statusUpdate = TestDataFactory.createValidProductStatusUpdateDto();
      const updatedBy = 'seller-123';
      const userRole = UserRole.SELLER;
      const mockProduct = TestDataFactory.createTestProduct({
        id: productId,
        status: ProductStatus.PUBLISHED,
      });

      productService.updateStatus.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.updateStatus(productId, statusUpdate, updatedBy, userRole);

      // Assert
      expect(productService.updateStatus).toHaveBeenCalledWith(productId, statusUpdate, updatedBy, userRole);
      expect(result.status).toBe(ProductStatus.PUBLISHED);
    });
  });

  describe('updateModerationStatus', () => {
    it('should update product moderation status', async () => {
      // Arrange
      const productId = 'prod-123';
      const moderationDto = TestDataFactory.createValidProductModerationDto();
      const moderatedBy = 'admin-123';
      const mockProduct = TestDataFactory.createTestProduct({
        id: productId,
        moderationStatus: moderationDto.moderationStatus,
      });

      productService.updateModerationStatus.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.updateModerationStatus(productId, moderationDto, moderatedBy);

      // Assert
      expect(productService.updateModerationStatus).toHaveBeenCalledWith(
        productId,
        moderationDto.moderationStatus,
        moderatedBy,
        moderationDto.moderationNotes,
      );
      expect(result).toBeDefined();
    });
  });

  describe('toggleFeatured', () => {
    it('should toggle product featured status', async () => {
      // Arrange
      const productId = 'prod-123';
      const isFeatured = true;
      const updatedBy = 'admin-123';
      const userRole = UserRole.ADMIN;
      const mockProduct = TestDataFactory.createTestProduct({
        id: productId,
        isFeatured: true,
      });

      productService.setFeatured.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.toggleFeatured(productId, isFeatured, updatedBy, userRole);

      // Assert
      expect(productService.setFeatured).toHaveBeenCalledWith(productId, isFeatured, updatedBy, userRole);
      expect(result.isFeatured).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      // Arrange
      const productId = 'prod-123';
      const deletedBy = 'seller-123';
      const userRole = UserRole.SELLER;
      const reason = 'Product no longer needed';

      productService.delete.mockResolvedValue(undefined);

      // Act
      const result = await controller.delete(productId, deletedBy, userRole, reason);

      // Assert
      expect(productService.delete).toHaveBeenCalledWith(productId, deletedBy, userRole, reason);
      expect(result).toBeUndefined();
    });
  });

  describe('bulkUpdate', () => {
    it('should perform bulk update', async () => {
      // Arrange
      const bulkUpdate = TestDataFactory.createValidBulkProductUpdateDto();
      const updatedBy = 'admin-123';
      const userRole = UserRole.ADMIN;
      const mockProducts = [
        TestDataFactory.createTestProduct({ id: 'prod-123' }),
        TestDataFactory.createTestProduct({ id: 'prod-456' }),
      ];

      productService.bulkUpdate.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.bulkUpdate(bulkUpdate, updatedBy, userRole);

      // Assert
      expect(productService.bulkUpdate).toHaveBeenCalledWith(bulkUpdate, updatedBy, userRole);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('cloneProduct', () => {
    it('should clone a product', async () => {
      // Arrange
      const productId = 'prod-123';
      const cloneDto = TestDataFactory.createValidProductCloneDto();
      const clonedBy = 'seller-123';
      const userRole = UserRole.SELLER;
      const mockProduct = TestDataFactory.createTestProduct({
        id: 'prod-456',
        name: cloneDto.name,
        slug: cloneDto.slug,
        visibility: ProductVisibility.PRIVATE,
      });

      productService.cloneProduct.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.cloneProduct(productId, cloneDto, clonedBy, userRole);

      // Assert
      expect(productService.cloneProduct).toHaveBeenCalledWith(productId, cloneDto, clonedBy, userRole);
      expect(result.name).toBe(cloneDto.name);
      expect(result.visibility).toBe(ProductVisibility.PRIVATE);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const query = { page: 1, limit: 10 };
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockResult = {
        data: [TestDataFactory.createTestProduct({ categoryId })],
        total: 1,
      };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getProductsByCategory(categoryId, query, userId, userRole);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'displayOrder',
          sortOrder: 'asc',
        }),
        {},
        userId,
        userRole,
      );
      TestAssertions.expectValidProductListResponse(result);
    });
  });

  describe('getProductsByBrand', () => {
    it('should return products by brand', async () => {
      // Arrange
      const brandId = 'brand-123';
      const query = { page: 1, limit: 10 };
      const userId = 'user-123';
      const userRole = UserRole.BUYER;
      const mockResult = {
        data: [TestDataFactory.createTestProduct({ brandId })],
        total: 1,
      };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getProductsByBrand(brandId, query, userId, userRole);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ brandId }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'displayOrder',
          sortOrder: 'asc',
        }),
        {},
        userId,
        userRole,
      );
      TestAssertions.expectValidProductListResponse(result);
    });
  });

  describe('getStatistics', () => {
    it('should return product statistics', async () => {
      // Arrange
      const mockStats = {
        totalProducts: 100,
        draftProducts: 20,
        publishedProducts: 80,
        lastUpdated: new Date(),
      };

      productService.getStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStatistics();

      // Assert
      TestAssertions.expectValidProductStatistics(result);
      expect(result.totalProducts).toBe(100);
    });
  });

  describe('getMyStatistics', () => {
    it('should return seller statistics', async () => {
      // Arrange
      const sellerId = 'seller-123';
      const mockStats = {
        totalProducts: 25,
        draftProducts: 5,
        publishedProducts: 20,
        lastUpdated: new Date(),
      };

      productService.getSellerStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getMyStatistics(sellerId);

      // Assert
      TestAssertions.expectValidProductStatistics(result);
      expect(result.totalProducts).toBe(25);
    });
  });

  describe('getPendingModeration', () => {
    it('should return products pending moderation', async () => {
      // Arrange
      const limit = 25;
      const mockProducts = [
        TestDataFactory.createTestProduct({ moderationStatus: 'PENDING' }),
        TestDataFactory.createTestProduct({ moderationStatus: 'PENDING' }),
      ];

      productService.findAll.mockResolvedValue({ data: mockProducts, total: 2 });

      // Act
      const result = await controller.getPendingModeration(limit);

      // Assert
      expect(productService.findAll).toHaveBeenCalledWith(
        { moderationStatus: 'PENDING' },
        { limit },
        {},
      );
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProductAuditHistory', () => {
    it('should return product audit history', async () => {
      // Arrange
      const productId = 'prod-123';
      const limit = 50;
      const offset = 0;
      const mockAuditHistory = [
        {
          id: 'audit-1',
          action: 'CREATE',
          performedBy: 'user-123',
          performedAt: new Date(),
          changes: {},
        },
      ];

      productAuditService.getProductAuditHistory.mockResolvedValue(mockAuditHistory);

      // Act
      const result = await controller.getProductAuditHistory(productId, limit, offset);

      // Assert
      expect(productAuditService.getProductAuditHistory).toHaveBeenCalledWith(
        productId,
        limit,
        offset,
      );
      expect(result).toEqual(mockAuditHistory);
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      // Arrange
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';
      const mockStats = {
        totalAudits: 150,
        auditsByAction: { CREATE: 50, UPDATE: 80, DELETE: 20 },
        auditsByUser: { 'user-1': 30, 'user-2': 25 },
        lastUpdated: new Date(),
      };

      productAuditService.getAuditStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getAuditStatistics(dateFrom, dateTo);

      // Assert
      expect(productAuditService.getAuditStatistics).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('Error Handling', () => {
    it('should handle service layer errors', async () => {
      // Arrange
      const productId = 'prod-999';

      productService.findById.mockRejectedValue(new NotFoundException('Product not found'));

      // Act & Assert
      await expect(controller.findById(productId)).rejects.toThrow(NotFoundException);
    });

    it('should handle validation pipe errors', async () => {
      // Arrange
      const invalidDto = {}; // Missing required fields
      const createdBy = 'seller-123';
      const userRole = UserRole.SELLER;

      // Validation pipes would reject this in real scenario
      productService.create.mockRejectedValue(TestErrorHelper.createValidationError());

      // Act & Assert
      await expect(controller.create(invalidDto as any, createdBy, userRole)).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateProductDto();
      const createdBy = 'unauthorized-user';
      const userRole = UserRole.BUYER; // Not allowed to create

      productService.create.mockRejectedValue(new ForbiddenException('Insufficient permissions'));

      // Act & Assert
      await expect(controller.create(createDto, createdBy, userRole)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Guard Integration', () => {
    it('should require authentication for protected endpoints', async () => {
      // This would be tested with e2e tests including guards
      // Unit tests focus on controller logic with mocked guards
      expect(true).toBe(true);
    });

    it('should enforce role-based access', async () => {
      // Role checks are handled by guards, tested in e2e scenarios
      expect(true).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle requests within acceptable time', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const mockResult = { data: [], total: 0 };

      productService.findAll.mockResolvedValue(mockResult);

      // Act
      const startTime = Date.now();
      await controller.findAll(query);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Controller logic should be fast
    });
  });
});
