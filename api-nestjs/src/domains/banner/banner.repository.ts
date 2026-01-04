import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class BannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(position?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (position) {
      where.position = position;
    }

    return this.prisma.banner.findMany({
      where,
      orderBy: { priority: 'asc' },
    });
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, position, isActive, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = { ...filters };
    if (position) where.position = position;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.banner.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.banner.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.banner.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
