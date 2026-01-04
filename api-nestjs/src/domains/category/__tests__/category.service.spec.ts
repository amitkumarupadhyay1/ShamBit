import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CategoryService } from '../category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryAuditService } from '../services/category-audit.service';
import { CategoryTreeService } from '../services/category-tree.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { UserRole } from '../../../common/types';
import { CategoryStatus } from '../enums/category-status.enum';

import {
    TestModuleBuilder,
    TestDataFactory,
    TestAssertions,
    TestErrorHelper,
    TestPerformanceHelper,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryService', () => {
    let service: CategoryService;
    let categoryRepository: jest.Mocked<CategoryRepository>;
    let categoryAuditService: jest.Mocked<CategoryAuditService>;
    let categoryTreeService: jest.Mocked<CategoryTreeService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let logger: jest.Mocked<LoggerService>;

    beforeEach(async () => {
        const module: TestingModule = await TestModuleBuilder.createCategoryTestingModule([
            CategoryService,
            {
                provide: CategoryRepository,
                useValue: MockServicesFactory.createMockCategoryRepository(),
            },
            {
                provide: CategoryAuditService,
                useValue: MockServicesFactory.createMockCategoryAuditService(),
            },
            {
                provide: CategoryTreeService,
                useValue: MockServicesFactory.createMockCategoryTreeService(),
            },
        ]);

        service = module.get<CategoryService>(CategoryService);
        categoryRepository = module.get(CategoryRepository);
        categoryAuditService = module.get(CategoryAuditService);
        categoryTreeService = module.get(CategoryTreeService);
        eventEmitter = module.get(EventEmitter2);
        logger = module.get(LoggerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return paginated categories', async () => {
            // Arrange
            const categories = [TestDataFactory.createTestCategory()];
            const result = { data: categories, total: 1 };
            categoryRepository.findAll.mockResolvedValue(result);

            // Act
            const response = await service.findAll();

            // Assert
            expect(response).toEqual(result);
            expect(categoryRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return a category if found', async () => {
            // Arrange
            const category = TestDataFactory.createTestCategory();
            categoryRepository.findById.mockResolvedValue(category);

            // Act
            const result = await service.findById(category.id);

            // Assert
            expect(result).toEqual(category);
            expect(categoryRepository.findById).toHaveBeenCalledWith(category.id, {});
        });

        it('should throw NotFoundException if category not found', async () => {
            // Arrange
            categoryRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should successfully create a category', async () => {
            // Arrange
            const createDto = TestDataFactory.createValidCreateCategoryDto();
            const createdCategory = TestDataFactory.createTestCategory({
                ...createDto,
                status: CategoryStatus.DRAFT,
            });
            const userId = 'admin-123';
            const userRole = UserRole.ADMIN;

            categoryRepository.validateSlug.mockResolvedValue(true);
            categoryRepository.create.mockResolvedValue(createdCategory);

            // Act
            const result = await service.create(createDto, userId, userRole);

            // Assert
            expect(result).toEqual(createdCategory);
            expect(categoryRepository.create).toHaveBeenCalled();
            expect(categoryAuditService.logAction).toHaveBeenCalledWith(
                createdCategory.id,
                'CREATE',
                userId,
                null,
                createdCategory,
                'Category created',
            );
            expect(eventEmitter.emit).toHaveBeenCalled();
        });

        it('should throw ConflictException if slug already exists', async () => {
            // Arrange
            const createDto = TestDataFactory.createValidCreateCategoryDto();
            categoryRepository.validateSlug.mockResolvedValue(false);

            // Act & Assert
            await expect(service.create(createDto, 'user-1', UserRole.ADMIN)).rejects.toThrow(ConflictException);
        });

        it('should throw ForbiddenException if user lacks permissions', async () => {
            // Arrange
            const createDto = TestDataFactory.createValidCreateCategoryDto();

            // Act & Assert
            await expect(service.create(createDto, 'user-1', UserRole.BUYER)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('update', () => {
        it('should successfully update a category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const updateDto = { name: 'Updated Name' };
            const existingCategory = TestDataFactory.createTestCategory({ id: categoryId });
            const updatedCategory = TestDataFactory.createTestCategory({ ...existingCategory, ...updateDto });
            const userId = 'admin-123';
            const userRole = UserRole.ADMIN;

            categoryRepository.findById.mockResolvedValue(existingCategory);
            categoryRepository.update.mockResolvedValue(updatedCategory);

            // Act
            const result = await service.update(categoryId, updateDto, userId, userRole);

            // Assert
            expect(result).toEqual(updatedCategory);
            expect(categoryRepository.update).toHaveBeenCalled();
            expect(categoryAuditService.logAction).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should successfully soft delete a category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const category = TestDataFactory.createTestCategory({ id: categoryId });
            const userId = 'admin-123';
            const userRole = UserRole.ADMIN;

            categoryRepository.findById.mockResolvedValue(category);
            categoryRepository.softDelete.mockResolvedValue(undefined);

            // Act
            await service.delete(categoryId, userId, userRole);

            // Assert
            expect(categoryRepository.softDelete).toHaveBeenCalledWith(categoryId, userId, undefined);
            expect(categoryAuditService.logAction).toHaveBeenCalled();
        });
    });

    describe('moveCategory', () => {
        it('should successfully move a category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const moveDto = { newParentId: 'parent-456', reason: 'Reorganization' };
            const category = TestDataFactory.createTestCategory({ id: categoryId });
            const parent = TestDataFactory.createTestCategory({ id: 'parent-456' });
            const userId = 'admin-123';
            const userRole = UserRole.ADMIN;
            const moveResult = { success: true, newPath: 'new/path' };

            categoryRepository.findById.mockResolvedValueOnce(category);
            categoryRepository.findById.mockResolvedValueOnce(parent);
            categoryRepository.validateMove.mockResolvedValue({ isValid: true, errors: [] });
            categoryRepository.move.mockResolvedValue(moveResult as any);

            // Act
            const result = await service.moveCategory(categoryId, moveDto, userId, userRole);

            // Assert
            expect(result).toEqual(moveResult);
            expect(categoryRepository.move).toHaveBeenCalled();
            expect(categoryAuditService.logAction).toHaveBeenCalled();
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle database errors gracefully', async () => {
            // Arrange
            categoryRepository.findAll.mockRejectedValue(new Error('DB Error'));

            // Act & Assert
            await expect(service.findAll()).rejects.toThrow('DB Error');
        });

        it('should complete search within acceptable time', async () => {
            // Arrange
            categoryRepository.findAll.mockResolvedValue({ data: [], total: 0 });

            // Act
            const { duration } = await TestPerformanceHelper.measureExecutionTime(
                () => service.searchCategories('test')
            );

            // Assert
            TestPerformanceHelper.expectExecutionTimeUnder(duration, 500);
        });
    });
});
