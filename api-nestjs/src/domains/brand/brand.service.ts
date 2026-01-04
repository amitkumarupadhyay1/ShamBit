import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  BrandRepository,
  BrandFilters,
  PaginationOptions,
} from './repositories/brand.repository';
import { BrandAuditService } from './services/brand-audit.service';
import { LoggerService } from '../../infrastructure/observability/logger.service';
import { Brand } from './entities/brand.entity';
import { BrandStatus, BrandStatusTransitions } from './enums/brand-status.enum';
import { BrandScope } from './enums/brand-scope.enum';
import { CreateBrandDto } from './dtos/create-brand.dto';
import { UpdateBrandDto, BrandStatusUpdateDto } from './dtos/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly brandAuditService: BrandAuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async findAll(
    filters: BrandFilters = {},
    pagination: PaginationOptions = {},
  ) {
    this.logger.log('BrandService.findAll', { filters, pagination });

    return this.brandRepository.findAll(filters, pagination);
  }

  async findById(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandRepository.findBySlug(slug);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async create(
    createBrandDto: CreateBrandDto,
    createdBy: string,
    userRole?: string,
  ): Promise<Brand> {
    this.logger.log('BrandService.create', { createBrandDto, createdBy });

    // Check if slug already exists
    const existingBrandBySlug = await this.brandRepository.findBySlug(
      createBrandDto.slug,
    );
    if (existingBrandBySlug) {
      throw new ConflictException('Brand with this slug already exists');
    }

    // Check if name already exists
    const existingBrandByName = await this.brandRepository.findByName(
      createBrandDto.name,
    );
    if (existingBrandByName) {
      throw new ConflictException('Brand with this name already exists');
    }

    // Validate category assignments
    await this.validateCategoryAssignments(createBrandDto.categoryIds);

    // Validate seller ownership if not global
    if (createBrandDto.scope !== BrandScope.GLOBAL && createBrandDto.sellerId) {
      await this.validateSellerExists(createBrandDto.sellerId);
    }

    const brand = await this.brandRepository.create({
      ...createBrandDto,
      status: BrandStatus.DRAFT,
      createdBy,
    });

    // Create audit log
    await this.brandAuditService.logAction(
      brand.id,
      'CREATE',
      createdBy,
      null,
      brand,
      'Brand created',
      undefined,
      undefined,
      userRole || 'UNKNOWN',
    );

    // Emit brand created event
    this.eventEmitter.emit('brand.created', brand);

    this.logger.log('Brand created successfully', { brandId: brand.id });
    return brand;
  }

  async update(
    id: string,
    updateBrandDto: UpdateBrandDto,
    updatedBy: string,
    userRole?: string,
  ): Promise<Brand> {
    this.logger.log('BrandService.update', { id, updateBrandDto, updatedBy });

    const existingBrand = await this.findById(id);

    // Check permissions
    await this.validateUpdatePermissions(existingBrand, updatedBy, userRole);

    // Validate slug uniqueness if updating slug
    if (updateBrandDto.slug && updateBrandDto.slug !== existingBrand.slug) {
      const existingBrandBySlug = await this.brandRepository.findBySlug(updateBrandDto.slug);
      if (existingBrandBySlug && existingBrandBySlug.id !== id) {
        throw new ConflictException('Brand with this slug already exists');
      }
    }

    // Validate category assignments if provided
    if (updateBrandDto.categoryIds) {
      await this.validateCategoryAssignments(updateBrandDto.categoryIds);
    }

    // Validate status change if provided
    if (updateBrandDto.status) {
      this.validateStatusTransition(
        existingBrand.status,
        updateBrandDto.status,
      );
    }

    const updatedBrand = await this.brandRepository.update(id, {
      ...updateBrandDto,
      updatedBy,
    });

    // Create audit log
    await this.brandAuditService.logAction(
      id,
      'UPDATE',
      updatedBy,
      existingBrand,
      updatedBrand,
      'Brand updated',
      undefined,
      undefined,
      userRole || 'UNKNOWN',
    );

    // Emit brand updated event
    this.eventEmitter.emit('brand.updated', updatedBrand);

    this.logger.log('Brand updated successfully', { brandId: id });
    return updatedBrand;
  }

  async updateStatus(
    id: string,
    statusUpdate: BrandStatusUpdateDto,
    updatedBy: string,
    userRole?: string,
  ): Promise<Brand> {
    this.logger.log('BrandService.updateStatus', {
      id,
      statusUpdate,
      updatedBy,
    });

    const existingBrand = await this.findById(id);

    // Check if admin approval is required
    if (this.requiresAdminApproval(statusUpdate.status) && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this status change');
    }

    // Validate status transition
    this.validateStatusTransition(existingBrand.status, statusUpdate.status);

    const updatedBrand = await this.brandRepository.update(id, {
      status: statusUpdate.status,
      updatedBy,
    });

    // Create audit log
    await this.brandAuditService.logAction(
      id,
      'STATUS_CHANGE',
      updatedBy,
      existingBrand,
      updatedBrand,
      statusUpdate.reason || 'Status changed',
      undefined,
      undefined,
      userRole || 'UNKNOWN',
    );

    // Emit status change event
    this.eventEmitter.emit('brand.status_changed', updatedBrand);

    this.logger.log('Brand status updated successfully', {
      brandId: id,
      status: statusUpdate.status,
    });
    return updatedBrand;
  }

  async delete(
    id: string,
    deletedBy: string,
    userRole?: string,
  ): Promise<Brand> {
    this.logger.log('BrandService.delete', { id, deletedBy });

    const existingBrand = await this.findById(id);

    // Check permissions
    await this.validateDeletePermissions(existingBrand, deletedBy, userRole);

    // Check if brand is in use
    await this.validateBrandNotInUse(id);

    await this.brandRepository.update(id, {
      status: BrandStatus.ARCHIVED,
      updatedBy: deletedBy,
    });

    const deletedBrand = await this.findById(id);

    // Create audit log
    await this.brandAuditService.logAction(
      id,
      'DELETE',
      deletedBy,
      existingBrand,
      deletedBrand,
      'Brand deleted',
      undefined,
      undefined,
      userRole || 'UNKNOWN',
    );

    // Emit brand deleted event
    this.eventEmitter.emit('brand.deleted', deletedBrand);

    this.logger.log('Brand deleted successfully', { brandId: id });
    return deletedBrand;
  }

  async findBySellerId(sellerId: string): Promise<Brand[]> {
    return this.brandRepository.findBySellerId(sellerId);
  }

  async getStatistics(sellerId?: string): Promise<any> {
    return this.brandRepository.getStatistics();
  }

  async validateBrandAccess(
    brandId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    const brand = await this.findById(brandId);

    // Admins can access any brand
    if (userRole === 'ADMIN') {
      return true;
    }

    // Global brands are accessible to all
    if (brand.scope === BrandScope.GLOBAL) {
      return true;
    }

    // Owner can access their own brand
    if (brand.sellerId === userId) {
      return true;
    }

    // For shared brands, check access table (simplified for now)
    if (brand.scope === BrandScope.SELLER_SHARED) {
      // TODO: Implement proper access control check
      return false;
    }

    return false;
  }

  // Validation methods
  private async validateCategoryAssignments(
    categoryIds: string[],
  ): Promise<void> {
    // TODO: Implement category validation
    // This would check if all category IDs exist and are active
    if (categoryIds.length === 0) {
      throw new BadRequestException('At least one category must be assigned');
    }
  }

  private async validateSellerExists(sellerId: string): Promise<void> {
    // TODO: Implement seller validation
    // This would check if the seller exists and is active
  }

  private async validateUpdatePermissions(
    brand: Brand,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    // Admins can update any brand
    if (userRole === 'ADMIN') {
      return;
    }

    // Sellers can only update their own brands
    if (userRole === 'SELLER' && brand.sellerId === userId) {
      return;
    }

    throw new ForbiddenException(
      'Insufficient permissions to update this brand',
    );
  }

  private async validateDeletePermissions(
    brand: Brand,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    // Only admins can delete brands
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can delete brands');
    }
  }

  private validateStatusTransition(
    currentStatus: BrandStatus,
    newStatus: BrandStatus,
  ): void {
    if (!BrandStatusTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async validateBrandNotInUse(brandId: string): Promise<void> {
    const isInUse = await this.brandRepository.isBrandInUse(brandId);
    if (isInUse) {
      throw new BadRequestException('Cannot delete brand that is currently in use');
    }
  }

  private requiresAdminApproval(status: BrandStatus): boolean {
    const adminOnlyStatuses = [
      BrandStatus.APPROVED,
      BrandStatus.REJECTED,
      BrandStatus.SUSPENDED,
    ];
    return adminOnlyStatuses.includes(status);
  }
}
