import { Test, TestingModule } from '@nestjs/testing';
import { BrandRepository } from '../repositories/brand.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Brand } from '../entities/brand.entity';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto } from '../dtos/update-brand.dto';

describe('BrandRepository', () => {
  let repository: BrandRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaBrand = {
    id: 'brand-1',
    name: 'Test Brand',
    slug: 'test-brand',
    description: 'Test brand description',
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://example.com',
    status: BrandStatus.ACTIVE,
    scope: BrandScope.GLOBAL,
    isVerified: true,
    sellerId: 'seller-1',
    metadata: {},
    categories: [
      { categoryId: 'cat-1', category: { id: 'cat-1', name: 'Category 1' } },
    ],
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandRepository,
        {
          provide: PrismaService,
          useValue: {
            brand: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            product: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<BrandRepository>(BrandRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated brands with filters', async () => {
      const mockResult = [mockPrismaBrand];
      prismaService.brand.findMany.mockResolvedValue(mockResult);
      prismaService.brand.count.mockResolvedValue(1);

      const filters = { status: BrandStatus.ACTIVE };
      const pagination = { page: 1, limit: 10 };

      const result = await repository.findAll(filters, pagination);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('brand-1');
      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: null,
          status: BrandStatus.ACTIVE,
        }),
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty results', async () => {
      prismaService.brand.findMany.mockResolvedValue([]);
      prismaService.brand.count.mockResolvedValue(0);

      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply search filters', async () => {
      prismaService.brand.findMany.mockResolvedValue([mockPrismaBrand]);
      prismaService.brand.count.mockResolvedValue(1);

      const filters = { search: 'test' };
      await repository.findAll(filters);

      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        }),
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply category filters', async () => {
      prismaService.brand.findMany.mockResolvedValue([mockPrismaBrand]);
      prismaService.brand.count.mockResolvedValue(1);

      const filters = { categoryIds: ['cat-1', 'cat-2'] };
      await repository.findAll(filters);

      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          categories: {
            some: {
              categoryId: {
                in: ['cat-1', 'cat-2'],
              },
            },
          },
        }),
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return brand when found', async () => {
      prismaService.brand.findFirst.mockResolvedValue(mockPrismaBrand);

      const result = await repository.findById('brand-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('brand-1');
      expect(prismaService.brand.findFirst).toHaveBeenCalledWith({
        where: { id: 'brand-1', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should return null when brand not found', async () => {
      prismaService.brand.findFirst.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return brand when found by slug', async () => {
      prismaService.brand.findFirst.mockResolvedValue(mockPrismaBrand);

      const result = await repository.findBySlug('test-brand');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('test-brand');
      expect(prismaService.brand.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-brand', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should return null when brand not found by slug', async () => {
      prismaService.brand.findFirst.mockResolvedValue(null);

      const result = await repository.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return brand when found by name', async () => {
      prismaService.brand.findFirst.mockResolvedValue(mockPrismaBrand);

      const result = await repository.findByName('Test Brand');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Brand');
      expect(prismaService.brand.findFirst).toHaveBeenCalledWith({
        where: { name: 'Test Brand', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should return null when brand not found by name', async () => {
      prismaService.brand.findFirst.mockResolvedValue(null);

      const result = await repository.findByName('Non Existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create brand successfully', async () => {
      const createBrandDto: CreateBrandDto & { createdBy: string; status: BrandStatus } = {
        name: 'New Brand',
        slug: 'new-brand',
        description: 'New brand description',
        scope: BrandScope.GLOBAL,
        categoryIds: ['cat-1'],
        createdBy: 'admin-1',
        status: BrandStatus.DRAFT,
      };

      const createdBrand = { ...mockPrismaBrand, ...createBrandDto };
      prismaService.brand.create.mockResolvedValue(createdBrand);

      const result = await repository.create(createBrandDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Brand');
      expect(prismaService.brand.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Brand',
          slug: 'new-brand',
          status: BrandStatus.DRAFT,
          createdBy: 'admin-1',
        }),
        include: expect.any(Object),
      });
    });

    it('should handle category assignments during creation', async () => {
      const createBrandDto: CreateBrandDto & { createdBy: string; status: BrandStatus } = {
        name: 'New Brand',
        slug: 'new-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: ['cat-1', 'cat-2'],
        createdBy: 'admin-1',
        status: BrandStatus.DRAFT,
      };

      prismaService.brand.create.mockResolvedValue(mockPrismaBrand);

      await repository.create(createBrandDto);

      expect(prismaService.brand.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categories: {
            create: [
              { categoryId: 'cat-1' },
              { categoryId: 'cat-2' },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update brand successfully', async () => {
      const updateBrandDto: UpdateBrandDto & { updatedBy: string } = {
        name: 'Updated Brand',
        description: 'Updated description',
        updatedBy: 'admin-1',
      };

      const updatedBrand = { ...mockPrismaBrand, ...updateBrandDto };
      prismaService.brand.update.mockResolvedValue(updatedBrand);

      const result = await repository.update('brand-1', updateBrandDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Brand');
      expect(prismaService.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        data: expect.objectContaining({
          name: 'Updated Brand',
          description: 'Updated description',
          updatedBy: 'admin-1',
        }),
        include: expect.any(Object),
      });
    });

    it('should handle category updates', async () => {
      const updateBrandDto: UpdateBrandDto & { updatedBy: string } = {
        categoryIds: ['cat-3', 'cat-4'],
        updatedBy: 'admin-1',
      };

      prismaService.brand.update.mockResolvedValue(mockPrismaBrand);

      await repository.update('brand-1', updateBrandDto);

      expect(prismaService.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        data: expect.objectContaining({
          categories: {
            deleteMany: {},
            create: [
              { categoryId: 'cat-3' },
              { categoryId: 'cat-4' },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update brand status successfully', async () => {
      const updatedBrand = { ...mockPrismaBrand, status: BrandStatus.ACTIVE };
      prismaService.brand.update.mockResolvedValue(updatedBrand);

      const result = await repository.updateStatus('brand-1', BrandStatus.ACTIVE, 'admin-1');

      expect(result).toBeDefined();
      expect(result.status).toBe(BrandStatus.ACTIVE);
      expect(prismaService.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        data: {
          status: BrandStatus.ACTIVE,
          updatedBy: 'admin-1',
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete brand successfully', async () => {
      prismaService.brand.update.mockResolvedValue({
        ...mockPrismaBrand,
        deletedAt: new Date(),
        deletedBy: 'admin-1',
      });

      await repository.softDelete('brand-1', 'admin-1');

      expect(prismaService.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-1' },
        data: {
          deletedAt: expect.any(Date),
          deletedBy: 'admin-1',
        },
      });
    });
  });

  describe('countByStatus', () => {
    it('should return status counts', async () => {
      const mockCounts = [
        { status: BrandStatus.ACTIVE, _count: 5 },
        { status: BrandStatus.DRAFT, _count: 3 },
      ];
      prismaService.brand.groupBy.mockResolvedValue(mockCounts as any);

      const result = await repository.countByStatus();

      expect(result[BrandStatus.ACTIVE]).toBe(5);
      expect(result[BrandStatus.DRAFT]).toBe(3);
      expect(result[BrandStatus.INACTIVE]).toBe(0);
    });

    it('should filter by seller when provided', async () => {
      prismaService.brand.groupBy.mockResolvedValue([]);

      await repository.countByStatus('seller-1');

      expect(prismaService.brand.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          deletedAt: null,
          OR: [{ isGlobal: true }, { sellerId: 'seller-1' }],
        },
        _count: true,
      });
    });
  });

  describe('isBrandInUse', () => {
    it('should return true when brand is used in products', async () => {
      prismaService.product.count.mockResolvedValue(5);

      const result = await repository.isBrandInUse('brand-1');

      expect(result).toBe(true);
      expect(prismaService.product.count).toHaveBeenCalledWith({
        where: { brandId: 'brand-1' },
      });
    });

    it('should return false when brand is not used in products', async () => {
      prismaService.product.count.mockResolvedValue(0);

      const result = await repository.isBrandInUse('brand-1');

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive brand statistics', async () => {
      prismaService.brand.count.mockResolvedValue(100);
      prismaService.brand.groupBy
        .mockResolvedValueOnce([
          { status: BrandStatus.ACTIVE, _count: 80 },
          { status: BrandStatus.INACTIVE, _count: 15 },
          { status: BrandStatus.PENDING_APPROVAL, _count: 5 },
        ] as any)
        .mockResolvedValueOnce([
          { scope: BrandScope.GLOBAL, _count: 30 },
          { scope: BrandScope.SELLER_PRIVATE, _count: 50 },
          { scope: BrandScope.SELLER_SHARED, _count: 20 },
        ] as any);

      const result = await repository.getStatistics();

      expect(result.total).toBe(100);
      expect(result.active).toBe(80);
      expect(result.inactive).toBe(15);
      expect(result.pending).toBe(5);
      expect(result.byScope[BrandScope.GLOBAL]).toBe(30);
      expect(result.byScope[BrandScope.SELLER_PRIVATE]).toBe(50);
      expect(result.byScope[BrandScope.SELLER_SHARED]).toBe(20);
    });
  });

  describe('findBySellerId', () => {
    it('should return brands for specific seller', async () => {
      prismaService.brand.findMany.mockResolvedValue([mockPrismaBrand]);

      const result = await repository.findBySellerId('seller-1');

      expect(result).toHaveLength(1);
      expect(result[0].sellerId).toBe('seller-1');
      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        where: { sellerId: 'seller-1', deletedAt: null },
        include: expect.any(Object),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      prismaService.brand.findMany.mockRejectedValue(dbError);

      await expect(repository.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violations during creation', async () => {
      const constraintError = new Error('Unique constraint violation');
      prismaService.brand.create.mockRejectedValue(constraintError);

      const createBrandDto: CreateBrandDto & { createdBy: string; status: BrandStatus } = {
        name: 'Duplicate Brand',
        slug: 'duplicate-brand',
        scope: BrandScope.GLOBAL,
        categoryIds: [],
        createdBy: 'admin-1',
        status: BrandStatus.DRAFT,
      };

      await expect(repository.create(createBrandDto)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Performance Tests', () => {
    it('should complete queries within acceptable time', async () => {
      prismaService.brand.findMany.mockResolvedValue([mockPrismaBrand]);
      prismaService.brand.count.mockResolvedValue(1);

      const startTime = Date.now();
      await repository.findAll();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});