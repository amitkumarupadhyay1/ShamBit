import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CategoryAttributeRepository } from '../repositories/category-attribute.repository';
import { AttributeType } from '../enums/attribute-type.enum';

import {
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('CategoryAttributeRepository', () => {
    let repository: CategoryAttributeRepository;
    let prisma: any;

    beforeEach(async () => {
        prisma = MockServicesFactory.createMockPrismaService();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryAttributeRepository,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        repository = module.get<CategoryAttributeRepository>(CategoryAttributeRepository);
    });

    describe('findById', () => {
        it('should find an attribute by ID', async () => {
            const attr = { id: 'attr-1', slug: 'color', type: 'TEXT' };
            prisma.categoryAttribute.findUnique.mockResolvedValue(attr);

            const result = await repository.findById('attr-1');

            expect(result).toBeDefined();
            expect(prisma.categoryAttribute.findUnique).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create a new attribute', async () => {
            const data = {
                categoryId: 'cat-1',
                name: 'Color',
                slug: 'color',
                type: AttributeType.TEXT,
                createdBy: 'user-1',
            };
            prisma.categoryAttribute.create.mockResolvedValue(data);

            const result = await repository.create(data as any);

            expect(result).toBeDefined();
            expect(prisma.categoryAttribute.create).toHaveBeenCalled();
        });
    });
});
