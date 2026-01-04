import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException
} from '@nestjs/common';
import { VariantService } from '../variant.service';
import { VariantRepository } from '../repositories/variant.repository';
import { VariantAuditService } from '../services/variant-audit.service';
import { SkuGeneratorService } from '../services/sku-generator.service';
import { VariantCombinatorService } from '../services/variant-combinator.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import {
    TestDataFactory,
    MockServicesFactory,
    TestAssertions
} from '../../../test/utils/test-helpers';
import { VariantStatus } from '../enums/variant-status.enum';
import { UserRole } from '../../../common/types';

describe('VariantService', () => {
    let service: VariantService;
    let repository: jest.Mocked<VariantRepository>;
    let auditService: jest.Mocked<VariantAuditService>;
    let skuGenerator: jest.Mocked<SkuGeneratorService>;
    let combinator: jest.Mocked<VariantCombinatorService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VariantService,
                {
                    provide: VariantRepository,
                    useValue: MockServicesFactory.createMockVariantRepository(),
                },
                {
                    provide: VariantAuditService,
                    useValue: { logAction: jest.fn() },
                },
                {
                    provide: SkuGeneratorService,
                    useValue: {
                        generateSku: jest.fn(),
                        validateSkuUniqueness: jest.fn()
                    },
                },
                {
                    provide: VariantCombinatorService,
                    useValue: {
                        generateCombinations: jest.fn(),
                        generateCombinationHash: jest.fn()
                    },
                },
                {
                    provide: EventEmitter2,
                    useValue: MockServicesFactory.createMockEventEmitter(),
                },
                {
                    provide: LoggerService,
                    useValue: MockServicesFactory.createMockLoggerService(),
                },
            ],
        }).compile();

        service = module.get<VariantService>(VariantService);
        repository = module.get(VariantRepository);
        auditService = module.get(VariantAuditService);
        skuGenerator = module.get(SkuGeneratorService);
        combinator = module.get(VariantCombinatorService);
        eventEmitter = module.get(EventEmitter2);
    });

    describe('findAll', () => {
        it('should return variants with access control', async () => {
            const mockResult = { data: [], total: 0 };
            repository.findAll.mockResolvedValue(mockResult);

            const result = await service.findAll({}, {}, {}, 'seller-123', UserRole.SELLER);

            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ sellerId: 'seller-123' }),
                expect.any(Object),
                expect.any(Object)
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('findById', () => {
        it('should return variant if user has access', async () => {
            const variant = TestDataFactory.createTestVariant({ createdBy: 'seller-123' });
            repository.findById.mockResolvedValue(variant);

            const result = await service.findById('var-123', {}, 'seller-123', UserRole.SELLER);

            expect(result).toEqual(variant);
        });

        it('should throw NotFoundException if variant not found', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user has no access', async () => {
            const variant = TestDataFactory.createTestVariant({ createdBy: 'other-seller' });
            repository.findById.mockResolvedValue(variant);

            await expect(service.findById('var-123', {}, 'seller-123', UserRole.SELLER))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('create', () => {
        it('should create a variant successfully', async () => {
            const dto = TestDataFactory.createValidVariantDto({ sku: undefined });
            const mockCreated = TestDataFactory.createTestVariant(dto);

            repository.findByAttributeCombination.mockResolvedValue(null);
            skuGenerator.generateSku.mockResolvedValue('GENERATED-SKU');
            repository.create.mockResolvedValue(mockCreated);

            const result = await service.create(dto, 'seller-123');

            expect(skuGenerator.generateSku).toHaveBeenCalled();
            expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
                sku: 'GENERATED-SKU',
                status: VariantStatus.DRAFT
            }));
            expect(auditService.logAction).toHaveBeenCalled();
            expect(eventEmitter.emit).toHaveBeenCalledWith('variant.created', expect.any(Object));
            expect(result).toEqual(mockCreated);
        });

        it('should throw ConflictException if combination already exists', async () => {
            const dto = TestDataFactory.createValidVariantDto();
            repository.findByAttributeCombination.mockResolvedValue({ id: 'existing' });

            await expect(service.create(dto, 'seller-123')).rejects.toThrow(ConflictException);
        });
    });

    describe('updateStatus', () => {
        it('should update status and emit events', async () => {
            const variant = TestDataFactory.createTestVariant({ status: VariantStatus.DRAFT });
            repository.findById.mockResolvedValue(variant);
            repository.updateStatus.mockResolvedValue({ ...variant, status: VariantStatus.ACTIVE });

            const result = await service.updateStatus('var-123', { status: VariantStatus.ACTIVE }, 'admin-123');

            expect(repository.updateStatus).toHaveBeenCalledWith('var-123', VariantStatus.ACTIVE, 'admin-123');
            expect(eventEmitter.emit).toHaveBeenCalledWith('variant.status.changed', expect.any(Object));
            expect(eventEmitter.emit).toHaveBeenCalledWith('variant.activated', expect.any(Object));
            expect(result.status).toBe(VariantStatus.ACTIVE);
        });

        it('should throw BadRequestException for invalid transition', async () => {
            const variant = TestDataFactory.createTestVariant({ status: VariantStatus.ARCHIVED });
            repository.findById.mockResolvedValue(variant);

            await expect(service.updateStatus('var-123', { status: VariantStatus.ACTIVE }, 'admin-123'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('delete', () => {
        it('should soft delete variant', async () => {
            const variant = TestDataFactory.createTestVariant();
            repository.findById.mockResolvedValue(variant);

            await service.delete('var-123', 'seller-123');

            expect(repository.softDelete).toHaveBeenCalledWith('var-123', 'seller-123');
            expect(eventEmitter.emit).toHaveBeenCalledWith('variant.deleted', expect.any(Object));
        });
    });
});
