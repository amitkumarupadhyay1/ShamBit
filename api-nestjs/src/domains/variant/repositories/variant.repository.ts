import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class VariantRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filters?: any, pagination?: any, includes?: any): Promise<any> {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (Number(page) - 1) * Number(limit);

    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: this.buildIncludeClause(includes),
        skip,
        take: Number(limit),
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, includes?: any): Promise<any | null> {
    return this.prisma.productVariant.findUnique({
      where: { id },
      include: this.buildIncludeClause(includes),
    });
  }

  async findBySku(sku: string, includes?: any): Promise<any | null> {
    return this.prisma.productVariant.findUnique({
      where: { sku },
      include: this.buildIncludeClause(includes),
    });
  }

  async findByProduct(
    productId: string,
    filters?: any,
    pagination?: any,
    includes?: any,
  ): Promise<any> {
    return this.findAll({ ...filters, productId }, pagination, includes);
  }

  async findByAttributeCombination(
    productId: string,
    attributeValues: Record<string, string>,
  ): Promise<any | null> {
    // This assumes variantKey is a deterministic hash of attributes
    // Or we search through VariantAttributeValue
    const variantKey = this.generateVariantKey(attributeValues);
    return this.prisma.productVariant.findUnique({
      where: {
        productId_variantKey: {
          productId,
          variantKey,
        },
      },
    });
  }

  async create(payload: any): Promise<any> {
    const { attributeValues, images, pricing, inventory, ...data } = payload;

    return this.prisma.productVariant.create({
      data: {
        ...data,
        variantKey: this.generateVariantKey(attributeValues),
        attributeValues: {
          create: Object.entries(attributeValues || {}).map(([attrId, val]) => ({
            attribute: { connect: { id: attrId } },
            value: val,
          })),
        },
        images: {
          create: (images || []).map((img: any) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
        },
        pricing: pricing ? { create: pricing } : undefined,
        inventory: inventory ? { create: inventory } : undefined,
      },
    });
  }

  async update(id: string, payload: any): Promise<any> {
    const { attributeValues, images, pricing, inventory, ...data } = payload;

    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...data,
        // Updating attributes/images/pricing/inventory would be more complex
        // and usually handled by specific methods or more robust logic
      },
    });
  }

  async updateStatus(id: string, status: any, updatedBy: string): Promise<any> {
    return this.prisma.productVariant.update({
      where: { id },
      data: {
        isActive: status === 'ACTIVE',
        // Assuming updatedBy might be stored somewhere or used in audit
      },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id },
      data: {
        isActive: false,
        // deletedAt/deletedBy if supported by model (ProductVariant in schema has updatedAt but not deletedAt)
      },
    });
  }

  private buildWhereClause(filters: any) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.sku) where.sku = { contains: filters.sku, mode: 'insensitive' };
    return where;
  }

  private buildIncludeClause(includes: any) {
    const include: any = {};
    if (includes?.product) include.product = true;
    if (includes?.attributes) include.attributeValues = { include: { attribute: true } };
    if (includes?.images) include.images = true;
    if (includes?.pricing) include.pricing = true;
    if (includes?.inventory) include.inventory = true;
    return Object.keys(include).length > 0 ? include : undefined;
  }

  private generateVariantKey(attributeValues: Record<string, string>): string {
    if (!attributeValues) return 'default';
    return Object.entries(attributeValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  }
}

