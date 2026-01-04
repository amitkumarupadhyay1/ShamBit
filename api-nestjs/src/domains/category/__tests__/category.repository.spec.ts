import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryStatus } from '../enums/category-status.enum';
import { CategoryVisibility } from '../enums/category-visibility.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../../../infrastructure/observability/logger.service';

import {
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryRepository', () => {
    let repository: CategoryRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = MockServicesFactory.createMockPrismaService();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: EventEmitter2,
                    useValue: { emit: jest.fn() },
                },
                {
                    provide: LoggerService,
                    useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
                },
            ],
        }).compile();

        repository = module.get<CategoryRepository>(CategoryRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should find a category by ID', async () => {
            // Arrange
            const category = TestDataFactory.createTestCategory();
            prisma.category.findFirst.mockResolvedValue(category);

            // Act
            const result = await repository.findById(category.id);

            // Assert
            expect(result).toBeDefined();
            expect(prisma.category.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: category.id, isActive: true }
            }));
        });

        it('should return null if category not found', async () => {
            // Arrange
            prisma.category.findFirst.mockResolvedValue(null);

            // Act
            const result = await repository.findById('random-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new category', async () => {
            // Arrange
            const categoryData = {
                name: 'New Cat',
                slug: 'new-cat',
                status: CategoryStatus.DRAFT,
                createdBy: 'user-1',
                path: 'new-cat',
                depth: 0,
            };
            const createdCategory = TestDataFactory.createTestCategory(categoryData);
            prisma.category.create.mockResolvedValue(createdCategory);
            prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

            // Act
            const result = await repository.create(categoryData as any);

            // Assert
            expect(result).toBeDefined();
            expect(prisma.category.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update an existing category', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const updateData = { name: 'Updated', updatedBy: 'user-1' };
            const existingCategory = TestDataFactory.createTestCategory({ id: categoryId });
            const updatedCategory = TestDataFactory.createTestCategory({ id: categoryId, ...updateData });

            prisma.category.findFirst.mockResolvedValue(existingCategory);
            prisma.category.update.mockResolvedValue(updatedCategory);
            prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

            // Act
            const result = await repository.update(categoryId, updateData as any);

            // Assert
            expect(result).toBeDefined();
            expect(prisma.category.update).toHaveBeenCalled();
        });
    });

    describe('softDelete', () => {
        it('should mark category as inactive', async () => {
            // Arrange
            const categoryId = 'cat-123';
            const category = TestDataFactory.createTestCategory({ id: categoryId });
            prisma.category.findFirst.mockResolvedValue(category);
            prisma.category.update.mockResolvedValue({});
            prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

            // Act
            await repository.softDelete(categoryId, 'user-1');

            // Assert
            expect(prisma.category.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: categoryId },
                data: { isActive: false }
            }));
        });
    });

    describe('validateSlug', () => {
        it('should return true if slug is unique', async () => {
            prisma.category.findFirst.mockResolvedValue(null);
            const result = await repository.validateSlug('unique-slug');
            expect(result).toBe(true);
        });

        it('should return false if slug exists', async () => {
            prisma.category.findFirst.mockResolvedValue({});
            const result = await repository.validateSlug('existing-slug');
            expect(result).toBe(false);
        });
    });
});
