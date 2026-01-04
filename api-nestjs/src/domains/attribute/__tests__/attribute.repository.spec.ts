import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AttributeRepository } from '../repositories/attribute.repository';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { AttributeDataType } from '../enums/attribute-data-type.enum';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestErrorHelper,
  TestPerformanceHelper,
  TestSecurityHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('AttributeRepository', () => {
  let repository: AttributeRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createAttributeTestingModule([
      AttributeRepository,
    ]);

    repository = module.get<AttributeRepository>(AttributeRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated attributes successfully', async () => {
      // Arrange
      const filters = { status: AttributeStatus.ACTIVE };
      const pagination = { page: 1, limit: 10, sortBy: 'displayOrder', sortOrder: 'asc' };
      const includes = { includeOptions: true, includeLocalizations: true };
      const mockPrismaData = [TestDataFactory.createTestAttribute()];
      const mockResponse = {
        data: mockPrismaData,
        total: 1,
      };

      // Mock the Prisma queries
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockPrismaData);
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await repository.findAll(filters, pagination, includes);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: AttributeStatus.ACTIVE, deletedAt: null }),
        include: expect.objectContaining({
          attributeOptions: expect.objectContaining({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          }),
          localizations: true,
        }),
        orderBy: { displayOrder: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      (prismaService.attribute.findMany as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow();
    });

    it('should apply complex filters correctly', async () => {
      // Arrange
      const filters = {
        status: AttributeStatus.ACTIVE,
        visibility: 'PUBLIC',
        dataType: AttributeDataType.STRING,
        isRequired: false,
        isVariant: true,
        groupName: 'General',
        search: 'color',
        createdBy: 'user-123',
        createdAfter: new Date('2024-01-01'),
        createdBefore: new Date('2024-12-31'),
      };

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      await repository.findAll(filters);

      // Assert
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            status: AttributeStatus.ACTIVE,
            visibility: 'PUBLIC',
            dataType: AttributeDataType.STRING,
            isRequired: false,
            isVariant: true,
            groupName: 'General',
            createdBy: 'user-123',
            createdAt: {
              gte: filters.createdAfter,
              lte: filters.createdBefore,
            },
            OR: [
              { name: { contains: 'color', mode: 'insensitive' } },
              { description: { contains: 'color', mode: 'insensitive' } },
              { slug: { contains: 'color', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const mockData = [TestDataFactory.createTestAttribute()];
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockData);
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(1);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.findAll(),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 200); // Should complete under 200ms
    });
  });

  describe('findById', () => {
    it('should find attribute by ID successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockPrismaData = TestDataFactory.createTestAttribute({ id: attributeId });
      const includes = { includeOptions: true };

      (prismaService.attribute.findUnique as jest.Mock).mockResolvedValue(mockPrismaData);

      // Act
      const result = await repository.findById(attributeId, includes);

      // Assert
      expect(result).toEqual(mockPrismaData);
      expect(prismaService.attribute.findUnique).toHaveBeenCalledWith({
        where: { id: attributeId },
        include: expect.objectContaining({
          attributeOptions: expect.objectContaining({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          }),
        }),
      });
    });

    it('should return null when attribute not found', async () => {
      // Arrange
      const attributeId = 'nonexistent';
      (prismaService.attribute.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.findById(attributeId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      (prismaService.attribute.findUnique as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findById('attr-123')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should find attribute by slug successfully', async () => {
      // Arrange
      const slug = 'test-attribute';
      const mockPrismaData = TestDataFactory.createTestAttribute({ slug });

      (prismaService.attribute.findUnique as jest.Mock).mockResolvedValue(mockPrismaData);

      // Act
      const result = await repository.findBySlug(slug);

      // Assert
      expect(result).toEqual(mockPrismaData);
      expect(prismaService.attribute.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should return null when attribute not found by slug', async () => {
      // Arrange
      const slug = 'nonexistent-slug';
      (prismaService.attribute.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.findBySlug(slug);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should find multiple attributes by IDs', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const mockPrismaData = [
        TestDataFactory.createTestAttribute({ id: 'attr-1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2' }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockPrismaData);

      // Act
      const result = await repository.findByIds(ids);

      // Assert
      expect(result).toEqual(mockPrismaData);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should return empty array for empty input', async () => {
      // Arrange
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await repository.findByIds([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create attribute successfully', async () => {
      // Arrange
      const attributeData = {
        name: 'New Attribute',
        slug: 'new-attribute',
        dataType: AttributeDataType.STRING,
        createdBy: 'user-123',
        description: 'Test description',
        isRequired: false,
        isVariant: true,
      };
      const mockCreatedAttribute = TestDataFactory.createTestAttribute(attributeData);

      (prismaService.attribute.create as jest.Mock).mockResolvedValue(mockCreatedAttribute);

      // Act
      const result = await repository.create(attributeData);

      // Assert
      expect(result).toEqual(mockCreatedAttribute);
      expect(prismaService.attribute.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: attributeData.name,
          slug: attributeData.slug,
          dataType: attributeData.dataType,
          createdBy: attributeData.createdBy,
          description: attributeData.description,
          isRequired: attributeData.isRequired,
          isVariant: attributeData.isVariant,
          status: AttributeStatus.DRAFT,
        }),
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should create attribute with options', async () => {
      // Arrange
      const attributeData = {
        name: 'Color',
        slug: 'color',
        dataType: AttributeDataType.ENUM,
        createdBy: 'user-123',
        options: [
          { value: 'red', label: 'Red', displayOrder: 1, isDefault: false },
          { value: 'blue', label: 'Blue', displayOrder: 2, isDefault: true },
        ],
      };
      const mockCreatedAttribute = TestDataFactory.createTestAttribute(attributeData);

      (prismaService.attribute.create as jest.Mock).mockResolvedValue(mockCreatedAttribute);

      // Act
      const result = await repository.create(attributeData);

      // Assert
      expect(prismaService.attribute.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attributeOptions: {
            createMany: {
              data: attributeData.options.map(option => ({
                value: option.value,
                label: option.label,
                displayOrder: option.displayOrder,
                isDefault: option.isDefault,
              })),
            },
          },
        }),
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should create attribute with localizations', async () => {
      // Arrange
      const attributeData = {
        name: 'Size',
        slug: 'size',
        dataType: AttributeDataType.ENUM,
        createdBy: 'user-123',
        localizations: [
          { locale: 'es', name: 'Tamaño', description: 'Descripción del tamaño' },
          { locale: 'fr', name: 'Taille', description: 'Description de la taille' },
        ],
      };
      const mockCreatedAttribute = TestDataFactory.createTestAttribute(attributeData);

      (prismaService.attribute.create as jest.Mock).mockResolvedValue(mockCreatedAttribute);

      // Act
      const result = await repository.create(attributeData);

      // Assert
      expect(prismaService.attribute.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          localizations: {
            createMany: {
              data: attributeData.localizations.map(loc => ({
                locale: loc.locale,
                name: loc.name,
                description: loc.description,
              })),
            },
          },
        }),
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const attributeData = {
        name: 'Test Attribute',
        slug: 'test-attribute',
        dataType: AttributeDataType.STRING,
        createdBy: 'user-123',
      };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      (prismaService.attribute.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.create(attributeData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update attribute successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        isRequired: true,
        updatedBy: 'user-456',
      };
      const mockUpdatedAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        ...updateData,
      });

      (prismaService.attribute.update as jest.Mock).mockResolvedValue(mockUpdatedAttribute);

      // Act
      const result = await repository.update(attributeId, updateData);

      // Assert
      expect(result).toEqual(mockUpdatedAttribute);
      expect(prismaService.attribute.update).toHaveBeenCalledWith({
        where: { id: attributeId },
        data: updateData,
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should handle partial updates', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateData = { isRequired: false };
      const mockUpdatedAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        isRequired: false,
      });

      (prismaService.attribute.update as jest.Mock).mockResolvedValue(mockUpdatedAttribute);

      // Act
      const result = await repository.update(attributeId, updateData);

      // Assert
      expect(result.isRequired).toBe(false);
      expect(prismaService.attribute.update).toHaveBeenCalledWith({
        where: { id: attributeId },
        data: updateData,
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateData = { name: 'Updated Name' };
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      (prismaService.attribute.update as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.update(attributeId, updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete attribute successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';

      (prismaService.attribute.delete as jest.Mock).mockResolvedValue(undefined);

      // Act
      await repository.delete(attributeId);

      // Assert
      expect(prismaService.attribute.delete).toHaveBeenCalledWith({
        where: { id: attributeId },
      });
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      (prismaService.attribute.delete as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.delete(attributeId)).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should soft delete attribute successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const deletedBy = 'user-456';
      const reason = 'Cleanup old attribute';

      (prismaService.attribute.update as jest.Mock).mockResolvedValue(undefined);

      // Act
      await repository.softDelete(attributeId, deletedBy, reason);

      // Assert
      expect(prismaService.attribute.update).toHaveBeenCalledWith({
        where: { id: attributeId },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: deletedBy,
          status: AttributeStatus.ARCHIVED,
        }),
      });
    });

    it('should handle soft delete without reason', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const deletedBy = 'user-456';

      (prismaService.attribute.update as jest.Mock).mockResolvedValue(undefined);

      // Act
      await repository.softDelete(attributeId, deletedBy);

      // Assert
      expect(prismaService.attribute.update).toHaveBeenCalledWith({
        where: { id: attributeId },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: deletedBy,
          status: AttributeStatus.ARCHIVED,
        }),
      });
    });
  });

  describe('validateSlug', () => {
    it('should return true for unique slug', async () => {
      // Arrange
      const slug = 'unique-slug';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.validateSlug(slug);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.attribute.count).toHaveBeenCalledWith({
        where: { slug },
      });
    });

    it('should return false for existing slug', async () => {
      // Arrange
      const slug = 'existing-slug';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await repository.validateSlug(slug);

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude specified ID when validating', async () => {
      // Arrange
      const slug = 'test-slug';
      const excludeId = 'attr-123';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.validateSlug(slug, excludeId);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.attribute.count).toHaveBeenCalledWith({
        where: { slug, id: { not: excludeId } },
      });
    });
  });

  describe('validateName', () => {
    it('should return true for unique name', async () => {
      // Arrange
      const name = 'Unique Name';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.validateName(name);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.attribute.count).toHaveBeenCalledWith({
        where: { name },
      });
    });

    it('should return false for existing name', async () => {
      // Arrange
      const name = 'Existing Name';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await repository.validateName(name);

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude specified ID when validating', async () => {
      // Arrange
      const name = 'Test Name';
      const excludeId = 'attr-123';
      (prismaService.attribute.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.validateName(name, excludeId);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.attribute.count).toHaveBeenCalledWith({
        where: { name, id: { not: excludeId } },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const status = AttributeStatus.ACTIVE;
      const updatedBy = 'user-456';
      const mockUpdatedAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status,
        updatedBy,
      });

      (prismaService.attribute.update as jest.Mock).mockResolvedValue(mockUpdatedAttribute);

      // Act
      const result = await repository.updateStatus(attributeId, status, updatedBy);

      // Assert
      expect(result).toEqual(mockUpdatedAttribute);
      expect(prismaService.attribute.update).toHaveBeenCalledWith({
        where: { id: attributeId },
        data: { status, updatedBy },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
      });
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update status successfully', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const status = AttributeStatus.DEPRECATED;
      const updatedBy = 'user-123';

      (prismaService.attribute.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Act
      const result = await repository.bulkUpdateStatus(ids, status, updatedBy);

      // Assert
      expect(result).toHaveLength(2);
      expect(prismaService.attribute.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        data: { status, updatedBy },
      });
    });

    it('should return updated attributes', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const status = AttributeStatus.ACTIVE;
      const updatedBy = 'user-123';
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1', status }),
        TestDataFactory.createTestAttribute({ id: 'attr-2', status }),
      ];

      (prismaService.attribute.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockAttributes);

      // Act
      const result = await repository.bulkUpdateStatus(ids, status, updatedBy);

      // Assert
      expect(result).toEqual(mockAttributes);
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update attributes successfully', async () => {
      // Arrange
      const updates = [
        { id: 'attr-1', data: { name: 'Updated 1' }, updatedBy: 'user-123' },
        { id: 'attr-2', data: { name: 'Updated 2' }, updatedBy: 'user-123' },
      ];
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1', name: 'Updated 1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2', name: 'Updated 2' }),
      ];

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        await callback({ attribute: { update: jest.fn() } });
        return undefined;
      });
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockAttributes);

      // Act
      const result = await repository.bulkUpdate(updates);

      // Assert
      expect(result).toEqual(mockAttributes);
    });
  });

  describe('bulkDelete', () => {
    it('should bulk soft delete attributes successfully', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const deletedBy = 'user-123';
      const reason = 'Bulk cleanup';

      (prismaService.attribute.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Act
      await repository.bulkDelete(ids, deletedBy, reason);

      // Assert
      expect(prismaService.attribute.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: deletedBy,
          status: AttributeStatus.ARCHIVED,
        }),
      });
    });
  });

  describe('searchByName', () => {
    it('should search attributes by name successfully', async () => {
      // Arrange
      const query = 'color';
      const filters = { status: AttributeStatus.ACTIVE };
      const mockResults = [
        TestDataFactory.createTestAttribute({ name: 'Color' }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.searchByName(query, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          ...repository['buildWhereClause'](filters),
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { name: 'asc' },
      });
    });

    it('should handle special characters in search', async () => {
      // Arrange
      const query = 'café & müller';
      const mockResults = [TestDataFactory.createTestAttribute()];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.searchByName(query);

      // Assert
      expect(result).toEqual(mockResults);
    });
  });

  describe('findByGroup', () => {
    it('should find attributes by group successfully', async () => {
      // Arrange
      const groupName = 'General';
      const filters = { isFilterable: true };
      const mockResults = [
        TestDataFactory.createTestAttribute({ groupName }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findByGroup(groupName, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          ...repository['buildWhereClause'](filters),
          groupName,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('findByDataType', () => {
    it('should find attributes by data type successfully', async () => {
      // Arrange
      const dataType = AttributeDataType.ENUM;
      const filters = { isVariant: true };
      const mockResults = [
        TestDataFactory.createTestAttribute({ dataType }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findByDataType(dataType, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          ...repository['buildWhereClause'](filters),
          dataType,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findByCategoryId', () => {
    it('should find attributes for category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const includeInherited = true;
      const mockResults = [
        TestDataFactory.createTestAttribute(),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findByCategoryId(categoryId, includeInherited);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          status: AttributeStatus.ACTIVE,
          deletedAt: null,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('findVariantAttributesForCategory', () => {
    it('should find variant attributes for category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const mockResults = [
        TestDataFactory.createTestAttribute({ isVariant: true }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findVariantAttributesForCategory(categoryId);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          isVariant: true,
          status: AttributeStatus.ACTIVE,
          deletedAt: null,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('findFilterableAttributesForCategory', () => {
    it('should find filterable attributes for category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const mockResults = [
        TestDataFactory.createTestAttribute({ isFilterable: true }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.findFilterableAttributesForCategory(categoryId);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          isFilterable: true,
          status: AttributeStatus.ACTIVE,
          deletedAt: null,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive attribute statistics', async () => {
      // Arrange
      const mockStats = {
        total: 150,
        active: 120,
        draft: 15,
        deprecated: 10,
        archived: 5,
        variant: 80,
        filterable: 100,
        searchable: 60,
        localizable: 25,
        byType: [
          { dataType: 'STRING', _count: 50 },
          { dataType: 'NUMBER', _count: 30 },
        ],
        byGroup: [
          { groupName: 'General', _count: 60 },
          { groupName: 'Technical', _count: 40 },
        ],
      };

      // Mock all the Prisma calls
      (prismaService.attribute.count as jest.Mock)
        .mockResolvedValueOnce(150) // total
        .mockResolvedValueOnce(120) // active
        .mockResolvedValueOnce(15)  // draft
        .mockResolvedValueOnce(10)  // deprecated
        .mockResolvedValueOnce(5)   // archived
        .mockResolvedValueOnce(80)  // variant
        .mockResolvedValueOnce(100) // filterable
        .mockResolvedValueOnce(60)  // searchable
        .mockResolvedValueOnce(25); // localizable

      (prismaService.attribute.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.byType)
        .mockResolvedValueOnce(mockStats.byGroup);

      // Act
      const result = await repository.getStatistics();

      // Assert
      expect(result.totalAttributes).toBe(150);
      expect(result.activeAttributes).toBe(120);
      expect(result.draftAttributes).toBe(15);
      expect(result.deprecatedAttributes).toBe(10);
      expect(result.archivedAttributes).toBe(5);
      expect(result.variantAttributes).toBe(80);
      expect(result.filterableAttributes).toBe(100);
      expect(result.searchableAttributes).toBe(60);
      expect(result.localizableAttributes).toBe(25);
      expect(result.attributesByType).toEqual({
        STRING: 50,
        NUMBER: 30,
      });
      expect(result.attributesByGroup).toEqual({
        General: 60,
        Technical: 40,
      });
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for attribute', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockStats = {
        productUsage: 200,
        variantUsage: 30,
        categoryUsage: 20,
        lastUsed: new Date(),
      };

      (prismaService.attributeValue.count as jest.Mock)
        .mockResolvedValueOnce(200) // product
        .mockResolvedValueOnce(30)  // variant
        .mockResolvedValueOnce(20); // category

      (prismaService.attributeValue.findFirst as jest.Mock).mockResolvedValue({
        updatedAt: mockStats.lastUsed,
      });

      // Act
      const result = await repository.getUsageStats(attributeId);

      // Assert
      expect(result.attributeId).toBe(attributeId);
      expect(result.totalUsage).toBe(250);
      expect(result.productUsage).toBe(200);
      expect(result.variantUsage).toBe(30);
      expect(result.categoryUsage).toBe(20);
      expect(result.lastUsed).toEqual(mockStats.lastUsed);
    });

    it('should handle attribute with no usage', async () => {
      // Arrange
      const attributeId = 'attr-123';

      (prismaService.attributeValue.count as jest.Mock).mockResolvedValue(0);
      (prismaService.attributeValue.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.getUsageStats(attributeId);

      // Assert
      expect(result.totalUsage).toBe(0);
      expect(result.lastUsed).toBeUndefined();
    });
  });

  describe('getPopularAttributes', () => {
    it('should return popular attributes', async () => {
      // Arrange
      const limit = 10;
      const mockResults = Array(limit)
        .fill(null)
        .map(() => TestDataFactory.createTestAttribute());

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.getPopularAttributes(limit);

      // Assert
      expect(result).toHaveLength(limit);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          status: AttributeStatus.ACTIVE,
          deletedAt: null,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      const mockResults = [TestDataFactory.createTestAttribute()];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      await repository.getPopularAttributes();

      // Assert
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('getUnusedAttributes', () => {
    it('should return unused attributes older than specified days', async () => {
      // Arrange
      const olderThanDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const mockResults = [
        TestDataFactory.createTestAttribute({
          updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        }),
      ];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const result = await repository.getUnusedAttributes(olderThanDays);

      // Assert
      expect(result).toEqual(mockResults);
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith({
        where: {
          updatedAt: { lt: expect.any(Date) },
          status: { not: AttributeStatus.ARCHIVED },
          deletedAt: null,
        },
        include: expect.objectContaining({
          attributeOptions: true,
          localizations: true,
        }),
        orderBy: { updatedAt: 'asc' },
      });
    });

    it('should use default days when not specified', async () => {
      // Arrange
      const mockResults = [TestDataFactory.createTestAttribute()];

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      await repository.getUnusedAttributes();

      // Assert
      expect(prismaService.attribute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            updatedAt: { lt: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('refreshUsageStats', () => {
    it('should refresh usage stats for specific attribute', async () => {
      // Arrange
      const attributeId = 'attr-123';

      // Act
      await repository.refreshUsageStats(attributeId);

      // Assert
      // This method currently does nothing, but we test it's callable
      expect(true).toBe(true);
    });

    it('should refresh usage stats for all attributes', async () => {
      // Act
      await repository.refreshUsageStats();

      // Assert
      expect(true).toBe(true);
    });
  });

  describe('cleanupDeletedAttributes', () => {
    it('should cleanup deleted attributes older than specified days', async () => {
      // Arrange
      const olderThanDays = 365;
      const deletedCount = 15;

      (prismaService.attribute.deleteMany as jest.Mock).mockResolvedValue({
        count: deletedCount,
      });

      // Act
      const result = await repository.cleanupDeletedAttributes(olderThanDays);

      // Assert
      expect(result).toBe(deletedCount);
      expect(prismaService.attribute.deleteMany).toHaveBeenCalledWith({
        where: {
          deletedAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should use default days when not specified', async () => {
      // Arrange
      (prismaService.attribute.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      await repository.cleanupDeletedAttributes();

      // Assert
      expect(prismaService.attribute.deleteMany).toHaveBeenCalledWith({
        where: {
          deletedAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('buildWhereClause', () => {
    it('should build complex where clause correctly', () => {
      // Arrange
      const filters = {
        status: AttributeStatus.ACTIVE,
        visibility: 'PUBLIC' as const,
        dataType: AttributeDataType.STRING,
        isRequired: true,
        isVariant: false,
        groupName: 'General',
        search: 'color',
        createdBy: 'user-123',
        createdAfter: new Date('2024-01-01'),
        createdBefore: new Date('2024-12-31'),
      };

      // Act
      const whereClause = repository['buildWhereClause'](filters);

      // Assert
      expect(whereClause).toEqual({
        deletedAt: null,
        status: AttributeStatus.ACTIVE,
        visibility: 'PUBLIC',
        dataType: AttributeDataType.STRING,
        isRequired: true,
        isVariant: false,
        groupName: 'General',
        createdBy: 'user-123',
        createdAt: {
          gte: filters.createdAfter,
          lte: filters.createdBefore,
        },
        OR: [
          { name: { contains: 'color', mode: 'insensitive' } },
          { description: { contains: 'color', mode: 'insensitive' } },
          { slug: { contains: 'color', mode: 'insensitive' } },
        ],
      });
    });

    it('should handle empty filters', () => {
      // Act
      const whereClause = repository['buildWhereClause']({});

      // Assert
      expect(whereClause).toEqual({
        deletedAt: null,
      });
    });
  });

  describe('buildOrderByClause', () => {
    it('should build order by clause correctly', () => {
      // Arrange
      const pagination = { sortBy: 'name', sortOrder: 'desc' as const };

      // Act
      const orderByClause = repository['buildOrderByClause'](pagination);

      // Assert
      expect(orderByClause).toEqual({
        name: 'desc',
      });
    });

    it('should use default values when not specified', () => {
      // Act
      const orderByClause = repository['buildOrderByClause']({});

      // Assert
      expect(orderByClause).toEqual({
        displayOrder: 'asc',
      });
    });
  });

  describe('buildIncludeClause', () => {
    it('should build include clause with options', () => {
      // Arrange
      const includes = { includeOptions: true };

      // Act
      const includeClause = repository['buildIncludeClause'](includes);

      // Assert
      expect(includeClause).toEqual({
        attributeOptions: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      });
    });

    it('should build include clause with localizations', () => {
      // Arrange
      const includes = { includeLocalizations: true };

      // Act
      const includeClause = repository['buildIncludeClause'](includes);

      // Assert
      expect(includeClause).toEqual({
        localizations: true,
      });
    });

    it('should build include clause with both options and localizations', () => {
      // Arrange
      const includes = { includeOptions: true, includeLocalizations: true };

      // Act
      const includeClause = repository['buildIncludeClause'](includes);

      // Assert
      expect(includeClause).toEqual({
        attributeOptions: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        localizations: true,
      });
    });

    it('should return empty include clause when no includes specified', () => {
      // Act
      const includeClause = repository['buildIncludeClause']({});

      // Assert
      expect(includeClause).toEqual({});
    });
  });

  describe('Performance Tests', () => {
    it('should handle large bulk operations efficiently', async () => {
      // Arrange
      const ids = Array(100).fill(null).map((_, i) => `attr-${i}`);

      (prismaService.attribute.updateMany as jest.Mock).mockResolvedValue({ count: 100 });
      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(
        ids.map(id => TestDataFactory.createTestAttribute({ id })),
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.bulkUpdateStatus(ids, AttributeStatus.ACTIVE, 'user-123'),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 3000); // Should complete under 3 seconds
    });

    it('should handle complex search queries efficiently', async () => {
      // Arrange
      const query = 'very specific search term with multiple words';
      const mockResults = Array(50)
        .fill(null)
        .map(() => TestDataFactory.createTestAttribute());

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockResults);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => repository.searchByName(query),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 1000); // Should complete under 1 second
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent create operations', async () => {
      // Arrange
      const createData1 = {
        name: 'Attribute 1',
        slug: 'attribute-1',
        dataType: AttributeDataType.STRING,
        createdBy: 'user-1',
      };
      const createData2 = {
        name: 'Attribute 2',
        slug: 'attribute-2',
        dataType: AttributeDataType.NUMBER,
        createdBy: 'user-2',
      };

      (prismaService.attribute.create as jest.Mock)
        .mockResolvedValueOnce(TestDataFactory.createTestAttribute(createData1))
        .mockResolvedValueOnce(TestDataFactory.createTestAttribute(createData2));

      // Act
      const [result1, result2] = await Promise.all([
        repository.create(createData1),
        repository.create(createData2),
      ]);

      // Assert
      expect(result1.name).toBe('Attribute 1');
      expect(result2.name).toBe('Attribute 2');
      expect(prismaService.attribute.create).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent read operations', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2', 'attr-3'];
      const mockAttributes = ids.map(id =>
        TestDataFactory.createTestAttribute({ id })
      );

      (prismaService.attribute.findMany as jest.Mock).mockResolvedValue(mockAttributes);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = ids.map(id => repository.findById(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 1000); // Should complete under 1 second
    });
  });
});
