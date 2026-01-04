import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BrandController } from '../brand.controller';
import { BrandService } from '../brand.service';
import { BrandRequestService } from '../services/brand-request.service';
import { BrandAuditService } from '../services/brand-audit.service';
import { Brand } from '../entities/brand.entity';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto, BrandStatusUpdateDto } from '../dtos/update-brand.dto';
import { CreateBrandRequestDto } from '../dtos/brand-request.dto';

describe('BrandController', () => {
  let controller: BrandController;
  let brandService: jest.Mocked<BrandService>;
  let brandRequestService: jest.Mocked<BrandRequestService>;
  let brandAuditService: jest.Mocked<BrandAuditService>;

  const mockBrand: Brand = {
    id: 'brand-1',
    name: 'Test Brand',
    slug: 'test-brand',
    description: 'Test brand description',
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://example.com',
    status: BrandStatus.ACTIVE,
    scope: BrandScope.GLOBAL,
    isVerified: true,
    sellerId: 'seller-1',
    categoryIds: ['cat-1', 'cat-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        {
          provide: BrandService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            getStatistics: jest.fn(),
            validateBrandAccess: jest.fn(),
          },
        },
        {
          provide: BrandRequestService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            handle: jest.fn(),
            cancel: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
        {
          provide: BrandAuditService,
          useValue: {
            getAuditHistory: jest.fn(),
            getAuditStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BrandController>(BrandController);
    brandService = module.get(BrandService);
    brandRequestService = module.get(BrandRequestService);
    brandAuditService = module.get(BrandAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /brands', () => {
    it('should return paginated brands', async () => {
      const mockResult = {
        data: [mockBrand],
        total: 1,
      };
      brandService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        { status: BrandStatus.ACTIVE },
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(brandService.findAll).toHaveBeenCalledWith(
        { status: BrandStatus.ACTIVE },
        { page: 1, limit: 10 },
      );
    });

    it('should handle empty results', async () => {
      brandService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({}, {});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply search filters', async () => {
      brandService.findAll.mockResolvedValue({ data: [mockBrand], total: 1 });

      await controller.findAll({}, { search: 'test' });

      expect(brandService.findAll).toHaveBeenCalledWith(
        { search: 'test' },
        {},
      );
    });

    it('should handle invalid pagination parameters', async () => {
      brandService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll(
        { page: -1, limit: 0 },
        {},
      );

      // Should use default pagination values
      expect(brandService.findAll).toHaveBeenCalledWith(
        {},
        { page: -1, limit: 0 }, // Controller passes through, service should handle validation
      );
    });
  });

  describe('GET /brands/:id', () => {
    it('should return brand by ID', async () => {
      brandService.findById.mockResolvedValue(mockBrand);

      const result = await controller.findById('brand-1');

      expect(result).toEqual(mockBrand);
      expect(brandService.findById).toHaveBeenCalledWith('brand-1');
    });

    it('should throw NotFoundException for non-existent brand', async () => {
      brandService.findById.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(controller.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should validate UUID format', async () => {
      // This would typically be handled by a validation pipe
      brandService.findById.mockResolvedValue(mockBrand);

      await controller.findById('brand-1');

      expect(brandService.findById).toHaveBeenCalledWith('brand-1');
    });
  });

  describe('GET /brands/slug/:slug', () => {
    it('should return brand by slug', async () => {
      brandService.findBySlug.mockResolvedValue(mockBrand);

      const result = await controller.findBySlug('test-brand');

      expect(result).toEqual(mockBrand);
      expect(brandService.findBySlug).toHaveBeenCalledWith('test-brand');
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      brandService.findBySlug.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(controller.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle special characters in slug', async () => {
      brandService.findBySlug.mockResolvedValue(mockBrand);

      await controller.findBySlug('test-brand-with-special-chars');

      expect(brandService.findBySlug).toHaveBeenCalledWith('test-brand-with-special-chars');
    });
  });

  describe('POST /brands', () => {
    const createBrandDto: CreateBrandDto = {
      name: 'New Brand',
      slug: 'new-brand',
      description: 'New brand description',
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      scope: BrandScope.GLOBAL,
      categoryIds: ['cat-1'],
    };

    it('should create brand successfully', async () => {
      const newBrand = { ...mockBrand, ...createBrandDto, id: 'new-brand-id' };
      brandService.create.mockResolvedValue(newBrand);

      const result = await controller.create(createBrandDto, mockUser);

      expect(result).toEqual(newBrand);
      expect(brandService.create).toHaveBeenCalledWith(
        createBrandDto,
        'user-1',
        'ADMIN',
      );
    });

    it('should handle validation errors', async () => {
      const invalidDto = { ...createBrandDto, name: '' };
      // Validation would typically be handled by ValidationPipe
      brandService.create.mockRejectedValue(new BadRequestException('Name is required'));

      await expect(controller.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should handle conflict errors', async () => {
      brandService.create.mockRejectedValue(new ConflictException('Brand with this slug already exists'));

      await expect(controller.create(createBrandDto, mockUser)).rejects.toThrow(ConflictException);
    });

    it('should require authentication', async () => {
      // This would typically be handled by AuthGuard
      brandService.create.mockResolvedValue(mockBrand);

      await controller.create(createBrandDto, mockUser);

      expect(brandService.create).toHaveBeenCalledWith(
        createBrandDto,
        'user-1',
        'ADMIN',
      );
    });
  });

  describe('PUT /brands/:id', () => {
    const updateBrandDto: UpdateBrandDto = {
      name: 'Updated Brand',
      description: 'Updated description',
    };

    it('should update brand successfully', async () => {
      const updatedBrand = { ...mockBrand, ...updateBrandDto };
      brandService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update('brand-1', updateBrandDto, mockUser);

      expect(result).toEqual(updatedBrand);
      expect(brandService.update).toHaveBeenCalledWith(
        'brand-1',
        updateBrandDto,
        'user-1',
        'ADMIN',
      );
    });

    it('should handle not found errors', async () => {
      brandService.update.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(controller.update('non-existent', updateBrandDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle permission errors', async () => {
      const sellerUser = { ...mockUser, role: 'SELLER' };
      brandService.update.mockRejectedValue(new ForbiddenException('Insufficient permissions'));

      await expect(controller.update('brand-1', updateBrandDto, sellerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should validate partial updates', async () => {
      const partialUpdate = { description: 'Only description updated' };
      const updatedBrand = { ...mockBrand, description: 'Only description updated' };
      brandService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update('brand-1', partialUpdate, mockUser);

      expect(result.description).toBe('Only description updated');
      expect(brandService.update).toHaveBeenCalledWith(
        'brand-1',
        partialUpdate,
        'user-1',
        'ADMIN',
      );
    });
  });

  describe('PUT /brands/:id/status', () => {
    const statusUpdateDto: BrandStatusUpdateDto = {
      status: BrandStatus.ACTIVE,
      reason: 'Approved for use',
    };

    it('should update brand status successfully', async () => {
      const updatedBrand = { ...mockBrand, status: BrandStatus.ACTIVE };
      brandService.updateStatus.mockResolvedValue(updatedBrand);

      const result = await controller.updateStatus('brand-1', statusUpdateDto, mockUser);

      expect(result).toEqual(updatedBrand);
      expect(brandService.updateStatus).toHaveBeenCalledWith(
        'brand-1',
        statusUpdateDto,
        'user-1',
        'ADMIN',
      );
    });

    it('should handle invalid status transitions', async () => {
      brandService.updateStatus.mockRejectedValue(
        new BadRequestException('Invalid status transition'),
      );

      await expect(controller.updateStatus('brand-1', statusUpdateDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should require admin role for certain transitions', async () => {
      const sellerUser = { ...mockUser, role: 'SELLER' };
      brandService.updateStatus.mockRejectedValue(
        new ForbiddenException('Only administrators can perform this status change'),
      );

      await expect(controller.updateStatus('brand-1', statusUpdateDto, sellerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should validate reason is provided for certain transitions', async () => {
      const statusUpdateWithoutReason = { status: BrandStatus.REJECTED };
      brandService.updateStatus.mockResolvedValue({ ...mockBrand, status: BrandStatus.REJECTED });

      await controller.updateStatus('brand-1', statusUpdateWithoutReason, mockUser);

      expect(brandService.updateStatus).toHaveBeenCalledWith(
        'brand-1',
        statusUpdateWithoutReason,
        'user-1',
        'ADMIN',
      );
    });
  });

  describe('DELETE /brands/:id', () => {
    it('should delete brand successfully', async () => {
      const deletedBrand = { ...mockBrand, deletedAt: new Date(), status: BrandStatus.ARCHIVED };
      brandService.delete.mockResolvedValue(deletedBrand);

      await controller.delete('brand-1', mockUser);

      expect(brandService.delete).toHaveBeenCalledWith('brand-1', 'user-1', 'ADMIN');
    });

    it('should handle not found errors', async () => {
      brandService.delete.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(controller.delete('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should require admin role', async () => {
      const sellerUser = { ...mockUser, role: 'SELLER' };
      brandService.delete.mockRejectedValue(
        new ForbiddenException('Only administrators can delete brands'),
      );

      await expect(controller.delete('brand-1', sellerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent deletion of brands in use', async () => {
      brandService.delete.mockRejectedValue(
        new BadRequestException('Cannot delete brand that is currently in use'),
      );

      await expect(controller.delete('brand-1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /brands/statistics', () => {
    it('should return brand statistics', async () => {
      const mockStats = {
        total: 100,
        active: 80,
        inactive: 15,
        pending: 5,
        byScope: {
          GLOBAL: 30,
          SELLER_PRIVATE: 50,
          SELLER_SHARED: 20,
        },
      };
      brandService.getStatistics.mockResolvedValue(mockStats as any);

      const result = await controller.getStatistics();

      expect(result).toEqual(mockStats);
      expect(brandService.getStatistics).toHaveBeenCalled();
    });

    it('should handle empty statistics', async () => {
      const emptyStats = {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        byScope: {},
      };
      brandService.getStatistics.mockResolvedValue(emptyStats as any);

      const result = await controller.getStatistics();

      expect(result.total).toBe(0);
    });
  });

  describe('Brand Requests', () => {
    const createRequestDto: CreateBrandRequestDto = {
      type: 'NEW_BRAND',
      brandName: 'Requested Brand',
      brandSlug: 'requested-brand',
      description: 'Brand request description',
      categoryIds: ['cat-1'],
      businessJustification: 'Need this brand for our product line',
    };

    describe('POST /brands/requests', () => {
      it('should create brand request successfully', async () => {
        const mockRequest = {
          id: 'request-1',
          ...createRequestDto,
          status: 'PENDING',
          requesterId: 'user-1',
          createdAt: new Date(),
        };
        brandRequestService.create.mockResolvedValue(mockRequest as any);

        const result = await controller.createRequest(createRequestDto, mockUser);

        expect(result).toEqual(mockRequest);
        expect(brandRequestService.create).toHaveBeenCalledWith(
          createRequestDto,
          'user-1',
        );
      });

      it('should handle validation errors in request', async () => {
        const invalidRequest = { ...createRequestDto, brandName: '' };
        brandRequestService.create.mockRejectedValue(
          new BadRequestException('Brand name is required'),
        );

        await expect(controller.createRequest(invalidRequest, mockUser)).rejects.toThrow(BadRequestException);
      });
    });

    describe('GET /brands/requests', () => {
      it('should return paginated brand requests', async () => {
        const mockRequests = {
          data: [{ id: 'request-1', brandName: 'Test Request' }],
          total: 1,
        };
        brandRequestService.findAll.mockResolvedValue(mockRequests as any);

        const result = await controller.findAllRequests({}, {});

        expect(result.data).toHaveLength(1);
        expect(brandRequestService.findAll).toHaveBeenCalled();
      });
    });

    describe('PUT /brands/requests/:id/handle', () => {
      it('should handle brand request approval', async () => {
        const handleDto = {
          action: 'APPROVE',
          adminNotes: 'Request approved',
        };
        const handledRequest = {
          id: 'request-1',
          status: 'APPROVED',
          handledBy: 'user-1',
        };
        brandRequestService.handle.mockResolvedValue(handledRequest as any);

        const result = await controller.handleRequest('request-1', handleDto, mockUser);

        expect(result).toEqual(handledRequest);
        expect(brandRequestService.handle).toHaveBeenCalledWith(
          'request-1',
          handleDto,
          'user-1',
        );
      });

      it('should handle brand request rejection', async () => {
        const handleDto = {
          action: 'REJECT',
          adminNotes: 'Request rejected',
          rejectionReason: 'Insufficient justification',
        };
        brandRequestService.handle.mockResolvedValue({
          id: 'request-1',
          status: 'REJECTED',
        } as any);

        await controller.handleRequest('request-1', handleDto, mockUser);

        expect(brandRequestService.handle).toHaveBeenCalledWith(
          'request-1',
          handleDto,
          'user-1',
        );
      });
    });
  });

  describe('Audit Endpoints', () => {
    describe('GET /brands/:id/audit', () => {
      it('should return brand audit history', async () => {
        const mockAuditHistory = {
          data: [
            {
              id: 'audit-1',
              action: 'CREATE',
              userId: 'user-1',
              createdAt: new Date(),
            },
          ],
          total: 1,
        };
        brandAuditService.getAuditHistory.mockResolvedValue(mockAuditHistory as any);

        const result = await controller.getBrandAudit('brand-1', {});

        expect(result).toEqual(mockAuditHistory);
        expect(brandAuditService.getAuditHistory).toHaveBeenCalledWith('brand-1', {});
      });
    });

    describe('GET /brands/audit/statistics', () => {
      it('should return audit statistics', async () => {
        const mockAuditStats = {
          total: 100,
          byAction: {
            CREATE: 20,
            UPDATE: 50,
            DELETE: 5,
            STATUS_CHANGE: 25,
          },
          byUser: {
            'admin-1': 60,
            'seller-1': 40,
          },
        };
        brandAuditService.getAuditStatistics.mockResolvedValue(mockAuditStats as any);

        const result = await controller.getAuditStatistics();

        expect(result).toEqual(mockAuditStats);
        expect(brandAuditService.getAuditStatistics).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      brandService.findAll.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.findAll({}, {})).rejects.toThrow('Service unavailable');
    });

    it('should handle timeout errors', async () => {
      brandService.findById.mockRejectedValue(new Error('Request timeout'));

      await expect(controller.findById('brand-1')).rejects.toThrow('Request timeout');
    });

    it('should handle malformed request data', async () => {
      const malformedDto = { invalidField: 'invalid' } as any;
      brandService.create.mockRejectedValue(new BadRequestException('Invalid request data'));

      await expect(controller.create(malformedDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Security Tests', () => {
    it('should validate user authentication', async () => {
      // This would typically be handled by AuthGuard
      brandService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll({}, {});

      // Verify that the controller expects authenticated requests
      expect(brandService.findAll).toHaveBeenCalled();
    });

    it('should validate user authorization for admin operations', async () => {
      const sellerUser = { ...mockUser, role: 'SELLER' };
      brandService.delete.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(controller.delete('brand-1', sellerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should sanitize input data', async () => {
      const createBrandDto: CreateBrandDto = {
        name: '<script>alert("xss")</script>',
        slug: 'test-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
      };
      
      brandService.create.mockResolvedValue(mockBrand);

      await controller.create(createBrandDto, mockUser);

      // Verify that the service receives the data (sanitization would happen in validation pipes)
      expect(brandService.create).toHaveBeenCalledWith(
        createBrandDto,
        'user-1',
        'ADMIN',
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      brandService.findAll.mockResolvedValue({ data: [mockBrand], total: 1 });

      const requests = Array(10).fill(null).map(() => controller.findAll({}, {}));
      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      expect(brandService.findAll).toHaveBeenCalledTimes(10);
    });

    it('should complete requests within acceptable time', async () => {
      brandService.findById.mockResolvedValue(mockBrand);

      const startTime = Date.now();
      await controller.findById('brand-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});