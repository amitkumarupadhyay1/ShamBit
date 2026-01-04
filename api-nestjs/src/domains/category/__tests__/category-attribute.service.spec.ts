import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CategoryAttributeService } from '../services/category-attribute.service';
import { CategoryAttributeRepository } from '../repositories/category-attribute.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryAuditService } from '../services/category-audit.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { UserRole } from '../../../common/types';
import { AttributeType } from '../enums/attribute-type.enum';

import {
    TestModuleBuilder,
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryAttributeService', () => {
    let service: CategoryAttributeService;
    let attributeRepository: jest.Mocked<CategoryAttributeRepository>;
    let categoryRepository: jest.Mocked<CategoryRepository>;
    let auditService: jest.Mocked<CategoryAuditService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryAttributeService,
                {
                    provide: CategoryAttributeRepository,
                    useValue: MockServicesFactory.createMockCategoryAttributeRepository(),
                },
                {
                    provide: CategoryRepository,
                    useValue: MockServicesFactory.createMockCategoryRepository(),
                },
                {
                    provide: CategoryAuditService,
                    useValue: MockServicesFactory.createMockCategoryAuditService(),
                },
                {
                    provide: EventEmitter2,
                    useValue: { emit: jest.fn() },
                },
                {
                    provide: LoggerService,
                    useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<CategoryAttributeService>(CategoryAttributeService);
        attributeRepository = module.get(CategoryAttributeRepository);
        categoryRepository = module.get(CategoryRepository);
        auditService = module.get(CategoryAuditService);
        eventEmitter = module.get(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should successfully create an attribute', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const dto = {
                name: 'Color',
                slug: 'color',
                type: AttributeType.SELECT,
                allowedValues: ['Red', 'Blue'],
            };
            const category = TestDataFactory.createTestCategory({ id: categoryId });
            const attribute = TestDataFactory.createTestCategoryAttribute({ ...dto, categoryId });

            categoryRepository.findById.mockResolvedValue(category);
            attributeRepository.findBySlug.mockResolvedValue(null);
            attributeRepository.create.mockResolvedValue(attribute);
            categoryRepository.findChildren.mockResolvedValue({ data: [], total: 0 });

            // Act
            const result = await service.create(categoryId, dto as any, 'user-1', UserRole.ADMIN);

            // Assert
            expect(result).toEqual(attribute);
            expect(attributeRepository.create).toHaveBeenCalled();
            expect(auditService.logAction).toHaveBeenCalled();
        });

        it('should throw ConflictException if slug exists in category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const dto = { name: 'Color', slug: 'color', type: AttributeType.TEXT };
            const category = TestDataFactory.createTestCategory({ id: categoryId });

            categoryRepository.findById.mockResolvedValue(category);
            attributeRepository.findBySlug.mockResolvedValue({} as any);

            // Act & Assert
            await expect(service.create(categoryId, dto as any, 'user-1', UserRole.ADMIN)).rejects.toThrow(ConflictException);
        });
    });

    describe('inheritance', () => {
        it('should successfully inherit attributes', async () => {
            // Arrange
            const targetId = 'child-1';
            const sourceId = 'parent-1';
            const dto = { sourceCategoryId: sourceId, overrideExisting: true };

            const targetCategory = TestDataFactory.createTestCategory({ id: targetId, pathIds: [sourceId, targetId] });
            const sourceCategory = TestDataFactory.createTestCategory({ id: sourceId, pathIds: [sourceId] });
            const sourceAttr = TestDataFactory.createTestCategoryAttribute({ id: 'attr-1', categoryId: sourceId, isInheritable: true });

            categoryRepository.findById.mockResolvedValueOnce(targetCategory);
            categoryRepository.findById.mockResolvedValueOnce(sourceCategory);
            attributeRepository.findByCategoryId.mockResolvedValue([sourceAttr]);
            attributeRepository.findBySlug.mockResolvedValue(null);
            attributeRepository.create.mockResolvedValue(sourceAttr); // simplifying

            // Act
            const result = await service.inheritAttributes(targetId, dto, 'user-1', UserRole.ADMIN);

            // Assert
            expect(result.inherited).toHaveLength(1);
            expect(attributeRepository.createInheritanceRule).toHaveBeenCalled();
        });
    });
});
