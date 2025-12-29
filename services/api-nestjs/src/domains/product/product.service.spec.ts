import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductAttributeValueRepository } from './repositories/product-attribute-value.repository';
import { ProductAuditService } from './services/product-audit.service';
import { ProductIntegrationService } from './services/product-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../../infrastructure/observability/logger.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '../../common/types';
import { ProductStatus } from './enums/product-status.enum';

describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductRepository;

  const mockProductRepository = {
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockProductAttributeValueRepository = {
    upsert: jest.fn(),
    inheritFromCategory: jest.fn(),
  };

  const mockProductAuditService = {
    logAction: jest.fn(),
  };

  const mockProductIntegrationService = {
    validateCategoryBrandCombination: jest.fn(),
    validateSellerCanUseBrand: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: mockProductRepository },
        {
          provide: ProductAttributeValueRepository,
          useValue: mockProductAttributeValueRepository,
        },
        { provide: ProductAuditService, useValue: mockProductAuditService },
        {
          provide: ProductIntegrationService,
          useValue: mockProductIntegrationService,
        },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<ProductRepository>(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a product if found and user has access', async () => {
      const product = {
        id: 'some-uuid',
        sellerId: 'seller-uuid',
        visibility: 'PUBLIC',
      };
      mockProductRepository.findById.mockResolvedValue(product);

      const result = await service.findById(
        'some-uuid',
        {},
        'seller-uuid',
        UserRole.SELLER,
      );
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);
      await expect(service.findById('some-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user cannot view the product', async () => {
      const product = {
        id: 'some-uuid',
        sellerId: 'seller-uuid',
        visibility: 'PRIVATE',
        status: ProductStatus.DRAFT,
      };
      mockProductRepository.findById.mockResolvedValue(product);

      await expect(
        service.findById('some-uuid', {}, 'another-user-uuid', UserRole.BUYER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createDto = {
        name: 'New Product',
        categoryId: 'cat-uuid',
        brandId: 'brand-uuid',
      };
      const newProduct = {
        id: 'new-uuid',
        ...createDto,
        sellerId: 'seller-uuid',
      };

      mockProductRepository.create.mockResolvedValue(newProduct);
      (repository.validateSlug as jest.Mock) = jest
        .fn()
        .mockResolvedValue(true);

      const result = await service.create(
        createDto as any,
        'seller-uuid',
        UserRole.SELLER,
      );
      expect(result).toEqual(newProduct);
      expect(mockProductAuditService.logAction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto = {
        name: 'New Product',
        slug: 'new-product',
        categoryId: 'cat-uuid',
        brandId: 'brand-uuid',
      };
      (repository.validateSlug as jest.Mock) = jest
        .fn()
        .mockResolvedValue(false);

      await expect(
        service.create(createDto as any, 'seller-uuid', UserRole.SELLER),
      ).rejects.toThrow(ConflictException);
    });
  });
});
