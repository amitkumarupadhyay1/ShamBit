import { Test, TestingModule } from '@nestjs/testing';
import { SkuGeneratorService } from '../services/sku-generator.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import {
    MockServicesFactory
} from '../../../test/utils/test-helpers';

describe('SkuGeneratorService', () => {
    let service: SkuGeneratorService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SkuGeneratorService,
                {
                    provide: PrismaService,
                    useValue: MockServicesFactory.createMockPrismaService(),
                },
                {
                    provide: LoggerService,
                    useValue: MockServicesFactory.createMockLoggerService(),
                },
            ],
        }).compile();

        service = module.get<SkuGeneratorService>(SkuGeneratorService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateSku', () => {
        it('should return custom SKU if provided and unique', async () => {
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.generateSku({
                sellerId: 'seller-1',
                productId: 'prod-1',
                customSku: 'MY-CUSTOM-SKU'
            });

            expect(result).toBe('MY-CUSTOM-SKU');
            expect(prisma.productVariant.findUnique).toHaveBeenCalledWith({
                where: { sku: 'MY-CUSTOM-SKU' },
                select: { id: true }
            });
        });

        it('should throw error if custom SKU already exists', async () => {
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({ id: 'exists' });

            await expect(service.generateSku({
                sellerId: 'seller-1',
                productId: 'prod-1',
                customSku: 'DUPLICATE'
            })).rejects.toThrow("SKU 'DUPLICATE' already exists");
        });

        it('should generate AUTO SKU with default config', async () => {
            // Mock getSkuConfiguration (no configs found)
            (prisma.configuration.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

            // Mock getNextCounter (transaction)
            (prisma.configuration.findUnique as jest.Mock).mockResolvedValue({ value: '1' });
            (prisma.configuration.upsert as jest.Mock).mockResolvedValue({});

            const result = await service.generateSku({
                sellerId: 'seller-1',
                productId: 'PRODUCT-123'
            });

            // Default pattern is AUTO. 
            // Parts: [PRODUCT_ID_SUB, COUNTER_PADDED]
            // PRODUCT-123 -> PRODUCT-
            // Counter 2 -> 0002
            expect(result).toMatch(/PRODUCT--0002/);
        });

        it('should generate TEMPLATE SKU correctly', async () => {
            // Mock TEMPLATE config
            (prisma.configuration.findMany as jest.Mock).mockResolvedValue([
                { key: 'sku.seller-1.pattern', value: 'TEMPLATE' },
                { key: 'sku.seller-1.template', value: 'SKU-{PREFIX}-{PRODUCT_ID}-{COUNTER}' },
                { key: 'sku.seller-1.prefix', value: 'PRE' },
                { key: 'sku.seller-1.isActive', value: 'true' }
            ]);
            (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.configuration.findUnique as jest.Mock).mockResolvedValue({ value: '9' });

            const result = await service.generateSku({
                sellerId: 'seller-1',
                productId: 'PROD-ID'
            });

            expect(result).toBe('SKU-PRE-PROD-ID-0010');
        });
    });

    describe('Handling collisions in AUTO mode', () => {
        it('should retry generation if collision occurs', async () => {
            (prisma.configuration.findMany as jest.Mock).mockResolvedValue([]); // Default AUTO

            // First attempt exists, second one doesn't
            (prisma.productVariant.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: 'existing' })
                .mockResolvedValueOnce(null);

            // Counters 1, 2
            (prisma.configuration.findUnique as jest.Mock)
                .mockResolvedValueOnce({ value: '0' })
                .mockResolvedValueOnce({ value: '1' });

            const result = await service.generateSku({
                sellerId: 'seller-1',
                productId: 'PROD'
            });

            expect(prisma.productVariant.findUnique).toHaveBeenCalledTimes(2);
            expect(result).toMatch(/PROD-0002/);
        });
    });
});
