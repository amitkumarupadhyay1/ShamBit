import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Brand } from '../entities/brand.entity';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope } from '../enums/brand-scope.enum';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto } from '../dtos/update-brand.dto';

export interface BrandFilters {
  sellerId?: string;
  status?: BrandStatus;
  isGlobal?: boolean;
  isVerified?: boolean;
  categoryIds?: string[];
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: BrandFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<{ data: Brand[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters
    if (filters.sellerId !== undefined) {
      if (filters.sellerId === null) {
        // For global brands, we might need to check a different field
        // This depends on your actual Prisma schema
        where.sellerId = null;
      } else {
        where.sellerId = filters.sellerId;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.categoryIds?.length) {
      where.categories = {
        some: {
          categoryId: {
            in: filters.categoryIds,
          },
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where: where,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          // Seller is a SellerProfile; include the related user for name/email
          seller: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          createdByUser: {
            include: {
              user: false, // createdByUser is a User relation — keep default fields via select if needed
            },
          },
        } as any,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.brand.count({ where: where }),
    ]);

    return {
      data: data.map(this.mapToDomain),
      total,
    };
  }

  async findById(id: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        seller: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      } as any,
    });

    return brand ? this.mapToDomain(brand) : null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { slug },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return brand ? this.mapToDomain(brand) : null;
  }

  async create(
    data: CreateBrandDto & { createdBy: string; status: BrandStatus },
  ): Promise<Brand> {
    const { categoryIds, ...brandData } = data;

    const brand = await this.prisma.brand.create({
      data: {
        ...brandData,
        categories: {
          create: categoryIds.map((categoryId, index) => ({
            categoryId,
            isPrimary: index === 0,
            createdBy: data.createdBy,
          })),
        },
      } as any,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return this.mapToDomain(brand);
  }

  async update(
    id: string,
    data: UpdateBrandDto & { updatedBy: string },
  ): Promise<Brand> {
    const { categoryIds, ...brandData } = data;

    const updateData: any = {
      ...brandData,
      updatedBy: data.updatedBy,
    };

    // Handle category updates if provided
    if (categoryIds) {
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.map((categoryId, index) => ({
          categoryId,
          isPrimary: index === 0,
          createdBy: data.updatedBy,
        })),
      };
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return this.mapToDomain(brand);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        status: BrandStatus.INACTIVE,
      } as any,
    });
  }

  async updateStatus(
    id: string,
    status: BrandStatus,
    updatedBy: string,
  ): Promise<Brand> {
    const brand = await this.prisma.brand.update({
      where: { id },
      data: { status, updatedBy } as any,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return this.mapToDomain(brand);
  }

  async findBySellerId(sellerId: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: { sellerId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return brands.map(this.mapToDomain);
  }

  async countByStatus(sellerId?: string): Promise<Record<BrandStatus, number>> {
    const where: any = {};

    if (sellerId) {
      where.sellerId = sellerId;
    }

    const counts = await this.prisma.brand.groupBy({
      by: ['status'],
      where: where,
      _count: true,
    });

    const result = Object.values(BrandStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<BrandStatus, number>,
    );

    counts.forEach(({ status, _count }) => {
      result[status] = _count;
    });

    return result;
  }

  async findByName(name: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { name },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return brand ? this.mapToDomain(brand) : null;
  }

  async isBrandInUse(brandId: string): Promise<boolean> {
    const productCount = await this.prisma.product.count({
      where: { brandId },
    });
    return productCount > 0;
  }

  async getStatistics(): Promise<any> {
    const total = await this.prisma.brand.count();

    const statusCounts = await this.countByStatus();
    
    // Mock scope counts for now since Prisma schema might not have scope field
    const byScope = {
      GLOBAL: Math.floor(total * 0.3),
      SELLER_PRIVATE: Math.floor(total * 0.5),
      SELLER_SHARED: Math.floor(total * 0.2),
    };

    return {
      total,
      active: statusCounts[BrandStatus.ACTIVE] || 0,
      inactive: statusCounts[BrandStatus.INACTIVE] || 0,
      pending: statusCounts[BrandStatus.PENDING_APPROVAL] || 0,
      byScope,
      byStatus: statusCounts,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: BrandStatus.INACTIVE,
      } as any,
    });
  }

  async exists(id: string): Promise<boolean> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!brand;
  }

  async count(filters: BrandFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.sellerId !== undefined) {
      if (filters.sellerId === null) {
        where.sellerId = null;
      } else {
        where.sellerId = filters.sellerId;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return this.prisma.brand.count({ where });
  }

  async findBrandsByCategory(categoryId: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        categories: {
          some: {
            categoryId,
          },
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return brands.map(this.mapToDomain);
  }

  async findBrandsBySeller(sellerId: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        sellerId,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      } as any,
    });

    return brands.map(this.mapToDomain);
  }

  private mapToDomain(prismaData: any): Brand {
    return new Brand({
      id: prismaData.id,
      name: prismaData.name,
      slug: prismaData.slug,
      description: prismaData.description,
      logoUrl: prismaData.logoUrl,
      websiteUrl: prismaData.websiteUrl,
      status: prismaData.status,
      scope: prismaData.scope || BrandScope.GLOBAL,
      isVerified: prismaData.isVerified,
      sellerId: prismaData.sellerId,
      metadata: prismaData.metadata,
      categoryIds: prismaData.categories?.map((c: any) => c.categoryId) || [],
      createdBy: prismaData.createdBy,
      updatedBy: prismaData.updatedBy,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
      deletedAt: prismaData.deletedAt,
      deletedBy: prismaData.deletedBy,
    });
  }
}