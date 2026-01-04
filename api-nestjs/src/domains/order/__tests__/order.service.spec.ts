import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';

import { OrderService } from '../order.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderAuditService } from '../services/order-audit.service';
import { OrderOrchestrationService } from '../services/order-orchestration.service';
import { OrderFulfillmentService } from '../services/order-fulfillment.service';
import { OrderRefundService } from '../services/order-refund.service';
import { InventoryReservationService } from '../../inventory/services/inventory-reservation.service';
import { OrderStatus } from '../enums/order-status.enum';
import { UserRole } from '../../../common/types';

import {
    TestModuleBuilder,
    TestDataFactory,
    MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('OrderService', () => {
    let service: OrderService;
    let orderRepository: jest.Mocked<any>; // Using any for custom repo methods not in standard mock
    let orderAuditService: jest.Mocked<any>;
    let orderOrchestrationService: jest.Mocked<any>;
    let orderFulfillmentService: jest.Mocked<any>;
    let orderRefundService: jest.Mocked<any>;
    let inventoryReservationService: jest.Mocked<any>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(async () => {
        const module: TestingModule = await TestModuleBuilder.createOrderTestingModule([
            OrderService,
            {
                provide: OrderRepository,
                useValue: MockServicesFactory.createMockOrderRepository(),
            },
            {
                provide: OrderAuditService,
                useValue: MockServicesFactory.createMockOrderAuditService(),
            },
            {
                provide: OrderOrchestrationService,
                useValue: MockServicesFactory.createMockOrderOrchestrationService(),
            },
            {
                provide: OrderFulfillmentService,
                useValue: MockServicesFactory.createMockOrderFulfillmentService(),
            },
            {
                provide: OrderRefundService,
                useValue: MockServicesFactory.createMockOrderRefundService(),
            },
            {
                provide: InventoryReservationService,
                useValue: MockServicesFactory.createMockInventoryReservationService(),
            },
        ]);

        service = module.get<OrderService>(OrderService);
        orderRepository = module.get(OrderRepository);
        orderAuditService = module.get(OrderAuditService);
        orderOrchestrationService = module.get(OrderOrchestrationService);
        orderFulfillmentService = module.get(OrderFulfillmentService);
        orderRefundService = module.get(OrderRefundService);
        inventoryReservationService = module.get(InventoryReservationService);
        eventEmitter = module.get(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return orders with filters applied', async () => {
            // Arrange
            const filters = { status: OrderStatus.PENDING };
            const pagination = { page: 1, limit: 10 };
            const expectedOrders = [{ id: 'order-1' }, { id: 'order-2' }];
            orderRepository.findAll.mockResolvedValue({
                data: expectedOrders,
                total: 2,
            });

            // Act
            const result = await service.findAll(filters, pagination);

            // Assert
            expect(orderRepository.findAll).toHaveBeenCalledWith(
                filters,
                pagination,
                {},
            );
            expect(result).toEqual({ data: expectedOrders, total: 2 });
        });

        it('should filter by customerId for CUSTOMER role', async () => {
            // Arrange
            const userId = 'user-123';
            const role = UserRole.CUSTOMER;
            orderRepository.findAll.mockResolvedValue({ data: [], total: 0 });

            // Act
            await service.findAll({}, {}, {}, userId, role);

            // Assert
            expect(orderRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ customerId: userId }),
                expect.any(Object),
                expect.any(Object),
            );
        });
    });

    describe('findById', () => {
        it('should return order if found and accessible', async () => {
            // Arrange
            const orderId = 'order-123';
            const userId = 'user-123';
            const order = { id: orderId, customerId: userId, status: OrderStatus.PENDING };
            orderRepository.findById.mockResolvedValue(order);

            // Act
            const result = await service.findById(orderId, {}, userId, UserRole.CUSTOMER);

            // Assert
            expect(result).toEqual(order);
        });

        it('should throw NotFoundException if order does not exist', async () => {
            // Arrange
            orderRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.findById('non-existent', {}),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user cannot access order', async () => {
            // Arrange
            const order = { id: 'order-123', customerId: 'other-user', status: OrderStatus.PENDING };
            orderRepository.findById.mockResolvedValue(order);

            // Act & Assert
            await expect(
                service.findById('order-123', {}, 'user-123', UserRole.CUSTOMER),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('create', () => {
        it('should successfully create an order via orchestration service', async () => {
            // Arrange
            const createOrderDto = {
                items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
                customerId: 'user-123',
            } as any;
            const createdBy = 'user-123';
            const createdOrder = { id: 'order-123', ...createOrderDto };

            orderOrchestrationService.createOrder.mockResolvedValue({
                success: true,
                order: createdOrder,
            });

            // Act
            const result = await service.create(createOrderDto, createdBy);

            // Assert
            expect(orderOrchestrationService.createOrder).toHaveBeenCalledWith(
                createOrderDto,
                createdBy,
            );
            expect(result).toEqual(createdOrder);
        });

        it('should throw BadRequestException if orchestration fails', async () => {
            // Arrange
            const createOrderDto = {
                items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }],
                customerId: 'user-123',
            } as any;
            const createdBy = 'user-123';

            orderOrchestrationService.createOrder.mockResolvedValue({
                success: false,
                error: 'Inventory unavailable',
            });

            // Act & Assert
            await expect(service.create(createOrderDto, createdBy)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('updateStatus', () => {
        it('should successfully update status and trigger side effects', async () => {
            // Arrange
            const orderId = 'order-123';
            const userId = 'admin-123';
            const order = {
                id: orderId,
                status: OrderStatus.PENDING,
                items: [{ reservationKey: 'res-1' }],
                isFullyPaid: () => true
            };
            // mocking isFullyPaid method
            order.isFullyPaid = jest.fn().mockReturnValue(true);

            const statusUpdate = { status: OrderStatus.CONFIRMED };

            orderRepository.findById.mockResolvedValue(order);
            // Mock transaction behavior (simplified)
            const updatedOrder = { ...order, status: OrderStatus.CONFIRMED };

            // We need to mock the implementation of updateStatus because it uses a transaction
            // Since we can't easily mock the transaction callback execution in this setup without more complex mocking of PrismaService.$transaction,
            // we will rely on the service logic.
            // However, TestModuleBuilder mocks PrismaService.$transaction to execute the callback.
            // So we just need to ensure the inner calls work.

            orderRepository.updateStatus.mockResolvedValue(updatedOrder);
            inventoryReservationService.getReservation.mockResolvedValue({ id: 'res-1' });

            // Act
            const result = await service.updateStatus(orderId, statusUpdate, userId, UserRole.ADMIN);

            // Assert
            expect(orderRepository.updateStatus).toHaveBeenCalledWith(
                orderId,
                OrderStatus.CONFIRMED,
                userId,
            );
            // Check that audit log was called
            expect(orderAuditService.logAction).toHaveBeenCalled();
            // Check that event was emitted
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                'order.status.changed',
                expect.any(Object),
            );
        });
    });

    describe('cancel', () => {
        it('should cancel order and release inventory', async () => {
            const orderId = 'order-123';
            const userId = 'user-123';
            const order = {
                id: orderId,
                status: OrderStatus.PENDING,
                customerId: userId,
                canBeCancelled: true,
                items: [{ id: 'item-1', reservationKey: 'res-1' }],
                orderNumber: 'ORD-123'
            };
            const cancelDto = { reason: 'Changed mind' };

            orderRepository.findById.mockResolvedValue(order);
            orderRepository.updateStatus.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

            await service.cancel(orderId, cancelDto, userId, UserRole.CUSTOMER);

            expect(orderRepository.updateStatus).toHaveBeenCalledWith(orderId, OrderStatus.CANCELLED, userId);
            expect(inventoryReservationService.releaseReservation).toHaveBeenCalled();
            expect(eventEmitter.emit).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
        });

        it('should throw BadRequestException if order cannot be cancelled', async () => {
            const orderId = 'order-123';
            const userId = 'user-123';
            const order = {
                id: orderId,
                status: OrderStatus.SHIPPED,
                customerId: userId,
                canBeCancelled: false, // SHIPPED orders usually can't be cancelled
            };

            orderRepository.findById.mockResolvedValue(order);

            await expect(service.cancel(orderId, { reason: 'test' }, userId, UserRole.CUSTOMER)).rejects.toThrow(BadRequestException);
        });
    });
});
