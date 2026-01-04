import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as request from 'supertest';

import { BrandModule } from '../brand.module';
import { BrandService } from '../brand.service';
import { BrandRepository } from '../repositories/brand.repository';
import { BrandAuditService } from '../services/brand-audit.service';
import { BrandRequestService } from '../services/brand-request.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto } from '../dtos/update-brand.dto';

describe('Brand Integration Tests', () => {
  let app: INestApplication;
  let brandService: BrandService;
  let brandRepository: BrandRepository;
  let prismaService: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockSellerUser = {
    id: 'seller-1',
    email: 'seller@example.com',
    role: 'SELLER',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BrandModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        brand: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
          groupBy: jest.fn(),
        },
        product: {
          count: jest.fn(),
        },
        brandAuditLog: {
          create: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
          groupBy: jest.fn(),
        },
        brandRequest: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
      })
      .overrideProvider(LoggerService)
      .useValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      })
      .overrideProvider(EventEmitter2)
      .useValue({
        emit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    brandService = moduleFixture.get<BrandService>(BrandService);
    brandRepository = moduleFixture.get<BrandRepository>(BrandRepository);
    prismaService = moduleFixture.get(PrismaService);
    eventEmitter = moduleFixture.get(EventEmitter2);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Brand CRUD Workflow', () => {
    it('should complete full brand lifecycle', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'Integration Test Brand',
        slug: 'integration-test-brand',
        description: 'Brand created during integration test',
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://example.com',
        scope: BrandScope.GLOBAL,
        categoryIds: ['cat-1', 'cat-2'],
      };

      const mockCreatedBrand = {
        id: 'brand-integration-1',
        ...createBrandDto,
        status: BrandStatus.DRAFT,
        isVerified: false,
        sellerId: null,
        categories: [
          { categoryId: 'cat-1', category: { id: 'cat-1', name: 'Category 1' } },
          { categoryId: 'cat-2', category: { id: 'cat-2', name: 'Category 2' } },
        ],
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      };

      // Mock repository responses
      prismaService.brand.findFirst
        .mockResolvedValueOnce(null) // findBySlug check
        .mockResolvedValueOnce(null) // findByName check
        .mockResolvedValueOnce(mockCreatedBrand); // findById for update

      prismaService.brand.create.mockResolvedValue(mockCreatedBrand);
      prismaService.brand.update.mockResolvedValue({
        ...mockCreatedBrand,
        status: BrandStatus.ACTIVE,
      });
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);
      prismaService.product.count.mockResolvedValue(0);

      // Step 1: Create brand
      const createdBrand = await brandService.create(createBrandDto, 'user-1', 'ADMIN');
      
      expect(createdBrand.name).toBe('Integration Test Brand');
      expect(createdBrand.status).toBe(BrandStatus.DRAFT);
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.created', createdBrand);

      // Step 2: Update brand status to active
      const statusUpdate = {
        status: BrandStatus.ACTIVE,
        reason: 'Brand approved for use',
      };

      const activeBrand = await brandService.updateStatus(
        'brand-integration-1',
        statusUpdate,
        'user-1',
        'ADMIN',
      );

      expect(activeBrand.status).toBe(BrandStatus.ACTIVE);
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.status_changed', activeBrand);

      // Step 3: Update brand details
      const updateDto: UpdateBrandDto = {
        description: 'Updated description during integration test',
      };

      prismaService.brand.update.mockResolvedValue({
        ...mockCreatedBrand,
        ...updateDto,
        status: BrandStatus.ACTIVE,
      });

      const updatedBrand = await brandService.update(
        'brand-integration-1',
        updateDto,
        'user-1',
        'ADMIN',
      );

      expect(updatedBrand.description).toBe('Updated description during integration test');
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.updated', updatedBrand);

      // Step 4: Delete brand
      const deletedBrand = await brandService.delete('brand-integration-1', 'user-1', 'ADMIN');

      expect(deletedBrand.status).toBe(BrandStatus.ARCHIVED);
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.deleted', deletedBrand);

      // Verify audit logs were created for each operation
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledTimes(4);
    });

    it('should handle brand request workflow', async () => {
      const createRequestDto = {
        type: 'NEW_BRAND' as const,
        brandName: 'Requested Brand',
        brandSlug: 'requested-brand',
        description: 'Brand requested by seller',
        categoryIds: ['cat-1'],
        businessJustification: 'We need this brand for our new product line',
        expectedUsage: 'Will be used for 10+ products',
      };

      const mockRequest = {
        id: 'request-1',
        ...createRequestDto,
        status: 'PENDING',
        requesterId: 'seller-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockApprovedBrand = {
        id: 'brand-from-request-1',
        name: 'Requested Brand',
        slug: 'requested-brand',
        status: BrandStatus.ACTIVE,
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
        categories: [],
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock repository responses
      prismaService.brandRequest.create.mockResolvedValue(mockRequest as any);
      prismaService.brandRequest.findFirst.mockResolvedValue(mockRequest as any);
      prismaService.brandRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
        handledBy: 'admin-1',
        handledAt: new Date(),
      } as any);
      prismaService.brand.create.mockResolvedValue(mockApprovedBrand as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      const brandRequestService = app.get<BrandRequestService>(BrandRequestService);

      // Step 1: Seller creates brand request
      const createdRequest = await brandRequestService.create(createRequestDto, 'seller-1');
      
      expect(createdRequest.brandName).toBe('Requested Brand');
      expect(createdRequest.status).toBe('PENDING');

      // Step 2: Admin approves request
      const handleDto = {
        action: 'APPROVE' as const,
        adminNotes: 'Request approved - valid business case',
      };

      const handledRequest = await brandRequestService.handle(
        'request-1',
        handleDto,
        'admin-1',
      );

      expect(handledRequest.status).toBe('APPROVED');

      // Verify events were emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'brand_request.created',
        expect.objectContaining({ id: 'request-1' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'brand_request.approved',
        expect.objectContaining({ id: 'request-1' }),
      );
    });
  });

  describe('API Endpoint Integration', () => {
    it('should handle GET /brands with authentication', async () => {
      const mockBrands = [
        {
          id: 'brand-1',
          name: 'Test Brand',
          slug: 'test-brand',
          status: BrandStatus.ACTIVE,
          scope: BrandScope.GLOBAL,
          categories: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.brand.findMany.mockResolvedValue(mockBrands as any);
      prismaService.brand.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('should handle POST /brands with validation', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'API Test Brand',
        slug: 'api-test-brand',
        description: 'Brand created via API test',
        scope: BrandScope.GLOBAL,
        categoryIds: ['cat-1'],
      };

      const mockCreatedBrand = {
        id: 'brand-api-1',
        ...createBrandDto,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.brand.findFirst.mockResolvedValue(null);
      prismaService.brand.create.mockResolvedValue(mockCreatedBrand as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', 'Bearer admin-token')
        .send(createBrandDto)
        .expect(201);

      expect(response.body.name).toBe('API Test Brand');
      expect(response.body.status).toBe(BrandStatus.DRAFT);
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        slug: 'invalid-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle authentication errors', async () => {
      await request(app.getHttpServer())
        .post('/brands')
        .send({})
        .expect(401);
    });

    it('should handle authorization errors', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'Unauthorized Brand',
        slug: 'unauthorized-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', 'Bearer seller-token') // Seller trying to create global brand
        .send(createBrandDto)
        .expect(403);
    });
  });

  describe('Database Transaction Integration', () => {
    it('should handle concurrent brand creation', async () => {
      const createBrandDto1: CreateBrandDto = {
        name: 'Concurrent Brand 1',
        slug: 'concurrent-brand-1',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      const createBrandDto2: CreateBrandDto = {
        name: 'Concurrent Brand 2',
        slug: 'concurrent-brand-2',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      const mockBrand1 = {
        id: 'brand-concurrent-1',
        ...createBrandDto1,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBrand2 = {
        id: 'brand-concurrent-2',
        ...createBrandDto2,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository to return null for slug checks (no conflicts)
      prismaService.brand.findFirst.mockResolvedValue(null);
      prismaService.brand.create
        .mockResolvedValueOnce(mockBrand1 as any)
        .mockResolvedValueOnce(mockBrand2 as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      // Create brands concurrently
      const [brand1, brand2] = await Promise.all([
        brandService.create(createBrandDto1, 'user-1', 'ADMIN'),
        brandService.create(createBrandDto2, 'user-1', 'ADMIN'),
      ]);

      expect(brand1.name).toBe('Concurrent Brand 1');
      expect(brand2.name).toBe('Concurrent Brand 2');
      expect(prismaService.brand.create).toHaveBeenCalledTimes(2);
    });

    it('should handle slug conflicts during concurrent creation', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'Duplicate Slug Brand',
        slug: 'duplicate-slug',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      const existingBrand = {
        id: 'existing-brand',
        name: 'Existing Brand',
        slug: 'duplicate-slug',
        status: BrandStatus.ACTIVE,
      };

      // First call returns null (no conflict), second call returns existing brand (conflict)
      prismaService.brand.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingBrand as any);

      // First creation should succeed
      const mockCreatedBrand = {
        id: 'brand-first',
        ...createBrandDto,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.brand.create.mockResolvedValueOnce(mockCreatedBrand as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      const [brand1, brand2Result] = await Promise.allSettled([
        brandService.create(createBrandDto, 'user-1', 'ADMIN'),
        brandService.create(createBrandDto, 'user-2', 'ADMIN'),
      ]);

      expect(brand1.status).toBe('fulfilled');
      expect(brand2Result.status).toBe('rejected');
      if (brand2Result.status === 'rejected') {
        expect(brand2Result.reason.message).toContain('slug already exists');
      }
    });
  });

  describe('Event Integration', () => {
    it('should emit events in correct order during brand lifecycle', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'Event Test Brand',
        slug: 'event-test-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      const mockBrand = {
        id: 'brand-event-1',
        ...createBrandDto,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.brand.findFirst.mockResolvedValue(null);
      prismaService.brand.create.mockResolvedValue(mockBrand as any);
      prismaService.brand.update.mockResolvedValue({
        ...mockBrand,
        status: BrandStatus.ACTIVE,
      } as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);
      prismaService.product.count.mockResolvedValue(0);

      // Create brand
      await brandService.create(createBrandDto, 'user-1', 'ADMIN');
      
      // Update status
      await brandService.updateStatus(
        'brand-event-1',
        { status: BrandStatus.ACTIVE, reason: 'Approved' },
        'user-1',
        'ADMIN',
      );

      // Delete brand
      await brandService.delete('brand-event-1', 'user-1', 'ADMIN');

      // Verify events were emitted in correct order
      const emitCalls = eventEmitter.emit.mock.calls;
      expect(emitCalls[0][0]).toBe('brand.created');
      expect(emitCalls[1][0]).toBe('brand.status_changed');
      expect(emitCalls[2][0]).toBe('brand.deleted');
    });

    it('should handle event listener failures gracefully', async () => {
      const createBrandDto: CreateBrandDto = {
        name: 'Event Failure Test',
        slug: 'event-failure-test',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };

      const mockBrand = {
        id: 'brand-event-failure',
        ...createBrandDto,
        status: BrandStatus.DRAFT,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.brand.findFirst.mockResolvedValue(null);
      prismaService.brand.create.mockResolvedValue(mockBrand as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      // Mock event emitter to throw error
      eventEmitter.emit.mockImplementation(() => {
        throw new Error('Event listener failed');
      });

      // Brand creation should still succeed even if event listeners fail
      const createdBrand = await brandService.create(createBrandDto, 'user-1', 'ADMIN');
      
      expect(createdBrand.name).toBe('Event Failure Test');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('Performance Integration', () => {
    it('should handle bulk operations efficiently', async () => {
      const brandCount = 50;
      const mockBrands = Array.from({ length: brandCount }, (_, i) => ({
        id: `bulk-brand-${i}`,
        name: `Bulk Brand ${i}`,
        slug: `bulk-brand-${i}`,
        status: BrandStatus.ACTIVE,
        scope: BrandScope.GLOBAL,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      prismaService.brand.findMany.mockResolvedValue(mockBrands as any);
      prismaService.brand.count.mockResolvedValue(brandCount);

      const startTime = Date.now();
      const result = await brandService.findAll({}, { limit: brandCount });
      const duration = Date.now() - startTime;

      expect(result.data).toHaveLength(brandCount);
      expect(result.total).toBe(brandCount);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle pagination efficiently', async () => {
      const totalBrands = 1000;
      const pageSize = 20;
      const mockBrands = Array.from({ length: pageSize }, (_, i) => ({
        id: `page-brand-${i}`,
        name: `Page Brand ${i}`,
        slug: `page-brand-${i}`,
        status: BrandStatus.ACTIVE,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      prismaService.brand.findMany.mockResolvedValue(mockBrands as any);
      prismaService.brand.count.mockResolvedValue(totalBrands);

      const result = await brandService.findAll({}, { page: 1, limit: pageSize });

      expect(result.data).toHaveLength(pageSize);
      expect(result.total).toBe(totalBrands);
      expect(prismaService.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: pageSize,
        }),
      );
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from database connection failures', async () => {
      // First call fails, second call succeeds
      prismaService.brand.findMany
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce([]);
      prismaService.brand.count.mockResolvedValue(0);

      // First attempt should fail
      await expect(brandService.findAll()).rejects.toThrow('Database connection failed');

      // Second attempt should succeed
      const result = await brandService.findAll();
      expect(result.data).toHaveLength(0);
    });

    it('should handle partial failures in batch operations', async () => {
      const createRequests = [
        { name: 'Batch Brand 1', slug: 'batch-brand-1', scope: BrandScope.GLOBAL, categoryIds: [] },
        { name: 'Batch Brand 2', slug: 'batch-brand-2', scope: BrandScope.GLOBAL, categoryIds: [] },
        { name: 'Batch Brand 3', slug: 'batch-brand-3', scope: BrandScope.GLOBAL, categoryIds: [] },
      ];

      // Mock first creation to succeed, second to fail, third to succeed
      prismaService.brand.findFirst.mockResolvedValue(null);
      prismaService.brand.create
        .mockResolvedValueOnce({ id: 'batch-1', ...createRequests[0] } as any)
        .mockRejectedValueOnce(new Error('Creation failed'))
        .mockResolvedValueOnce({ id: 'batch-3', ...createRequests[2] } as any);
      prismaService.brandAuditLog.create.mockResolvedValue({} as any);

      const results = await Promise.allSettled(
        createRequests.map(dto => brandService.create(dto, 'user-1', 'ADMIN')),
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });
});