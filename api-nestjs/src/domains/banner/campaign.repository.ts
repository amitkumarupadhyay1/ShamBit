import { Injectable } from '@nestjs/common';

@Injectable()
export class CampaignRepository {
  async findAll(query: any) {
    return { data: [], total: 0 };
  }

  async create(data: any) {
    return {
      id: data.id || 'campaign-123',
      name: data.name,
      description: data.description,
      status: 'DRAFT',
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      spent: 0,
      targetImpressions: data.targetImpressions || 0,
      actualImpressions: 0,
      targetClicks: data.targetClicks || 0,
      actualClicks: 0,
      targetConversions: data.targetConversions || 0,
      actualConversions: 0,
      bannerIds: data.bannerIds || [],
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findById(id: string) {
    return null;
  }
}
