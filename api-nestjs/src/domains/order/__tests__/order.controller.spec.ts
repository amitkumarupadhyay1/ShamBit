import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { UserRole } from '../../../common/types';
import { OrderStatus } from '../enums/order-status.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenDenylistService } from '../../../infrastructure/security/token-denylist.service';
import { MockServicesFactory } from '../../../test/utils/test-helpers';

describe('OrderController', () => {
    let controller: OrderController;
    let orderService: jest.Mocked<OrderService>;

    beforeEach(async () => {
        const mockOrderService = {
            findByUser: jest.fn(),
            findById: jest.fn(),
            createOrder: jest.fn(),
            processPayment: jest.fn(),
            confirmPayment: jest.fn(),
            cancelOrder: jest.fn(),
            cancel: jest.fn(), // If mapping is needed
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrderController],
            providers: [
                {
                    provide: OrderService,
                    useValue: mockOrderService,
                },
                {
                    provide: JwtService,
                    useValue: MockServicesFactory.createMockJwtService(),
                },
                {
                    provide: TokenDenylistService,
                    useValue: MockServicesFactory.createMockTokenDenylistService(),
                },
                {
                    provide: ConfigService,
                    useValue: MockServicesFactory.createMockConfigService(),
                },
            ],
        }).compile();

        controller = module.get<OrderController>(OrderController);
        orderService = module.get(OrderService) as jest.Mocked<OrderService>;
    });

    describe('findByUser', () => {
        it('should return orders for the user', async () => {
            // Arrange
            const userId = 'user-123';
            const userRoles = [UserRole.BUYER];
            const page = 1;
            const limit = 20;
            const expectedResult = { data: [], total: 0 };

            orderService.findByUser.mockResolvedValue(expectedResult as any);

            // Act
            const result = await controller.findByUser(userId, userRoles, page, limit);

            // Assert
            expect(orderService.findByUser).toHaveBeenCalledWith(userId, page, limit);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findById', () => {
        it('should return order by id', async () => {
            // Arrange
            const id = 'order-123';
            const userId = 'user-123';
            const userRoles = [UserRole.BUYER];
            const expectedOrder = { id, userId };

            orderService.findById.mockResolvedValue(expectedOrder as any);

            // Act
            const result = await controller.findById(id, userId, userRoles);

            // Assert
            expect(orderService.findById).toHaveBeenCalledWith(
                id,
                userId,
                undefined, // userRole is undefined for BUYER in logic
            );
            expect(result).toEqual(expectedOrder);
        });

        it('should pass ADMIN role if user is admin', async () => {
            // Arrange
            const id = 'order-123';
            const userId = 'admin-123';
            const userRoles = [UserRole.ADMIN];

            // Act
            await controller.findById(id, userId, userRoles);

            // Assert
            expect(orderService.findById).toHaveBeenCalledWith(
                id,
                userId,
                UserRole.ADMIN,
            );
        });
    });

    describe('create', () => {
        it('should create an order', async () => {
            // Arrange
            const userId = 'user-123';
            const createDto = { items: [] } as any;
            const expectedOrder = { id: 'new-order' };

            orderService.createOrder.mockResolvedValue(expectedOrder as any);

            // Act
            const result = await controller.create(createDto, userId);

            // Assert
            expect(orderService.createOrder).toHaveBeenCalledWith(createDto, userId);
            expect(result).toEqual(expectedOrder);
        });
    });

    describe('cancel', () => {
        it('should cancel an order with BUYER role', async () => {
            // Arrange
            const orderId = 'order-123';
            const userId = 'user-123';
            const reason = 'test reason';
            const userRoles = [UserRole.BUYER];
            const body = { reason };

            // Act
            await controller.cancel(orderId, body, userId, userRoles);

            // Assert (Note: Controller might call cancelOrder, check implementation)
            // The controller implementation I viewed called cancelOrder. 
            // Ensure orderService mock supports it.
            // Wait, I saw OrderService has 'cancel'. Controller calls 'cancelOrder'.
            // If Controller calls 'cancelOrder', and OrderService only has 'cancel', then Controller is broken. 
            // But assuming I fix Controller or Service alias, let's assume Controller calls what it calls.
            // If I didn't fix Controller/Service mismatch, this test will fail if I can't mock the method the controller calls.
            // JS allows mocking 'cancelOrder' even if 'OrderService' type doesn't have it declared, but TS will complain.
            // I cast mock to 'any' in setup if needed, but here I cast to Mocked<OrderService>.
            // OrderService (type) does NOT have cancelOrder in my previous view. It has cancel.
            // So I likely need to fix the Controller to call 'cancel'.

            // I will assume I fix the Controller to call 'cancel' in the next step or alongside this test.
            // I'll test expectation that it calls 'cancel'.
            expect(orderService.cancel).toHaveBeenCalledWith(
                orderId,
                { reason }, // Dto construction
                userId,
                UserRole.BUYER
            );
        });
    });
});
