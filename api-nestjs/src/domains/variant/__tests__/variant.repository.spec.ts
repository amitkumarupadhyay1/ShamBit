import { Test, TestingModule } from '@nestjs/testing';
import { VariantRepository } from '../repositories/variant.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
    TestDataFactory,
    MockServicesFactory,
    TestAssertions
} from '../../../test/utils/test-helpers';

describe('VariantRepository', () => {
    let repository: VariantRepository;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VariantRepository,
                {
                    provide: PrismaService,
                    useValue: MockServicesFactory.createMockPrismaService(),
                },
            ],
        }).compile();

        repository = module.get<VariantRepository>(VariantRepository);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated variants', async () => {
            const mockVariants = [
                TestDataFactory.createTestVariant({ id: '1' }),
                TestDataFactory.createTestVariant({ id: '2' }),
            ];
            const mockCount = 2;

            (prisma.productVariant.findMany as jest.Mock).mockResolvedValue(mockVariants);
            (prisma.productVariant.count as jest.Mock).mockResolvedValue(mockCount);

            const result = await repository.findAll();

            expect(prisma.productVariant.findMany).toHaveBeenCalled();
            expect(prisma.productVariant.count).toHaveBeenCalled();
            TestAssertions.expectValidVariantListResponse(result);
            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should apply filters correctly', async () => {
            const filters = { productId: 'prod-123', isActive: true };

            (prisma.productVariant.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.productVariant.count as jest.Mock).mockResolvedValue(0);

            await repository.findAll(filters);

            expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        productId: 'prod-123',
                        isActive: true,
                    }),
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return a variant by id', async () => {
            const mockVariant = TestDataFactory.createTestVariant();
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

            const result = await repository.findById('var-123');

            expect(prisma.productVariant.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'var-123' } }),
            );
            expect(result).toEqual(mockVariant);
        });

        it('should return null if variant not found', async () => {
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findBySku', () => {
        it('should return a variant by sku', async () => {
            const mockVariant = TestDataFactory.createTestVariant({ sku: 'SKU-001' });
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

            const result = await repository.findBySku('SKU-001');

            expect(prisma.productVariant.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { sku: 'SKU-001' } }),
            );
            expect(result).toEqual(mockVariant);
        });
    });

    describe('create', () => {
        it('should create a new variant', async () => {
            const dto = TestDataFactory.createValidVariantDto();
            const mockCreated = TestDataFactory.createTestVariant(dto);

            (prisma.productVariant.create as jest.Mock).mockResolvedValue(mockCreated);

            const result = await repository.create(dto);

            expect(prisma.productVariant.create).toHaveBeenCalled();
            expect(result).toEqual(mockCreated);
        });
    });

    describe('updateStatus', () => {
        it('should update variant status', async () => {
            (prisma.productVariant.update as jest.Mock).mockResolvedValue({ id: 'var-123', isActive: true });

            await repository.updateStatus('var-123', 'ACTIVE', 'user-123');

            expect(prisma.productVariant.update).toHaveBeenCalledWith({
                where: { id: 'var-123' },
                data: { isActive: true },
            });
        });
    });

    describe('softDelete', () => {
        it('should set isActive to false', async () => {
            (prisma.productVariant.update as jest.Mock).mockResolvedValue({ id: 'var-123', isActive: false });

            await repository.softDelete('var-123', 'user-123');

            expect(prisma.productVariant.update).toHaveBeenCalledWith({
                where: { id: 'var-123' },
                data: { isActive: false },
            });
        });
    });
});
