import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { CategoryAttributeService } from '../services/category-attribute.service';
import { CategoryAuditService } from '../services/category-audit.service';
import { UserRole } from '../../../common/types';
import { CategoryStatus } from '../enums/category-status.enum';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TokenDenylistService } from '../../../infrastructure/security/token-denylist.service';

import {
    TestModuleBuilder,
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryController', () => {
    let controller: CategoryController;
    let service: jest.Mocked<CategoryService>;
    let attributeService: jest.Mocked<CategoryAttributeService>;
    let auditService: jest.Mocked<CategoryAuditService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoryController],
            providers: [
                {
                    provide: CategoryService,
                    useValue: {
                        findAll: jest.fn(),
                        findById: jest.fn(),
                        findBySlug: jest.fn(),
                        getCategoryTree: jest.fn(),
                        getFeaturedCategories: jest.fn(),
                        getLeafCategories: jest.fn(),
                        getTreeStatistics: jest.fn(),
                        searchCategories: jest.fn(),
                        findRoots: jest.fn(),
                        findChildren: jest.fn(),
                        getAncestors: jest.fn(),
                        getDescendants: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        updateStatus: jest.fn(),
                        moveCategory: jest.fn(),
                        delete: jest.fn(),
                        findCategoriesForBrand: jest.fn(),
                        validateBrandInCategory: jest.fn(),
                        bulkUpdateStatus: jest.fn(),
                        refreshTreeStatistics: jest.fn(),
                        rebuildMaterializedPaths: jest.fn(),
                    },
                },
                {
                    provide: CategoryAttributeService,
                    useValue: MockServicesFactory.createMockCategoryAttributeService(),
                },
                {
                    provide: CategoryAuditService,
                    useValue: MockServicesFactory.createMockCategoryAuditService(),
                },
                {
                    provide: JwtService,
                    useValue: { sign: jest.fn(), verify: jest.fn() },
                },
                {
                    provide: TokenDenylistService,
                    useValue: { isRevoked: jest.fn().mockResolvedValue(false) },
                },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('secret') },
                },
                Reflector,
            ],
        }).compile();

        controller = module.get<CategoryController>(CategoryController);
        service = module.get(CategoryService);
        attributeService = module.get(CategoryAttributeService);
        auditService = module.get(CategoryAuditService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return paginated categories', async () => {
            // Arrange
            const result = { data: [TestDataFactory.createTestCategory()], total: 1 };
            service.findAll.mockResolvedValue(result);

            // Act
            const response = await controller.findAll({});

            // Assert
            expect(response.data).toHaveLength(1);
            expect(response.total).toBe(1);
            expect(service.findAll).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return a category', async () => {
            // Arrange
            const category = TestDataFactory.createTestCategory();
            service.findById.mockResolvedValue(category);

            // Act
            const result = await controller.findById(category.id);

            // Assert
            expect(result).toEqual(category);
            expect(service.findById).toHaveBeenCalledWith(category.id, expect.any(Object));
        });
    });

    describe('create', () => {
        it('should create a new category', async () => {
            // Arrange
            const createDto = TestDataFactory.createValidCreateCategoryDto();
            const category = TestDataFactory.createTestCategory(createDto);
            service.create.mockResolvedValue(category);

            // Act
            const result = await controller.create(createDto, 'user-123', UserRole.ADMIN);

            // Assert
            expect(result).toEqual(category);
            expect(service.create).toHaveBeenCalledWith(createDto, 'user-123', UserRole.ADMIN);
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const updateDto = { name: 'Updated' };
            const category = TestDataFactory.createTestCategory({ id: categoryId, ...updateDto });
            service.update.mockResolvedValue(category);

            // Act
            const result = await controller.update(categoryId, updateDto, 'user-123', UserRole.ADMIN);

            // Assert
            expect(result).toEqual(category);
            expect(service.update).toHaveBeenCalledWith(categoryId, updateDto, 'user-123', UserRole.ADMIN);
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            service.delete.mockResolvedValue(undefined);

            // Act
            await controller.delete(categoryId, 'user-123', UserRole.ADMIN);

            // Assert
            expect(service.delete).toHaveBeenCalledWith(categoryId, 'user-123', UserRole.ADMIN, undefined);
        });
    });

    describe('tree and hierarchy', () => {
        it('should return roots', async () => {
            const result = { data: [], total: 0 };
            service.findRoots.mockResolvedValue(result);
            await controller.findRoots({});
            expect(service.findRoots).toHaveBeenCalled();
        });

        it('should return tree', async () => {
            service.getCategoryTree.mockResolvedValue([]);
            await controller.getCategoryTree({});
            expect(service.getCategoryTree).toHaveBeenCalled();
        });
    });
});
