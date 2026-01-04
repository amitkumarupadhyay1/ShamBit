import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BrandService } from '../brand.service';
import { BrandRepository } from '../repositories/brand.repository';
import { BrandAuditService } from '../services/brand-audit.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { Brand } from '../entities/brand.entity';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto, BrandStatusUpdateDto } from '../dtos/update-brand.dto';

describe('BrandService', () => {
  let service: BrandService;
  let brandRepository: jest.Mocked<BrandRepository>;
  let brandAuditService: jest.Mocked<BrandAuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<LoggerService>;

  const mockBrand: Brand = new Brand({
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
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: BrandRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            count: jest.fn(),
            countByStatus: jest.fn(),
            isBrandInUse: jest.fn(),
            getStatistics: jest.fn(),
            updateStatus: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: BrandAuditService,
          useValue: {
            logAction: jest.fn(),
            getAuditHistory: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BrandService>(BrandService);
    brandRepository = module.get(BrandRepository);
    brandAuditService = module.get(BrandAuditService);
    eventEmitter = module.get(EventEmitter2);
    logger = module.get(LoggerService);
  });

  const createBrandDto: CreateBrandDto = {
    name: 'New Brand',
    slug: 'new-brand',
    description: 'New brand description',
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://example.com',
    scope: BrandScope.GLOBAL,
    categoryIds: ['cat-1'],
  };

  const updateBrandDto: UpdateBrandDto = {
    name: 'Updated Brand',
    description: 'Updated description',
  };

  const statusUpdateDto: BrandStatusUpdateDto = {
    status: BrandStatus.ACTIVE,
    reason: 'Approved for use',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated brands with filters', async () => {
      // Arrange
      const mockResult = {
        data: [mockBrand],
        total: 1,
      };
      const filters = { status: BrandStatus.ACTIVE };
      const pagination = { page: 1, limit: 10 };
      
      brandRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll(filters, pagination);

      // Assert
      expect(brandRepository.findAll).toHaveBeenCalledWith(filters, pagination);
      expect(result).toEqual(mockResult);
      expect(logger.log).toHaveBeenCalledWith('BrandService.findAll', { filters, pagination });
    });

    it('should handle empty filters and pagination', async () => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      brandRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(brandRepository.findAll).toHaveBeenCalledWith({}, {});
      expect(result).toEqual(mockResult);
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const mockResult = { data: [mockBrand], total: 1 };
      brandRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const startTime = Date.now();
      await service.findAll();
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(200);
    });
  });

  describe('findById', () => {
    it('should return brand when found', async () => {
      // Arrange
      brandRepository.findById.mockResolvedValue(mockBrand);

      // Act
      const result = await service.findById('brand-1');

      // Assert
      expect(brandRepository.findById).toHaveBeenCalledWith('brand-1');
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when brand not found', async () => {
      // Arrange
      brandRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
      expect(brandRepository.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      brandRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findById('brand-1')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return brand when found by slug', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(mockBrand);

      // Act
      const result = await service.findBySlug('test-brand');

      // Assert
      expect(brandRepository.findBySlug).toHaveBeenCalledWith('test-brand');
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when brand not found by slug', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle special characters in slug', async () => {
      // Arrange
      const specialSlug = 'test-brand-with-special-chars';
      const brand = { ...mockBrand, slug: specialSlug };
      brandRepository.findBySlug.mockResolvedValue(brand);

      // Act
      const result = await service.findBySlug(specialSlug);

      // Assert
      expect(result).toEqual(brand);
      expect(brandRepository.findBySlug).toHaveBeenCalledWith(specialSlug);
    });
  });

  describe('create', () => {
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
      // Arrange
      const newBrand = { ...mockBrand, ...createBrandDto, id: 'new-brand-id' };
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);
      brandRepository.create.mockResolvedValue(newBrand);

      // Act
      const result = await service.create(createBrandDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.findBySlug).toHaveBeenCalledWith('new-brand');
      expect(brandRepository.findByName).toHaveBeenCalledWith('New Brand');
      expect(brandRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createBrandDto,
        status: BrandStatus.DRAFT,
      }));
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        newBrand.id,
        'CREATE',
        'admin-1',
        null,
        newBrand,
        'Brand created',
        undefined,
        undefined,
        'ADMIN'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.created', newBrand);
      expect(result).toEqual(newBrand);
    });

    it('should throw ConflictException when slug already exists', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(mockBrand);

      // Act & Assert
      await expect(service.create(createBrandDto, 'admin-1', 'ADMIN')).rejects.toThrow(ConflictException);
      expect(brandRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when name already exists', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(mockBrand);

      // Act & Assert
      await expect(service.create(createBrandDto, 'admin-1', 'ADMIN')).rejects.toThrow(ConflictException);
      expect(brandRepository.create).not.toHaveBeenCalled();
    });

    it('should validate category IDs', async () => {
      // Arrange
      const invalidCategoryDto = { ...createBrandDto, categoryIds: [] };
      
      // Act & Assert
      await expect(service.create(invalidCategoryDto, 'admin-1', 'ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should handle seller-private brand creation', async () => {
      // Arrange
      const sellerBrandDto = { ...createBrandDto, scope: BrandScope.SELLER_PRIVATE };
      const sellerBrand = { 
        ...mockBrand,
        ...sellerBrandDto, 
        sellerId: 'seller-1',
        scope: BrandScope.SELLER_PRIVATE 
      };
      
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);
      brandRepository.create.mockResolvedValue(sellerBrand);

      // Act
      const result = await service.create(sellerBrandDto, 'seller-1', 'SELLER');

      // Assert
      expect(result.scope).toBe(BrandScope.SELLER_PRIVATE);
      expect(result.sellerId).toBe('seller-1');
    });
  });

  describe('update', () => {
    const updateBrandDto: UpdateBrandDto = {
      name: 'Updated Brand',
      description: 'Updated description',
    };

    it('should update brand successfully', async () => {
      // Arrange
      const updatedBrand = { ...mockBrand, ...updateBrandDto };
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRepository.update.mockResolvedValue(updatedBrand);

      // Act
      const result = await service.update('brand-1', updateBrandDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.findById).toHaveBeenCalledWith('brand-1');
      expect(brandRepository.update).toHaveBeenCalledWith('brand-1', {
        ...updateBrandDto,
        updatedBy: 'admin-1',
      });
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        'brand-1',
        'UPDATE',
        'admin-1',
        mockBrand,
        updatedBrand,
        'Brand updated',
        undefined,
        undefined,
        'ADMIN'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.updated', updatedBrand);
      expect(result).toEqual(updatedBrand);
    });

    it('should throw NotFoundException when brand not found', async () => {
      // Arrange
      brandRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent', updateBrandDto, 'admin-1', 'ADMIN')).rejects.toThrow(NotFoundException);
      expect(brandRepository.update).not.toHaveBeenCalled();
    });

    it('should validate slug uniqueness when updating slug', async () => {
      // Arrange
      const updateWithSlug = { ...updateBrandDto, slug: 'new-slug' };
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.update.mockResolvedValue({ ...mockBrand, ...updateWithSlug });

      // Act
      await service.update('brand-1', updateWithSlug, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.findBySlug).toHaveBeenCalledWith('new-slug');
    });

    it('should throw ConflictException when new slug already exists', async () => {
      // Arrange
      const updateWithSlug = { ...updateBrandDto, slug: 'existing-slug' };
      const existingBrand = { ...mockBrand, id: 'other-brand', slug: 'existing-slug' };
      
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRepository.findBySlug.mockResolvedValue(existingBrand);

      // Act & Assert
      await expect(service.update('brand-1', updateWithSlug, 'admin-1', 'ADMIN')).rejects.toThrow(ConflictException);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdate = { description: 'Only description updated' };
      const updatedBrand = { ...mockBrand, ...partialUpdate };
      
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRepository.update.mockResolvedValue(updatedBrand);

      // Act
      const result = await service.update('brand-1', partialUpdate, 'admin-1', 'ADMIN');

      // Assert
      expect(result.name).toBe(mockBrand.name); // Name unchanged
      expect(result.description).toBe('Only description updated');
    });
  });

  describe('updateStatus', () => {
    const statusUpdateDto: BrandStatusUpdateDto = {
      status: BrandStatus.ACTIVE,
      reason: 'Approved for use',
    };

    it('should update status successfully with valid transition', async () => {
      // Arrange
      const approvedBrand = new Brand({ ...mockBrand, status: BrandStatus.APPROVED });
      const activeBrand = new Brand({ ...approvedBrand, status: BrandStatus.ACTIVE });
      
      brandRepository.findById.mockResolvedValue(approvedBrand);
      brandRepository.update.mockResolvedValue(activeBrand);

      // Act
      const result = await service.updateStatus('brand-1', statusUpdateDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.update).toHaveBeenCalledWith('brand-1', { status: BrandStatus.ACTIVE });
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        'brand-1',
        'STATUS_CHANGE',
        'admin-1',
        approvedBrand,
        activeBrand,
        'Approved for use',
        undefined,
        undefined,
        'ADMIN'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.status_changed', activeBrand);
      expect(result).toEqual(activeBrand);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      // Arrange
      const activeBrand = { ...mockBrand, status: BrandStatus.ACTIVE };
      const invalidStatusUpdate = { status: BrandStatus.DRAFT, reason: 'Invalid transition' };
      
      brandRepository.findById.mockResolvedValue(activeBrand);

      // Act & Assert
      await expect(service.updateStatus('brand-1', invalidStatusUpdate, 'admin-1', 'ADMIN')).rejects.toThrow(BadRequestException);
      expect(brandRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin trying admin-only transition', async () => {
      // Arrange
      const draftBrand = { ...mockBrand, status: BrandStatus.DRAFT };
      const approveStatusUpdate = { status: BrandStatus.APPROVED, reason: 'Approve brand' };
      
      brandRepository.findById.mockResolvedValue(draftBrand);

      // Act & Assert
      await expect(service.updateStatus('brand-1', approveStatusUpdate, 'seller-1', 'SELLER')).rejects.toThrow(ForbiddenException);
    });

    it('should allow seller to transition from DRAFT to PENDING_APPROVAL', async () => {
      // Arrange
      const draftBrand = { ...mockBrand, status: BrandStatus.DRAFT };
      const pendingBrand = { ...draftBrand, status: BrandStatus.PENDING_APPROVAL };
      const pendingStatusUpdate = { status: BrandStatus.PENDING_APPROVAL, reason: 'Submit for approval' };
      
      brandRepository.findById.mockResolvedValue(draftBrand);
      brandRepository.update.mockResolvedValue(pendingBrand);

      // Act
      const result = await service.updateStatus('brand-1', pendingStatusUpdate, 'seller-1', 'SELLER');

      // Assert
      expect(result.status).toBe(BrandStatus.PENDING_APPROVAL);
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.status_changed', pendingBrand);
    });
  });

  describe('delete', () => {
    it('should soft delete brand successfully', async () => {
      // Arrange
      const deletedBrand = new Brand({ 
        ...mockBrand, 
        deletedAt: new Date(), 
        status: BrandStatus.ARCHIVED 
      });
      brandRepository.findById.mockResolvedValueOnce(mockBrand);
      brandRepository.update.mockResolvedValue(deletedBrand);
      brandRepository.findById.mockResolvedValueOnce(deletedBrand);

      // Act
      const result = await service.delete('brand-1', 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.update).toHaveBeenCalledWith('brand-1', { 
        status: BrandStatus.ARCHIVED,
        deletedAt: expect.any(Date)
      });
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        'brand-1',
        'DELETE',
        'admin-1',
        mockBrand,
        deletedBrand,
        'Brand deleted',
        undefined,
        undefined,
        'ADMIN'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.deleted', deletedBrand);
      expect(result).toEqual(deletedBrand);
    });

    it('should throw NotFoundException when brand not found', async () => {
      // Arrange
      brandRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete('non-existent', 'admin-1', 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should prevent deletion of brands in use', async () => {
      // Arrange
      const brandInUse = { ...mockBrand, status: BrandStatus.ACTIVE };
      brandRepository.findById.mockResolvedValue(brandInUse);
      brandRepository.isBrandInUse = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(service.delete('brand-1', 'admin-1', 'ADMIN')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return brand statistics', async () => {
      // Arrange
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
        byStatus: {
          [BrandStatus.ACTIVE]: 80,
          [BrandStatus.INACTIVE]: 15,
          [BrandStatus.PENDING_APPROVAL]: 5,
        },
      };
      brandRepository.getStatistics = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(brandRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const emptyStats = {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        byScope: {},
        byStatus: {},
      };
      brandRepository.getStatistics = jest.fn().mockResolvedValue(emptyStats);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result.total).toBe(0);
    });
  });

  describe('validateBrandAccess', () => {
    it('should allow admin access to any brand', async () => {
      // Arrange
      brandRepository.findById.mockResolvedValue(mockBrand);

      // Act
      const result = await service.validateBrandAccess('brand-1', 'admin-1', 'ADMIN');

      // Assert
      expect(result).toBe(true);
    });

    it('should allow owner access to their brand', async () => {
      // Arrange
      const ownerBrand = { ...mockBrand, sellerId: 'seller-1' };
      brandRepository.findById.mockResolvedValue(ownerBrand);

      // Act
      const result = await service.validateBrandAccess('brand-1', 'seller-1', 'SELLER');

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access to global brands', async () => {
      // Arrange
      const globalBrand = { ...mockBrand, scope: BrandScope.GLOBAL };
      brandRepository.findById.mockResolvedValue(globalBrand);

      // Act
      const result = await service.validateBrandAccess('brand-1', 'any-seller', 'SELLER');

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access to private brands for non-owners', async () => {
      // Arrange
      const privateBrand = { 
        ...mockBrand,
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'other-seller'
      };
      brandRepository.findById.mockResolvedValue(privateBrand);

      // Act
      const result = await service.validateBrandAccess('brand-1', 'seller-1', 'SELLER');

      // Assert
      expect(result).toBe(false);
    });
  });
});