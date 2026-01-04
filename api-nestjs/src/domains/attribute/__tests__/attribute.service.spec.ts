import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AttributeService } from '../attribute.service';
import { AttributeRepository } from '../repositories/attribute.repository';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { AttributeDataType } from '../enums/attribute-data-type.enum';

import {
  TestModuleBuilder,
  TestDataFactory,
  TestAssertions,
  TestErrorHelper,
  TestPerformanceHelper,
  TestSecurityHelper,
  MockServicesFactory,
} from '../../../test/utils/test-helpers';

describe('AttributeService', () => {
  let service: AttributeService;
  let attributeRepository: jest.Mocked<AttributeRepository>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await TestModuleBuilder.createAttributeTestingModule([
      AttributeService,
      {
        provide: AttributeRepository,
        useValue: MockServicesFactory.createMockAttributeRepository(),
      },
    ]);

    service = module.get<AttributeService>(AttributeService);
    attributeRepository = module.get(AttributeRepository);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated attributes successfully', async () => {
      // Arrange
      const filters = { status: AttributeStatus.ACTIVE };
      const pagination = { page: 1, limit: 10 };
      const includes = { includeOptions: true };
      const mockResponse = {
        data: [TestDataFactory.createTestAttribute()],
        total: 1,
      };

      attributeRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await service.findAll(filters, pagination, includes);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(attributeRepository.findAll).toHaveBeenCalledWith(
        filters,
        pagination,
        includes,
      );
      expect(logger.log).toHaveBeenCalledWith('AttributeService.findAll', {
        filters,
        pagination,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockResponse = { data: [], total: 0 };
      attributeRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      attributeRepository.findAll.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow();
    });

    it('should complete query within acceptable time', async () => {
      // Arrange
      const mockResponse = {
        data: [TestDataFactory.createTestAttribute()],
        total: 1,
      };
      attributeRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.findAll(),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 500); // Should complete under 500ms
    });
  });

  describe('findById', () => {
    it('should return attribute when found', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const includes = { includeOptions: true };

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.findById(attributeId, includes);

      // Assert
      expect(result).toEqual(mockAttribute);
      expect(attributeRepository.findById).toHaveBeenCalledWith(attributeId, includes);
    });

    it('should throw NotFoundException when attribute not found', async () => {
      // Arrange
      const attributeId = 'nonexistent';
      attributeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(attributeId)).rejects.toThrow(NotFoundException);
      expect(attributeRepository.findById).toHaveBeenCalledWith(attributeId, {});
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = TestErrorHelper.createDatabaseConnectionError();
      attributeRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findById('attr-123')).rejects.toThrow();
    });
  });

  describe('findBySlug', () => {
    it('should return attribute when found by slug', async () => {
      // Arrange
      const slug = 'test-attribute';
      const mockAttribute = TestDataFactory.createTestAttribute({ slug });
      const includes = { includeLocalizations: true };

      attributeRepository.findBySlug.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.findBySlug(slug, includes);

      // Assert
      expect(result).toEqual(mockAttribute);
      expect(attributeRepository.findBySlug).toHaveBeenCalledWith(slug, includes);
    });

    it('should throw NotFoundException when attribute not found by slug', async () => {
      // Arrange
      const slug = 'nonexistent-slug';
      attributeRepository.findBySlug.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findBySlug(slug)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIds', () => {
    it('should return multiple attributes', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2' }),
      ];

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);

      // Act
      const result = await service.findByIds(ids);

      // Assert
      expect(result).toEqual(mockAttributes);
      expect(attributeRepository.findByIds).toHaveBeenCalledWith(ids, {});
    });

    it('should return empty array for empty input', async () => {
      // Arrange
      attributeRepository.findByIds.mockResolvedValue([]);

      // Act
      const result = await service.findByIds([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create attribute successfully with auto-generated slug', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();
      const createdBy = 'user-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        ...createDto,
        createdBy,
        status: AttributeStatus.DRAFT,
      });

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.create.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.create(createDto, createdBy);

      // Assert
      expect(result).toEqual(mockAttribute);
      expect(attributeRepository.validateSlug).toHaveBeenCalledWith('new-attribute');
      expect(attributeRepository.validateName).toHaveBeenCalledWith(createDto.name);
      expect(attributeRepository.create).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('AttributeService.create', {
        createAttributeDto: createDto,
        createdBy,
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Attribute created successfully',
        expect.objectContaining({ attributeId: mockAttribute.id }),
      );
    });

    it('should create attribute with provided slug', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto({
        slug: 'custom-slug',
      });
      const createdBy = 'user-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        ...createDto,
        createdBy,
      });

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.create.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.create(createDto, createdBy);

      // Assert
      expect(attributeRepository.validateSlug).toHaveBeenCalledWith('custom-slug');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();
      const createdBy = 'user-123';

      attributeRepository.validateSlug.mockResolvedValue(false); // Slug exists

      // Act & Assert
      await expect(service.create(createDto, createdBy)).rejects.toThrow(ConflictException);
      expect(attributeRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate name', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();
      const createdBy = 'user-123';

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(false); // Name exists

      // Act & Assert
      await expect(service.create(createDto, createdBy)).rejects.toThrow(ConflictException);
      expect(attributeRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();
      const createdBy = 'user-123';
      const dbError = TestErrorHelper.createDatabaseConnectionError();

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.create(createDto, createdBy)).rejects.toThrow();
    });

    it('should sanitize malicious input', async () => {
      // Arrange
      const maliciousDto = {
        ...TestDataFactory.createValidCreateAttributeDto(),
        name: '<script>alert("xss")</script>',
      };
      const createdBy = 'user-123';

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.create.mockResolvedValue(TestDataFactory.createTestAttribute());

      // Act
      await service.create(maliciousDto, createdBy);

      // Assert
      const createCall = attributeRepository.create.mock.calls[0][0];
      TestSecurityHelper.expectSanitizedOutput(createCall.name);
    });
  });

  describe('update', () => {
    it('should update attribute successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateDto = TestDataFactory.createValidUpdateAttributeDto();
      const updatedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const updatedAttribute = { ...existingAttribute, ...updateDto, updatedBy };

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.update.mockResolvedValue(updatedAttribute);

      // Act
      const result = await service.update(attributeId, updateDto, updatedBy);

      // Assert
      expect(result).toEqual(updatedAttribute);
      expect(attributeRepository.findById).toHaveBeenCalledWith(attributeId, {});
      expect(logger.log).toHaveBeenCalledWith('AttributeService.update', {
        id: attributeId,
        updateAttributeDto: updateDto,
        updatedBy,
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Attribute updated successfully',
        { attributeId },
      );
    });

    it('should validate slug uniqueness when changed', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateDto = { slug: 'new-slug' };
      const updatedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        slug: 'old-slug',
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.update.mockResolvedValue({ ...existingAttribute, ...updateDto });

      // Act
      await service.update(attributeId, updateDto, updatedBy);

      // Assert
      expect(attributeRepository.validateSlug).toHaveBeenCalledWith('new-slug', attributeId);
    });

    it('should skip slug validation when unchanged', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateDto = { name: 'Updated Name' };
      const updatedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        slug: 'test-attribute',
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.update.mockResolvedValue({ ...existingAttribute, ...updateDto });

      // Act
      await service.update(attributeId, updateDto, updatedBy);

      // Assert
      expect(attributeRepository.validateSlug).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate slug on update', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const updateDto = { slug: 'existing-slug' };
      const updatedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        slug: 'old-slug',
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.validateSlug.mockResolvedValue(false);

      // Act & Assert
      await expect(service.update(attributeId, updateDto, updatedBy)).rejects.toThrow(ConflictException);
      expect(attributeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const newStatus = AttributeStatus.DEPRECATED;
      const updatedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.ACTIVE,
      });
      const updatedAttribute = { ...existingAttribute, status: newStatus };

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.updateStatus.mockResolvedValue(updatedAttribute);

      // Act
      const result = await service.updateStatus(attributeId, newStatus, updatedBy);

      // Assert
      expect(result).toEqual(updatedAttribute);
      expect(attributeRepository.updateStatus).toHaveBeenCalledWith(attributeId, newStatus, updatedBy);
      expect(logger.log).toHaveBeenCalledWith('AttributeService.updateStatus', {
        id: attributeId,
        status: newStatus,
        updatedBy,
      });
    });

    it('should validate status transitions', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.DRAFT,
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);

      // Act & Assert
      await expect(
        service.updateStatus(attributeId, AttributeStatus.ARCHIVED, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid status transitions', async () => {
      // Arrange - DRAFT to ACTIVE
      const attributeId = 'attr-123';
      const existingAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.DRAFT,
      });
      const updatedAttribute = { ...existingAttribute, status: AttributeStatus.ACTIVE };

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.updateStatus.mockResolvedValue(updatedAttribute);

      // Act
      const result = await service.updateStatus(attributeId, AttributeStatus.ACTIVE, 'user-123');

      // Assert
      expect(result.status).toBe(AttributeStatus.ACTIVE);
    });
  });

  describe('delete', () => {
    it('should delete attribute successfully when not in use', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const deletedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const usageStats = TestDataFactory.createTestAttributeUsageStats({
        attributeId,
        totalUsage: 0,
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.getUsageStats.mockResolvedValue(usageStats);

      // Act
      await service.delete(attributeId, deletedBy);

      // Assert
      expect(attributeRepository.softDelete).toHaveBeenCalledWith(attributeId, deletedBy, undefined);
      expect(logger.log).toHaveBeenCalledWith('AttributeService.delete', {
        id: attributeId,
        deletedBy,
      });
    });

    it('should throw BadRequestException when attribute is in use', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const deletedBy = 'user-456';
      const existingAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const usageStats = TestDataFactory.createTestAttributeUsageStats({
        attributeId,
        totalUsage: 5, // In use
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.getUsageStats.mockResolvedValue(usageStats);

      // Act & Assert
      await expect(service.delete(attributeId, deletedBy)).rejects.toThrow(BadRequestException);
      expect(attributeRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should handle delete with reason', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const deletedBy = 'user-456';
      const reason = 'Cleanup old attribute';
      const existingAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const usageStats = TestDataFactory.createTestAttributeUsageStats({
        attributeId,
        totalUsage: 0,
      });

      attributeRepository.findById.mockResolvedValue(existingAttribute);
      attributeRepository.getUsageStats.mockResolvedValue(usageStats);

      // Act
      await service.delete(attributeId, deletedBy, reason);

      // Assert
      expect(attributeRepository.softDelete).toHaveBeenCalledWith(attributeId, deletedBy, reason);
    });
  });

  describe('searchByName', () => {
    it('should search attributes by name', async () => {
      // Arrange
      const query = 'color';
      const filters = { status: AttributeStatus.ACTIVE };
      const mockResults = [TestDataFactory.createTestAttribute({ name: 'Color' })];

      attributeRepository.searchByName.mockResolvedValue(mockResults);

      // Act
      const result = await service.searchByName(query, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.searchByName).toHaveBeenCalledWith(query, filters);
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      attributeRepository.searchByName.mockResolvedValue([]);

      // Act
      const result = await service.searchByName('nonexistent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByGroup', () => {
    it('should find attributes by group', async () => {
      // Arrange
      const groupName = 'General';
      const filters = { isFilterable: true };
      const mockResults = [
        TestDataFactory.createTestAttribute({ groupName }),
      ];

      attributeRepository.findByGroup.mockResolvedValue(mockResults);

      // Act
      const result = await service.findByGroup(groupName, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.findByGroup).toHaveBeenCalledWith(groupName, filters);
    });
  });

  describe('findByDataType', () => {
    it('should find attributes by data type', async () => {
      // Arrange
      const dataType = AttributeDataType.ENUM;
      const filters = { isVariant: true };
      const mockResults = [
        TestDataFactory.createTestAttribute({ dataType }),
      ];

      attributeRepository.findByDataType.mockResolvedValue(mockResults);

      // Act
      const result = await service.findByDataType(dataType, filters);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.findByDataType).toHaveBeenCalledWith(dataType, filters);
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

      attributeRepository.findByCategoryId.mockResolvedValue(mockResults);

      // Act
      const result = await service.findByCategoryId(categoryId, includeInherited);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.findByCategoryId).toHaveBeenCalledWith(categoryId, includeInherited);
    });

    it('should default to includeInherited=true', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const mockResults = [TestDataFactory.createTestAttribute()];

      attributeRepository.findByCategoryId.mockResolvedValue(mockResults);

      // Act
      await service.findByCategoryId(categoryId);

      // Assert
      expect(attributeRepository.findByCategoryId).toHaveBeenCalledWith(categoryId, true);
    });
  });

  describe('findVariantAttributesForCategory', () => {
    it('should find variant attributes for category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const mockResults = [
        TestDataFactory.createTestAttribute({ isVariant: true }),
      ];

      attributeRepository.findVariantAttributesForCategory.mockResolvedValue(mockResults);

      // Act
      const result = await service.findVariantAttributesForCategory(categoryId);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.findVariantAttributesForCategory).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('findFilterableAttributesForCategory', () => {
    it('should find filterable attributes for category', async () => {
      // Arrange
      const categoryId = 'cat-123';
      const mockResults = [
        TestDataFactory.createTestAttribute({ isFilterable: true }),
      ];

      attributeRepository.findFilterableAttributesForCategory.mockResolvedValue(mockResults);

      // Act
      const result = await service.findFilterableAttributesForCategory(categoryId);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.findFilterableAttributesForCategory).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('validateAttributeValue', () => {
    it('should validate attribute value successfully', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const value = 'valid-value';
      const mockAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const validationResult = { isValid: true, errors: [] };

      // Mock the validateValue method on the entity
      mockAttribute.validateValue = jest.fn().mockReturnValue(validationResult);

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.validateAttributeValue(attributeId, value);

      // Assert
      expect(result).toEqual(validationResult);
      expect(mockAttribute.validateValue).toHaveBeenCalledWith(value);
    });

    it('should return validation errors for invalid value', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const value = 'invalid-value';
      const mockAttribute = TestDataFactory.createTestAttribute({ id: attributeId });
      const validationResult = {
        isValid: false,
        errors: ['Value must be a valid option'],
      };

      mockAttribute.validateValue = jest.fn().mockReturnValue(validationResult);

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.validateAttributeValue(attributeId, value);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be a valid option');
    });
  });

  describe('getStatistics', () => {
    it('should return attribute statistics', async () => {
      // Arrange
      const mockStats = TestDataFactory.createTestAttributeStatistics();

      attributeRepository.getStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await service.getStatistics();

      // Assert
      TestAssertions.expectValidAttributeStatistics(result);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for attribute', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockStats = TestDataFactory.createTestAttributeUsageStats({ attributeId });

      attributeRepository.getUsageStats.mockResolvedValue(mockStats);

      // Act
      const result = await service.getUsageStats(attributeId);

      // Assert
      TestAssertions.expectValidAttributeUsageStats(result);
      expect(result.attributeId).toBe(attributeId);
    });
  });

  describe('getPopularAttributes', () => {
    it('should return popular attributes', async () => {
      // Arrange
      const limit = 10;
      const mockResults = Array(limit)
        .fill(null)
        .map(() => TestDataFactory.createTestAttribute());

      attributeRepository.getPopularAttributes.mockResolvedValue(mockResults);

      // Act
      const result = await service.getPopularAttributes(limit);

      // Assert
      expect(result).toHaveLength(limit);
      expect(attributeRepository.getPopularAttributes).toHaveBeenCalledWith(limit);
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      const mockResults = [TestDataFactory.createTestAttribute()];

      attributeRepository.getPopularAttributes.mockResolvedValue(mockResults);

      // Act
      await service.getPopularAttributes();

      // Assert
      expect(attributeRepository.getPopularAttributes).toHaveBeenCalledWith(10);
    });
  });

  describe('getUnusedAttributes', () => {
    it('should return unused attributes', async () => {
      // Arrange
      const olderThanDays = 90;
      const mockResults = [
        TestDataFactory.createTestAttribute({ updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }),
      ];

      attributeRepository.getUnusedAttributes.mockResolvedValue(mockResults);

      // Act
      const result = await service.getUnusedAttributes(olderThanDays);

      // Assert
      expect(result).toEqual(mockResults);
      expect(attributeRepository.getUnusedAttributes).toHaveBeenCalledWith(olderThanDays);
    });

    it('should use default days when not specified', async () => {
      // Arrange
      const mockResults = [TestDataFactory.createTestAttribute()];

      attributeRepository.getUnusedAttributes.mockResolvedValue(mockResults);

      // Act
      await service.getUnusedAttributes();

      // Assert
      expect(attributeRepository.getUnusedAttributes).toHaveBeenCalledWith(90);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update status successfully', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const status = AttributeStatus.DEPRECATED;
      const updatedBy = 'user-123';
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1', status: AttributeStatus.ACTIVE }),
        TestDataFactory.createTestAttribute({ id: 'attr-2', status: AttributeStatus.ACTIVE }),
      ];
      const updatedAttributes = mockAttributes.map(attr => ({ ...attr, status }));

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);
      attributeRepository.bulkUpdateStatus.mockResolvedValue(updatedAttributes);

      // Act
      const result = await service.bulkUpdateStatus(ids, status, updatedBy);

      // Assert
      expect(result).toEqual(updatedAttributes);
      expect(attributeRepository.findByIds).toHaveBeenCalledWith(ids);
      expect(attributeRepository.bulkUpdateStatus).toHaveBeenCalledWith(ids, status, updatedBy);
      expect(logger.log).toHaveBeenCalledWith('AttributeService.bulkUpdateStatus', {
        ids,
        status,
        updatedBy,
      });
      expect(logger.log).toHaveBeenCalledWith('Bulk status update completed', {
        count: updatedAttributes.length,
      });
    });

    it('should throw BadRequestException when some attributes not found', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2', 'attr-3'];
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2' }),
        // attr-3 not found
      ];

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);

      // Act & Assert
      await expect(service.bulkUpdateStatus(ids, AttributeStatus.ACTIVE, 'user-123')).rejects.toThrow(BadRequestException);
      expect(attributeRepository.bulkUpdateStatus).not.toHaveBeenCalled();
    });

    it('should validate status transitions for all attributes', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1', status: AttributeStatus.DRAFT }),
        TestDataFactory.createTestAttribute({ id: 'attr-2', status: AttributeStatus.DRAFT }),
      ];

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);

      // Act & Assert - DRAFT to ARCHIVED should fail
      await expect(service.bulkUpdateStatus(ids, AttributeStatus.ARCHIVED, 'user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkDelete', () => {
    it('should bulk delete attributes successfully', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const deletedBy = 'user-123';
      const reason = 'Bulk cleanup';
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2' }),
      ];
      const usageStats = TestDataFactory.createTestAttributeUsageStats({ totalUsage: 0 });

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);
      attributeRepository.getUsageStats.mockResolvedValue(usageStats);

      // Act
      await service.bulkDelete(ids, deletedBy, reason);

      // Assert
      expect(attributeRepository.bulkDelete).toHaveBeenCalledWith(ids, deletedBy, reason);
      expect(logger.log).toHaveBeenCalledWith('AttributeService.bulkDelete', {
        ids,
        deletedBy,
      });
      expect(logger.log).toHaveBeenCalledWith('Bulk delete completed', { count: ids.length });
    });

    it('should throw BadRequestException when any attribute is in use', async () => {
      // Arrange
      const ids = ['attr-1', 'attr-2'];
      const mockAttributes = [
        TestDataFactory.createTestAttribute({ id: 'attr-1' }),
        TestDataFactory.createTestAttribute({ id: 'attr-2' }),
      ];
      const usageStatsInUse = TestDataFactory.createTestAttributeUsageStats({ totalUsage: 5 });

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);
      attributeRepository.getUsageStats.mockResolvedValue(usageStatsInUse);

      // Act & Assert
      await expect(service.bulkDelete(ids, 'user-123')).rejects.toThrow(BadRequestException);
      expect(attributeRepository.bulkDelete).not.toHaveBeenCalled();
    });
  });

  describe('refreshUsageStats', () => {
    it('should refresh usage stats for specific attribute', async () => {
      // Arrange
      const attributeId = 'attr-123';

      // Act
      await service.refreshUsageStats(attributeId);

      // Assert
      expect(attributeRepository.refreshUsageStats).toHaveBeenCalledWith(attributeId);
    });

    it('should refresh usage stats for all attributes', async () => {
      // Act
      await service.refreshUsageStats();

      // Assert
      expect(attributeRepository.refreshUsageStats).toHaveBeenCalledWith(undefined);
    });
  });

  describe('cleanupDeletedAttributes', () => {
    it('should cleanup deleted attributes', async () => {
      // Arrange
      const olderThanDays = 365;
      const deletedCount = 5;

      attributeRepository.cleanupDeletedAttributes.mockResolvedValue(deletedCount);

      // Act
      const result = await service.cleanupDeletedAttributes(olderThanDays);

      // Assert
      expect(result).toBe(deletedCount);
      expect(attributeRepository.cleanupDeletedAttributes).toHaveBeenCalledWith(olderThanDays);
      expect(logger.log).toHaveBeenCalledWith('Cleanup completed', { deletedCount });
    });

    it('should use default days when not specified', async () => {
      // Arrange
      attributeRepository.cleanupDeletedAttributes.mockResolvedValue(0);

      // Act
      await service.cleanupDeletedAttributes();

      // Assert
      expect(attributeRepository.cleanupDeletedAttributes).toHaveBeenCalledWith(365);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from name', () => {
      // Act
      const result = (service as any).generateSlug('Test Attribute Name');

      // Assert
      expect(result).toBe('test-attribute-name');
    });

    it('should handle special characters', () => {
      // Act
      const result = (service as any).generateSlug('Color & Size!');

      // Assert
      expect(result).toBe('color-size');
    });

    it('should handle multiple spaces and hyphens', () => {
      // Act
      const result = (service as any).generateSlug('  Test--Attribute   ');

      // Assert
      expect(result).toBe('test-attribute');
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid DRAFT to ACTIVE transition', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.DRAFT,
      });

      attributeRepository.findById.mockResolvedValue(mockAttribute);
      attributeRepository.updateStatus.mockResolvedValue({
        ...mockAttribute,
        status: AttributeStatus.ACTIVE,
      });

      // Act & Assert - Should not throw
      await expect(
        service.updateStatus(attributeId, AttributeStatus.ACTIVE, 'user-123'),
      ).resolves.not.toThrow();
    });

    it('should allow valid ACTIVE to DEPRECATED transition', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.ACTIVE,
      });

      attributeRepository.findById.mockResolvedValue(mockAttribute);
      attributeRepository.updateStatus.mockResolvedValue({
        ...mockAttribute,
        status: AttributeStatus.DEPRECATED,
      });

      // Act & Assert - Should not throw
      await expect(
        service.updateStatus(attributeId, AttributeStatus.DEPRECATED, 'user-123'),
      ).resolves.not.toThrow();
    });

    it('should reject invalid DRAFT to ARCHIVED transition', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.DRAFT,
      });

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act & Assert
      await expect(
        service.updateStatus(attributeId, AttributeStatus.ARCHIVED, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition with descriptive error', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const mockAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        status: AttributeStatus.DEPRECATED,
      });

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act & Assert
      await expect(
        service.updateStatus(attributeId, AttributeStatus.DRAFT, 'user-123'),
      ).rejects.toThrow('Invalid status transition from DEPRECATED to DRAFT');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values in create', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();
      createDto.description = undefined;
      createDto.groupName = null as any;

      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);
      attributeRepository.create.mockResolvedValue(TestDataFactory.createTestAttribute());

      // Act & Assert - Should not throw
      await expect(service.create(createDto, 'user-123')).resolves.not.toThrow();
    });

    it('should handle concurrent create operations with same slug', async () => {
      // Arrange
      const createDto = TestDataFactory.createValidCreateAttributeDto();

      // First call succeeds validation
      attributeRepository.validateSlug.mockResolvedValueOnce(true);
      attributeRepository.validateName.mockResolvedValueOnce(true);
      // But create fails due to concurrent insert
      attributeRepository.create.mockRejectedValueOnce(
        TestErrorHelper.createDuplicateSlugError(),
      );

      // Act & Assert
      await expect(service.create(createDto, 'user-123')).rejects.toThrow();
    });

    it('should handle large datasets in findAll', async () => {
      // Arrange
      const largeDataset = Array(1000)
        .fill(null)
        .map((_, i) => TestDataFactory.createTestAttribute({ id: `attr-${i}` }));

      attributeRepository.findAll.mockResolvedValue({
        data: largeDataset,
        total: 1000,
      });

      // Act
      const result = await service.findAll({}, { page: 1, limit: 1000 });

      // Assert
      expect(result.data).toHaveLength(1000);
      expect(result.total).toBe(1000);
    });

    it('should handle special characters in search', async () => {
      // Arrange
      const searchQuery = 'café & müller';
      const mockResults = [TestDataFactory.createTestAttribute()];

      attributeRepository.searchByName.mockResolvedValue(mockResults);

      // Act
      const result = await service.searchByName(searchQuery);

      // Assert
      expect(result).toEqual(mockResults);
    });

    it('should handle empty strings in validation', async () => {
      // Arrange
      const attributeId = 'attr-123';
      const value = '';
      const mockAttribute = TestDataFactory.createTestAttribute({
        id: attributeId,
        isRequired: false,
      });
      const validationResult = { isValid: true, errors: [] };

      mockAttribute.validateValue = jest.fn().mockReturnValue(validationResult);

      attributeRepository.findById.mockResolvedValue(mockAttribute);

      // Act
      const result = await service.validateAttributeValue(attributeId, value);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should handle malformed input gracefully', async () => {
      // Arrange - Invalid data type in create
      const invalidDto = {
        ...TestDataFactory.createValidCreateAttributeDto(),
        dataType: 'INVALID_TYPE',
      };

      // Act & Assert - Should be caught by validation pipes in real scenario
      // Here we just ensure the service doesn't crash
      attributeRepository.validateSlug.mockResolvedValue(true);
      attributeRepository.validateName.mockResolvedValue(true);

      await expect(service.create(invalidDto as any, 'user-123')).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent findById calls efficiently', async () => {
      // Arrange
      const attributeIds = ['attr-1', 'attr-2', 'attr-3', 'attr-4', 'attr-5'];
      const mockAttributes = attributeIds.map(id =>
        TestDataFactory.createTestAttribute({ id })
      );

      attributeRepository.findById.mockImplementation((id) =>
        Promise.resolve(mockAttributes.find(attr => attr.id === id) || null)
      );

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        async () => {
          const promises = attributeIds.map(id => service.findById(id));
          return Promise.all(promises);
        },
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 1000); // Should complete under 1 second
    });

    it('should handle bulk operations efficiently', async () => {
      // Arrange
      const ids = Array(50).fill(null).map((_, i) => `attr-${i}`);
      const mockAttributes = ids.map(id =>
        TestDataFactory.createTestAttribute({ id })
      );

      attributeRepository.findByIds.mockResolvedValue(mockAttributes);
      attributeRepository.bulkUpdateStatus.mockResolvedValue(mockAttributes);

      // Act
      const { duration } = await TestPerformanceHelper.measureExecutionTime(
        () => service.bulkUpdateStatus(ids, AttributeStatus.ACTIVE, 'user-123'),
      );

      // Assert
      TestPerformanceHelper.expectExecutionTimeUnder(duration, 2000); // Should complete under 2 seconds
    });
  });
});
