import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BrandRequestService } from '../services/brand-request.service';
import { BrandRequestRepository } from '../repositories/brand-request.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { BrandAuditService } from '../services/brand-audit.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { BrandRequest } from '../entities/brand-request.entity';
import { Brand } from '../entities/brand.entity';
import { BrandRequestStatus, BrandRequestType } from '../enums/request-status.enum';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandRequestDto, HandleBrandRequestDto } from '../dtos/brand-request.dto';
import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
} from '../../../test/utils/test-helpers';

describe('BrandRequestService', () => {
  let service: BrandRequestService;
  let brandRequestRepository: jest.Mocked<BrandRequestRepository>;
  let brandRepository: jest.Mocked<BrandRepository>;
  let brandAuditService: jest.Mocked<BrandAuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<LoggerService>;

  const mockBrandRequest: BrandRequest = {
    id: 'request-1',
    type: BrandRequestType.NEW_BRAND,
    status: BrandRequestStatus.PENDING,
    brandName: 'New Brand',
    brandSlug: 'new-brand',
    description: 'New brand description',
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://example.com',
    categoryIds: ['cat-1'],
    businessJustification: 'Business needs this brand for new product line expansion',
    requesterId: 'seller-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBrand: Brand = TestDataFactory.createTestBrand({
    id: 'brand-1',
    name: 'Existing Brand',
    slug: 'existing-brand',
    status: BrandStatus.ACTIVE,
  });

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createBrandTestingModule([
      BrandRequestService,
      BrandRequestRepository,
      BrandRepository,
      BrandAuditService,
      EventEmitter2,
      LoggerService,
    ]);

    service = module.get<BrandRequestService>(BrandRequestService);
    brandRequestRepository = module.get(BrandRequestRepository);
    brandRepository = module.get(BrandRepository);
    brandAuditService = module.get(BrandAuditService);
    eventEmitter = module.get(EventEmitter2);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated brand requests', async () => {
      // Arrange
      const mockResult = {
        data: [mockBrandRequest],
        total: 1,
      };
      const filters = { status: BrandRequestStatus.PENDING };
      const pagination = { page: 1, limit: 10 };
      
      brandRequestRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll(filters, pagination);

      // Assert
      expect(brandRequestRepository.findAll).toHaveBeenCalledWith(filters, pagination);
      expect(result).toEqual(mockResult);
      expect(logger.log).toHaveBeenCalledWith('BrandRequestService.findAll', { filters, pagination });
    });

    it('should handle empty filters and pagination', async () => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      brandRequestRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(brandRequestRepository.findAll).toHaveBeenCalledWith({}, {});
      expect(result).toEqual(mockResult);
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const mockResult = { data: [mockBrandRequest], total: 1 };
      brandRequestRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.findAll()
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200);
    });
  });

  describe('findById', () => {
    it('should return brand request when found', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);

      // Act
      const result = await service.findById('request-1');

      // Assert
      expect(brandRequestRepository.findById).toHaveBeenCalledWith('request-1');
      expect(result).toEqual(mockBrandRequest);
    });

    it('should throw NotFoundException when request not found', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      brandRequestRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findById('request-1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    const createRequestDto: CreateBrandRequestDto = {
      type: BrandRequestType.NEW_BRAND,
      brandName: 'New Brand',
      brandSlug: 'new-brand',
      description: 'New brand description',
      logoUrl: 'https://example.com/logo.png',
      websiteUrl: 'https://example.com',
      categoryIds: ['cat-1'],
      businessJustification: 'Business needs this brand for new product line expansion',
    };

    it('should create new brand request successfully', async () => {
      // Arrange
      const newRequest = { ...mockBrandRequest, ...createRequestDto, id: 'new-request-id' };
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);
      brandRequestRepository.findPendingBySlug.mockResolvedValue(null);
      brandRequestRepository.create.mockResolvedValue(newRequest);

      // Act
      const result = await service.create(createRequestDto, 'seller-1', 'SELLER');

      // Assert
      expect(brandRepository.findBySlug).toHaveBeenCalledWith('new-brand');
      expect(brandRepository.findByName).toHaveBeenCalledWith('New Brand');
      expect(brandRequestRepository.findPendingBySlug).toHaveBeenCalledWith('new-brand');
      expect(brandRequestRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createRequestDto,
        requesterId: 'seller-1',
        status: BrandRequestStatus.PENDING,
      }));
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        newRequest.id,
        'REQUEST_CREATE',
        'seller-1',
        null,
        newRequest,
        undefined,
        undefined,
        undefined,
        'SELLER'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand_request.created', newRequest);
      expect(result).toEqual(newRequest);
    });

    it('should throw ConflictException when brand with same slug already exists', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(mockBrand);

      // Act & Assert
      await expect(service.create(createRequestDto, 'seller-1', 'SELLER')).rejects.toThrow(ConflictException);
      expect(brandRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when brand with same name already exists', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(mockBrand);

      // Act & Assert
      await expect(service.create(createRequestDto, 'seller-1', 'SELLER')).rejects.toThrow(ConflictException);
      expect(brandRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when pending request with same slug exists', async () => {
      // Arrange
      brandRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);
      brandRequestRepository.findPendingBySlug.mockResolvedValue(mockBrandRequest);

      // Act & Assert
      await expect(service.create(createRequestDto, 'seller-1', 'SELLER')).rejects.toThrow(ConflictException);
      expect(brandRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should validate business justification length', async () => {
      // Arrange
      const invalidRequest = { ...createRequestDto, businessJustification: 'Too short' };

      // Act & Assert
      await expect(service.create(invalidRequest, 'seller-1', 'SELLER')).rejects.toThrow(BadRequestException);
    });

    it('should validate category IDs', async () => {
      // Arrange
      const invalidRequest = { ...createRequestDto, categoryIds: [] };

      // Act & Assert
      await expect(service.create(invalidRequest, 'seller-1', 'SELLER')).rejects.toThrow(BadRequestException);
    });

    it('should create brand update request successfully', async () => {
      // Arrange
      const updateRequestDto = {
        ...createRequestDto,
        type: BrandRequestType.BRAND_UPDATE,
        brandId: 'brand-1',
      };
      const updateRequest = { ...mockBrandRequest, type: BrandRequestType.BRAND_UPDATE, brandId: 'brand-1' };
      
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRequestRepository.findPendingByBrandId.mockResolvedValue(null);
      brandRequestRepository.create.mockResolvedValue(updateRequest);

      // Act
      const result = await service.create(updateRequestDto, 'seller-1', 'SELLER');

      // Assert
      expect(brandRepository.findById).toHaveBeenCalledWith('brand-1');
      expect(brandRequestRepository.findPendingByBrandId).toHaveBeenCalledWith('brand-1');
      expect(result.type).toBe(BrandRequestType.BRAND_UPDATE);
    });

    it('should create brand reactivation request successfully', async () => {
      // Arrange
      const inactiveBrand = TestDataFactory.createTestBrand({ status: BrandStatus.INACTIVE });
      const reactivationRequestDto = {
        ...createRequestDto,
        type: BrandRequestType.BRAND_REACTIVATION,
        brandId: 'brand-1',
      };
      const reactivationRequest = { ...mockBrandRequest, type: BrandRequestType.BRAND_REACTIVATION };
      
      brandRepository.findById.mockResolvedValue(inactiveBrand);
      brandRequestRepository.findPendingByBrandId.mockResolvedValue(null);
      brandRequestRepository.create.mockResolvedValue(reactivationRequest);

      // Act
      const result = await service.create(reactivationRequestDto, 'seller-1', 'SELLER');

      // Assert
      expect(result.type).toBe(BrandRequestType.BRAND_REACTIVATION);
    });

    it('should prevent duplicate requests for same brand', async () => {
      // Arrange
      const updateRequestDto = {
        ...createRequestDto,
        type: BrandRequestType.BRAND_UPDATE,
        brandId: 'brand-1',
      };
      
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRequestRepository.findPendingByBrandId.mockResolvedValue(mockBrandRequest);

      // Act & Assert
      await expect(service.create(updateRequestDto, 'seller-1', 'SELLER')).rejects.toThrow(ConflictException);
    });
  });

  describe('handle', () => {
    const handleRequestDto: HandleBrandRequestDto = {
      action: 'APPROVE',
      adminNotes: 'Brand approved for use',
    };

    it('should approve new brand request successfully', async () => {
      // Arrange
      const approvedRequest = { ...mockBrandRequest, status: BrandRequestStatus.APPROVED };
      const createdBrand = TestDataFactory.createTestBrand({
        name: mockBrandRequest.brandName,
        slug: mockBrandRequest.brandSlug,
      });
      
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);
      brandRequestRepository.update.mockResolvedValue(approvedRequest);
      brandRepository.create.mockResolvedValue(createdBrand);

      // Act
      const result = await service.handle('request-1', handleRequestDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRequestRepository.update).toHaveBeenCalledWith('request-1', {
        status: BrandRequestStatus.APPROVED,
        handledBy: 'admin-1',
        handledAt: expect.any(Date),
        adminNotes: 'Brand approved for use',
      });
      expect(brandRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: mockBrandRequest.brandName,
        slug: mockBrandRequest.brandSlug,
        description: mockBrandRequest.description,
        logoUrl: mockBrandRequest.logoUrl,
        websiteUrl: mockBrandRequest.websiteUrl,
        categoryIds: mockBrandRequest.categoryIds,
        status: BrandStatus.ACTIVE,
        scope: BrandScope.GLOBAL,
      }));
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand_request.approved', approvedRequest);
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.created', createdBrand);
      expect(result).toEqual(approvedRequest);
    });

    it('should reject brand request successfully', async () => {
      // Arrange
      const rejectRequestDto = {
        action: 'REJECT',
        adminNotes: 'Brand name violates policy',
        rejectionReason: 'Policy violation',
      };
      const rejectedRequest = { 
        ...mockBrandRequest, 
        status: BrandRequestStatus.REJECTED,
        rejectionReason: 'Policy violation',
      };
      
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);
      brandRequestRepository.update.mockResolvedValue(rejectedRequest);

      // Act
      const result = await service.handle('request-1', rejectRequestDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRequestRepository.update).toHaveBeenCalledWith('request-1', {
        status: BrandRequestStatus.REJECTED,
        handledBy: 'admin-1',
        handledAt: expect.any(Date),
        adminNotes: 'Brand name violates policy',
        rejectionReason: 'Policy violation',
      });
      expect(brandRepository.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand_request.rejected', rejectedRequest);
      expect(result).toEqual(rejectedRequest);
    });

    it('should throw NotFoundException when request not found', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.handle('non-existent', handleRequestDto, 'admin-1', 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when request already handled', async () => {
      // Arrange
      const handledRequest = { ...mockBrandRequest, status: BrandRequestStatus.APPROVED };
      brandRequestRepository.findById.mockResolvedValue(handledRequest);

      // Act & Assert
      await expect(service.handle('request-1', handleRequestDto, 'admin-1', 'ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when non-admin tries to handle request', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);

      // Act & Assert
      await expect(service.handle('request-1', handleRequestDto, 'seller-1', 'SELLER')).rejects.toThrow(ForbiddenException);
    });

    it('should handle brand update request approval', async () => {
      // Arrange
      const updateRequest = { 
        ...mockBrandRequest, 
        type: BrandRequestType.BRAND_UPDATE,
        brandId: 'brand-1',
      };
      const approvedRequest = { ...updateRequest, status: BrandRequestStatus.APPROVED };
      const updatedBrand = { ...mockBrand, name: updateRequest.brandName };
      
      brandRequestRepository.findById.mockResolvedValue(updateRequest);
      brandRequestRepository.update.mockResolvedValue(approvedRequest);
      brandRepository.findById.mockResolvedValue(mockBrand);
      brandRepository.update.mockResolvedValue(updatedBrand);

      // Act
      const result = await service.handle('request-1', handleRequestDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.update).toHaveBeenCalledWith('brand-1', expect.objectContaining({
        name: updateRequest.brandName,
        description: updateRequest.description,
      }));
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.updated', updatedBrand);
    });

    it('should handle brand reactivation request approval', async () => {
      // Arrange
      const inactiveBrand = TestDataFactory.createTestBrand({ status: BrandStatus.INACTIVE });
      const reactivationRequest = { 
        ...mockBrandRequest, 
        type: BrandRequestType.BRAND_REACTIVATION,
        brandId: 'brand-1',
      };
      const approvedRequest = { ...reactivationRequest, status: BrandRequestStatus.APPROVED };
      const reactivatedBrand = { ...inactiveBrand, status: BrandStatus.ACTIVE };
      
      brandRequestRepository.findById.mockResolvedValue(reactivationRequest);
      brandRequestRepository.update.mockResolvedValue(approvedRequest);
      brandRepository.findById.mockResolvedValue(inactiveBrand);
      brandRepository.update.mockResolvedValue(reactivatedBrand);

      // Act
      const result = await service.handle('request-1', handleRequestDto, 'admin-1', 'ADMIN');

      // Assert
      expect(brandRepository.update).toHaveBeenCalledWith('brand-1', {
        status: BrandStatus.ACTIVE,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand.reactivated', reactivatedBrand);
    });

    it('should require rejection reason when rejecting', async () => {
      // Arrange
      const rejectWithoutReason = { action: 'REJECT', adminNotes: 'Rejected' };
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);

      // Act & Assert
      await expect(service.handle('request-1', rejectWithoutReason, 'admin-1', 'ADMIN')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel brand request successfully', async () => {
      // Arrange
      const cancelledRequest = { ...mockBrandRequest, status: BrandRequestStatus.CANCELLED };
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);
      brandRequestRepository.update.mockResolvedValue(cancelledRequest);

      // Act
      const result = await service.cancel('request-1', 'seller-1', 'SELLER');

      // Assert
      expect(brandRequestRepository.update).toHaveBeenCalledWith('request-1', {
        status: BrandRequestStatus.CANCELLED,
      });
      expect(brandAuditService.logAction).toHaveBeenCalledWith(
        'request-1',
        'REQUEST_CANCEL',
        'seller-1',
        mockBrandRequest,
        cancelledRequest,
        undefined,
        undefined,
        undefined,
        'SELLER'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('brand_request.cancelled', cancelledRequest);
      expect(result).toEqual(cancelledRequest);
    });

    it('should throw NotFoundException when request not found', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancel('non-existent', 'seller-1', 'SELLER')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to cancel', async () => {
      // Arrange
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);

      // Act & Assert
      await expect(service.cancel('request-1', 'other-seller', 'SELLER')).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to cancel any request', async () => {
      // Arrange
      const cancelledRequest = { ...mockBrandRequest, status: BrandRequestStatus.CANCELLED };
      brandRequestRepository.findById.mockResolvedValue(mockBrandRequest);
      brandRequestRepository.update.mockResolvedValue(cancelledRequest);

      // Act
      const result = await service.cancel('request-1', 'admin-1', 'ADMIN');

      // Assert
      expect(result.status).toBe(BrandRequestStatus.CANCELLED);
    });

    it('should throw BadRequestException when request already handled', async () => {
      // Arrange
      const handledRequest = { ...mockBrandRequest, status: BrandRequestStatus.APPROVED };
      brandRequestRepository.findById.mockResolvedValue(handledRequest);

      // Act & Assert
      await expect(service.cancel('request-1', 'seller-1', 'SELLER')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return brand request statistics', async () => {
      // Arrange
      const mockStats = {
        total: 50,
        pending: 10,
        approved: 30,
        rejected: 8,
        cancelled: 2,
        byType: {
          NEW_BRAND: 40,
          BRAND_UPDATE: 8,
          BRAND_REACTIVATION: 2,
        },
        byRequester: {
          'seller-1': 20,
          'seller-2': 15,
          'seller-3': 15,
        },
      };
      brandRequestRepository.getStatistics = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(brandRequestRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const emptyStats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        byType: {},
        byRequester: {},
      };
      brandRequestRepository.getStatistics = jest.fn().mockResolvedValue(emptyStats);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result.total).toBe(0);
    });
  });

  describe('findPendingRequests', () => {
    it('should return pending requests for admin', async () => {
      // Arrange
      const pendingRequests = [mockBrandRequest];
      brandRequestRepository.findAll.mockResolvedValue({
        data: pendingRequests,
        total: 1,
      });

      // Act
      const result = await service.findPendingRequests();

      // Assert
      expect(brandRequestRepository.findAll).toHaveBeenCalledWith(
        { status: BrandRequestStatus.PENDING },
        { sortBy: 'createdAt', sortOrder: 'asc' }
      );
      expect(result.data).toEqual(pendingRequests);
    });
  });

  describe('validateRequestData', () => {
    it('should validate brand name format', async () => {
      // Arrange
      const invalidRequest = {
        ...mockBrandRequest,
        brandName: 'a', // Too short
      };

      // Act & Assert
      expect(() => service.validateRequestData(invalidRequest)).toThrow(BadRequestException);
    });

    it('should validate slug format', async () => {
      // Arrange
      const invalidRequest = {
        ...mockBrandRequest,
        brandSlug: 'Invalid Slug!', // Invalid characters
      };

      // Act & Assert
      expect(() => service.validateRequestData(invalidRequest)).toThrow(BadRequestException);
    });

    it('should validate category IDs', async () => {
      // Arrange
      const invalidRequest = {
        ...mockBrandRequest,
        categoryIds: [], // Empty array
      };

      // Act & Assert
      expect(() => service.validateRequestData(invalidRequest)).toThrow(BadRequestException);
    });

    it('should pass validation for valid request', async () => {
      // Act & Assert
      expect(() => service.validateRequestData(mockBrandRequest)).not.toThrow();
    });
  });
});