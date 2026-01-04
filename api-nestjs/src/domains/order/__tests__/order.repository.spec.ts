import { Test, TestingModule } from '@nestjs/testing';
import { OrderRepository } from '../repositories/order.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { MockServicesFactory, TestDataFactory } from '../../../test/utils/test-helpers';
import { OrderStatus } from '../enums/order-status.enum';

describe('OrderRepository', () => {
    let repository: OrderRepository;
    let prismaService: any; // Using any for easier mocking of nested properties

    beforeEach(async () => {
        // Create a mock PrismaService that matches the shape expected by repository
        const mockPrisma = MockServicesFactory.createMockPrismaService();
        // Add specific order delegate mock if not present in factory (factory usually has basic ones)
        // Factory has 'user', 'tenant', 'brand' etc.
        // I need 'order' delegate.

        mockPrisma.order = {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        repository = module.get<OrderRepository>(OrderRepository);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should return null if order not found', async () => {
            prismaService.order.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result).toBeNull();
        });

        it('should return mapped entity if order found', async () => {
            const dbOrder = {
                id: 'order-123',
                orderNumber: 'ORD-123',
                userId: 'user-123',
                status: OrderStatus.PENDING,
                totalAmount: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            prismaService.order.findUnique.mockResolvedValue(dbOrder);

            const result = await repository.findById('order-123');

            expect(result).toBeDefined();
            expect(result?.id).toBe(dbOrder.id);
            expect(result?.status).toBe(OrderStatus.PENDING);
        });
    });

    describe('create', () => {
        it('should create order and map response', async () => {
            const orderData = {
                orderNumber: 'ORD-123',
                customerId: 'user-123',
                status: OrderStatus.PENDING,
                totalAmount: 100,
                shippingAddressId: 'addr-1',
                items: [],
            } as any;

            const dbCreatedOrder = {
                id: 'order-123',
                orderNumber: 'ORD-123',
                userId: 'user-123',
                status: OrderStatus.PENDING,
                totalAmount: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            prismaService.order.create.mockResolvedValue(dbCreatedOrder);

            const result = await repository.create(orderData);

            expect(prismaService.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        orderNumber: 'ORD-123',
                        userId: 'user-123',
                    })
                })
            );
            expect(result.id).toBe('order-123');
        });
    });

    describe('findAll', () => {
        it('should apply filters and return mapped orders', async () => {
            const dbOrders = [
                { id: '1', userId: 'cust-1', status: 'PENDING', totalAmount: 10, createdAt: new Date(), updatedAt: new Date() }
            ];
            prismaService.order.findMany.mockResolvedValue(dbOrders);
            prismaService.order.count.mockResolvedValue(1);

            const result = await repository.findAll(
                { customerId: 'cust-1' },
                { limit: 10 }
            );

            expect(prismaService.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId: 'cust-1' }),
                    take: 10
                })
            );
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('1');
        });
    });
});
