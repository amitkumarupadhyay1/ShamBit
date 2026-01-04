import { Test, TestingModule } from '@nestjs/testing';
import { CategoryTreeService, CategoryTreeNode } from '../services/category-tree.service';
import { CategoryRepository } from '../repositories/category.repository';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { UserRole } from '../../../common/types';
import { CategoryStatus } from '../enums/category-status.enum';

import {
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryTreeService', () => {
    let service: CategoryTreeService;
    let repository: jest.Mocked<CategoryRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryTreeService,
                {
                    provide: CategoryRepository,
                    useValue: MockServicesFactory.createMockCategoryRepository(),
                },
                {
                    provide: LoggerService,
                    useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<CategoryTreeService>(CategoryTreeService);
        repository = module.get(CategoryRepository);
    });

    describe('getCategoryTree', () => {
        it('should return categories from repository', async () => {
            const categories = [TestDataFactory.createTestCategory()];
            repository.findAll.mockResolvedValue({ data: categories, total: 1 });

            const result = await service.getCategoryTree(undefined, undefined, true, UserRole.ADMIN);

            expect(result).toEqual(categories);
            expect(repository.findAll).toHaveBeenCalled();
        });

        it('should call findSubtree if rootId is provided', async () => {
            const rootId = 'root-1';
            const categories = [TestDataFactory.createTestCategory({ id: rootId })];
            repository.findSubtree.mockResolvedValue(categories);

            const result = await service.getCategoryTree(rootId);

            expect(result).toEqual(categories);
            expect(repository.findSubtree).toHaveBeenCalledWith(rootId, undefined, true);
        });
    });

    describe('buildNestedTree', () => {
        it('should build a nested tree structure', async () => {
            const cat1 = TestDataFactory.createTestCategory({ id: '1', name: 'Root' });
            const cat2 = TestDataFactory.createTestCategory({ id: '2', name: 'Child', parentId: '1' });
            const categories = [cat1, cat2];

            const tree = await service.buildNestedTree(categories);

            expect(tree).toHaveLength(1);
            expect(tree[0].category.id).toBe('1');
            expect(tree[0].children).toHaveLength(1);
            expect(tree[0].children[0].category.id).toBe('2');
        });

        it('should sort children by displayOrder by default', async () => {
            const root = TestDataFactory.createTestCategory({ id: '0' });
            const child1 = TestDataFactory.createTestCategory({ id: '1', parentId: '0', displayOrder: 2 });
            const child2 = TestDataFactory.createTestCategory({ id: '2', parentId: '0', displayOrder: 1 });
            const categories = [root, child1, child2];

            const tree = await service.buildNestedTree(categories);

            expect(tree[0].children[0].category.id).toBe('2');
            expect(tree[0].children[1].category.id).toBe('1');
        });
    });
});
