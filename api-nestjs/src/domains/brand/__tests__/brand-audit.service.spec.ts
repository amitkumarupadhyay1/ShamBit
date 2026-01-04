import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BrandAuditService, AuditLogEntry } from '../services/brand-audit.service';
import { Brand } from '../entities/brand.entity';
import { BrandStatus } from '../enums/brand-status.enum';
import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
} from '../../../test/utils/test-helpers';

describe('BrandAuditService', () => {
  let service: BrandAuditService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockBrand: Brand = TestDataFactory.createTestBrand({
    id: 'brand-1',
    name: 'Test Brand',
    status: BrandStatus.ACTIVE,
  });

  const mockAuditEntry: AuditLogEntry = {
    id: 'audit-1',
    brandId: 'brand-1',
    action: 'CREATE',
    oldValues: null,
    newValues: mockBrand,
    changes: null,
    userId: 'admin-1',
    userRole: 'ADMIN',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    reason: 'Brand created',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createBrandTestingModule([
      BrandAuditService,
    ]);

    service = module.get<BrandAuditService>(BrandAuditService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('should log brand creation action successfully', async () => {
      // Arrange
      const createdAuditEntry = { ...mockAuditEntry };
      prismaService.brandAuditLog.create.mockResolvedValue(createdAuditEntry);

      // Act
      await service.logAction(
        'brand-1',
        'CREATE',
        'admin-1',
        null,
        mockBrand,
        'Brand created',
        '192.168.1.1',
        'Mozilla/5.0',
        'ADMIN'
      );

      // Assert
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledWith({
        data: {
          brandId: 'brand-1',
          action: 'CREATE',
          oldValues: null,
          newValues: JSON.parse(JSON.stringify(mockBrand)),
          changes: null,
          userId: 'admin-1',
          userRole: 'ADMIN',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          reason: 'Brand created',
        },
      });
    });

    it('should log brand update action with changes calculation', async () => {
      // Arrange
      const oldBrand = { ...mockBrand, name: 'Old Name' };
      const newBrand = { ...mockBrand, name: 'New Name' };
      const expectedChanges = { name: { from: 'Old Name', to: 'New Name' } };
      
      const auditEntry = {
        ...mockAuditEntry,
        action: 'UPDATE',
        oldValues: oldBrand,
        newValues: newBrand,
        changes: expectedChanges,
      };
      
      prismaService.brandAuditLog.create.mockResolvedValue(auditEntry);

      // Act
      await service.logAction(
        'brand-1',
        'UPDATE',
        'admin-1',
        oldBrand,
        newBrand,
        'Brand updated',
        '192.168.1.1',
        'Mozilla/5.0',
        'ADMIN'
      );

      // Assert
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledWith({
        data: {
          brandId: 'brand-1',
          action: 'UPDATE',
          oldValues: JSON.parse(JSON.stringify(oldBrand)),
          newValues: JSON.parse(JSON.stringify(newBrand)),
          changes: JSON.parse(JSON.stringify(expectedChanges)),
          userId: 'admin-1',
          userRole: 'ADMIN',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          reason: 'Brand updated',
        },
      });
    });

    it('should log brand deletion action', async () => {
      // Arrange
      const deletedBrand = { ...mockBrand, deletedAt: new Date(), status: BrandStatus.ARCHIVED };
      const auditEntry = {
        ...mockAuditEntry,
        action: 'DELETE',
        oldValues: mockBrand,
        newValues: deletedBrand,
      };
      
      prismaService.brandAuditLog.create.mockResolvedValue(auditEntry);

      // Act
      await service.logAction(
        'brand-1',
        'DELETE',
        'admin-1',
        mockBrand,
        deletedBrand,
        'Brand deleted',
        '192.168.1.1',
        'Mozilla/5.0',
        'ADMIN'
      );

      // Assert
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE',
          oldValues: JSON.parse(JSON.stringify(mockBrand)),
          newValues: JSON.parse(JSON.stringify(deletedBrand)),
        }),
      });
    });

    it('should log status change action', async () => {
      // Arrange
      const oldBrand = { ...mockBrand, status: BrandStatus.DRAFT };
      const newBrand = { ...mockBrand, status: BrandStatus.ACTIVE };
      const expectedChanges = { status: { from: BrandStatus.DRAFT, to: BrandStatus.ACTIVE } };
      
      const auditEntry = {
        ...mockAuditEntry,
        action: 'STATUS_CHANGE',
        changes: expectedChanges,
      };
      
      prismaService.brandAuditLog.create.mockResolvedValue(auditEntry);

      // Act
      await service.logAction(
        'brand-1',
        'STATUS_CHANGE',
        'admin-1',
        oldBrand,
        newBrand,
        'Status changed to active',
        '192.168.1.1',
        'Mozilla/5.0',
        'ADMIN'
      );

      // Assert
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'STATUS_CHANGE',
          changes: JSON.parse(JSON.stringify(expectedChanges)),
        }),
      });
    });

    it('should handle minimal parameters', async () => {
      // Arrange
      const minimalAuditEntry = {
        ...mockAuditEntry,
        ipAddress: null,
        userAgent: null,
        reason: null,
        userRole: 'UNKNOWN',
      };
      
      prismaService.brandAuditLog.create.mockResolvedValue(minimalAuditEntry);

      // Act
      await service.logAction('brand-1', 'CREATE', 'admin-1');

      // Assert
      expect(prismaService.brandAuditLog.create).toHaveBeenCalledWith({
        data: {
          brandId: 'brand-1',
          action: 'CREATE',
          oldValues: null,
          newValues: null,
          changes: null,
          userId: 'admin-1',
          userRole: 'UNKNOWN',
          ipAddress: null,
          userAgent: null,
          reason: null,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      prismaService.brandAuditLog.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.logAction('brand-1', 'CREATE', 'admin-1', null, mockBrand)
      ).rejects.toThrow();
    });

    it('should complete logging within acceptable time', async () => {
      // Arrange
      prismaService.brandAuditLog.create.mockResolvedValue(mockAuditEntry);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.logAction('brand-1', 'CREATE', 'admin-1', null, mockBrand)
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 100);
    });
  });

  describe('getAuditHistory', () => {
    const mockAuditHistory = [mockAuditEntry];

    it('should return audit history for brand', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(1);

      const pagination = { page: 1, limit: 10 };

      // Act
      const result = await service.getAuditHistory('brand-1', pagination);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      expect(prismaService.brandAuditLog.count).toHaveBeenCalledWith({
        where: { brandId: 'brand-1' },
      });
      expect(result).toEqual({
        data: mockAuditHistory,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(25);

      const pagination = { page: 3, limit: 5 };

      // Act
      await service.getAuditHistory('brand-1', pagination);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-1' },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page - 1) * limit = (3 - 1) * 5
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should filter by action type', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(1);

      const filters = { action: 'UPDATE' };

      // Act
      await service.getAuditHistory('brand-1', {}, filters);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { 
          brandId: 'brand-1',
          action: 'UPDATE',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should filter by user ID', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(1);

      const filters = { userId: 'admin-1' };

      // Act
      await service.getAuditHistory('brand-1', {}, filters);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { 
          brandId: 'brand-1',
          userId: 'admin-1',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should filter by date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(1);

      const filters = { startDate, endDate };

      // Act
      await service.getAuditHistory('brand-1', {}, filters);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { 
          brandId: 'brand-1',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should return empty result when no audit entries found', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue([]);
      prismaService.brandAuditLog.count.mockResolvedValue(0);

      // Act
      const result = await service.getAuditHistory('non-existent-brand');

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      prismaService.brandAuditLog.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getAuditHistory('brand-1')).rejects.toThrow();
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      // Arrange
      const mockStats = [
        { action: 'CREATE', _count: { id: 10 } },
        { action: 'UPDATE', _count: { id: 25 } },
        { action: 'DELETE', _count: { id: 5 } },
        { action: 'STATUS_CHANGE', _count: { id: 15 } },
      ];
      
      prismaService.brandAuditLog.groupBy.mockResolvedValue(mockStats);

      // Act
      const result = await service.getAuditStatistics();

      // Assert
      expect(prismaService.brandAuditLog.groupBy).toHaveBeenCalledWith({
        by: ['action'],
        _count: { id: true },
      });
      
      expect(result).toEqual({
        total: 55,
        byAction: {
          CREATE: 10,
          UPDATE: 25,
          DELETE: 5,
          STATUS_CHANGE: 15,
        },
      });
    });

    it('should return statistics for specific brand', async () => {
      // Arrange
      const mockStats = [
        { action: 'CREATE', _count: { id: 1 } },
        { action: 'UPDATE', _count: { id: 3 } },
      ];
      
      prismaService.brandAuditLog.groupBy.mockResolvedValue(mockStats);

      // Act
      const result = await service.getAuditStatistics('brand-1');

      // Assert
      expect(prismaService.brandAuditLog.groupBy).toHaveBeenCalledWith({
        by: ['action'],
        where: { brandId: 'brand-1' },
        _count: { id: true },
      });
      
      expect(result.total).toBe(4);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      prismaService.brandAuditLog.groupBy.mockResolvedValue([]);

      // Act
      const result = await service.getAuditStatistics();

      // Assert
      expect(result.total).toBe(0);
      expect(result.byAction).toEqual({});
    });
  });

  describe('calculateChanges', () => {
    it('should calculate changes between old and new values', () => {
      // Arrange
      const oldValues = { name: 'Old Name', status: BrandStatus.DRAFT };
      const newValues = { name: 'New Name', status: BrandStatus.ACTIVE };

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toEqual({
        name: { from: 'Old Name', to: 'New Name' },
        status: { from: BrandStatus.DRAFT, to: BrandStatus.ACTIVE },
      });
    });

    it('should handle null old values (creation)', () => {
      // Arrange
      const oldValues = null;
      const newValues = { name: 'New Brand', status: BrandStatus.DRAFT };

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toBeNull();
    });

    it('should handle null new values (deletion)', () => {
      // Arrange
      const oldValues = { name: 'Brand Name', status: BrandStatus.ACTIVE };
      const newValues = null;

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toBeNull();
    });

    it('should ignore unchanged values', () => {
      // Arrange
      const oldValues = { name: 'Same Name', status: BrandStatus.ACTIVE, description: 'Old desc' };
      const newValues = { name: 'Same Name', status: BrandStatus.ACTIVE, description: 'New desc' };

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toEqual({
        description: { from: 'Old desc', to: 'New desc' },
      });
    });

    it('should handle nested object changes', () => {
      // Arrange
      const oldValues = { 
        metadata: { foundedYear: 2020, tags: ['old'] },
        name: 'Brand'
      };
      const newValues = { 
        metadata: { foundedYear: 2021, tags: ['new'] },
        name: 'Brand'
      };

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toEqual({
        metadata: { 
          from: { foundedYear: 2020, tags: ['old'] },
          to: { foundedYear: 2021, tags: ['new'] }
        },
      });
    });

    it('should handle array changes', () => {
      // Arrange
      const oldValues = { categoryIds: ['cat-1', 'cat-2'] };
      const newValues = { categoryIds: ['cat-1', 'cat-3'] };

      // Act
      const changes = service.calculateChanges(oldValues, newValues);

      // Assert
      expect(changes).toEqual({
        categoryIds: { 
          from: ['cat-1', 'cat-2'],
          to: ['cat-1', 'cat-3']
        },
      });
    });
  });

  describe('getUserAuditHistory', () => {
    it('should return audit history for specific user', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue(mockAuditHistory);
      prismaService.brandAuditLog.count.mockResolvedValue(1);

      // Act
      const result = await service.getUserAuditHistory('admin-1');

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'admin-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
      expect(result.data).toEqual(mockAuditHistory);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent audit activity', async () => {
      // Arrange
      const recentActivity = [mockAuditEntry];
      prismaService.brandAuditLog.findMany.mockResolvedValue(recentActivity);

      // Act
      const result = await service.getRecentActivity(5);

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      expect(result).toEqual(recentActivity);
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      prismaService.brandAuditLog.findMany.mockResolvedValue([]);

      // Act
      await service.getRecentActivity();

      // Assert
      expect(prismaService.brandAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 10, // Default limit
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  });
});