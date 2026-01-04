import { BrandPolicies } from '../brand.policies';
import { BrandStatus } from '../enums/brand-status.enum';
import { BrandScope, BrandPermission } from '../enums/brand-scope.enum';
import { Brand } from '../entities/brand.entity';
import { UserRole } from '../../../common/types';
import { TestDataFactory } from '../../../test/utils/test-helpers';

describe('BrandPolicies', () => {
  const mockBrand: Brand = TestDataFactory.createTestBrand({
    id: 'brand-1',
    name: 'Test Brand',
    scope: BrandScope.GLOBAL,
    sellerId: 'seller-1',
    status: BrandStatus.ACTIVE,
  });

  describe('canTransitionTo', () => {
    it('should allow valid transitions from DRAFT', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.DRAFT, BrandStatus.PENDING_APPROVAL)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.DRAFT, BrandStatus.ARCHIVED)).toBe(true);
    });

    it('should allow valid transitions from PENDING_APPROVAL', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.PENDING_APPROVAL, BrandStatus.APPROVED)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.PENDING_APPROVAL, BrandStatus.REJECTED)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.PENDING_APPROVAL, BrandStatus.DRAFT)).toBe(true);
    });

    it('should allow valid transitions from APPROVED', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.APPROVED, BrandStatus.ACTIVE)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.APPROVED, BrandStatus.REJECTED)).toBe(true);
    });

    it('should allow valid transitions from REJECTED', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.REJECTED, BrandStatus.DRAFT)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.REJECTED, BrandStatus.ARCHIVED)).toBe(true);
    });

    it('should allow valid transitions from ACTIVE', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.ACTIVE, BrandStatus.INACTIVE)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.ACTIVE, BrandStatus.SUSPENDED)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.ACTIVE, BrandStatus.ARCHIVED)).toBe(true);
    });

    it('should allow valid transitions from INACTIVE', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.INACTIVE, BrandStatus.ACTIVE)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.INACTIVE, BrandStatus.ARCHIVED)).toBe(true);
    });

    it('should allow valid transitions from SUSPENDED', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.SUSPENDED, BrandStatus.ACTIVE)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.SUSPENDED, BrandStatus.INACTIVE)).toBe(true);
      expect(BrandPolicies.canTransitionTo(BrandStatus.SUSPENDED, BrandStatus.ARCHIVED)).toBe(true);
    });

    it('should not allow transitions from ARCHIVED (terminal state)', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.ARCHIVED, BrandStatus.ACTIVE)).toBe(false);
      expect(BrandPolicies.canTransitionTo(BrandStatus.ARCHIVED, BrandStatus.DRAFT)).toBe(false);
      expect(BrandPolicies.canTransitionTo(BrandStatus.ARCHIVED, BrandStatus.PENDING_APPROVAL)).toBe(false);
    });

    it('should not allow invalid transitions', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.DRAFT, BrandStatus.ACTIVE)).toBe(false);
      expect(BrandPolicies.canTransitionTo(BrandStatus.ACTIVE, BrandStatus.DRAFT)).toBe(false);
      expect(BrandPolicies.canTransitionTo(BrandStatus.REJECTED, BrandStatus.ACTIVE)).toBe(false);
    });

    it('should handle same status transition (should be false)', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(BrandStatus.ACTIVE, BrandStatus.ACTIVE)).toBe(false);
      expect(BrandPolicies.canTransitionTo(BrandStatus.DRAFT, BrandStatus.DRAFT)).toBe(false);
    });

    it('should handle undefined current status', () => {
      // Act & Assert
      expect(BrandPolicies.canTransitionTo(undefined as any, BrandStatus.ACTIVE)).toBe(false);
    });
  });

  describe('requiresAdminApproval', () => {
    it('should require admin approval for APPROVED status', () => {
      // Act & Assert
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.APPROVED)).toBe(true);
    });

    it('should require admin approval for REJECTED status', () => {
      // Act & Assert
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.REJECTED)).toBe(true);
    });

    it('should require admin approval for SUSPENDED status', () => {
      // Act & Assert
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.SUSPENDED)).toBe(true);
    });

    it('should not require admin approval for other statuses', () => {
      // Act & Assert
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.DRAFT)).toBe(false);
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.PENDING_APPROVAL)).toBe(false);
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.ACTIVE)).toBe(false);
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.INACTIVE)).toBe(false);
      expect(BrandPolicies.requiresAdminApproval(BrandStatus.ARCHIVED)).toBe(false);
    });
  });

  describe('isUsableInProducts', () => {
    it('should allow ACTIVE brands to be used in products', () => {
      // Act & Assert
      expect(BrandPolicies.isUsableInProducts(BrandStatus.ACTIVE)).toBe(true);
    });

    it('should not allow non-ACTIVE brands to be used in products', () => {
      // Act & Assert
      expect(BrandPolicies.isUsableInProducts(BrandStatus.DRAFT)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.PENDING_APPROVAL)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.APPROVED)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.REJECTED)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.INACTIVE)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.SUSPENDED)).toBe(false);
      expect(BrandPolicies.isUsableInProducts(BrandStatus.ARCHIVED)).toBe(false);
    });
  });

  describe('canUserViewBrand', () => {
    it('should allow admin to view any brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'other-seller',
      });

      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(privateBrand, 'admin-1', UserRole.ADMIN)).toBe(true);
    });

    it('should allow anyone to view global brands', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        sellerId: 'other-seller',
      });

      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(globalBrand, 'any-user', UserRole.SELLER)).toBe(true);
      expect(BrandPolicies.canUserViewBrand(globalBrand, 'another-user', UserRole.BUYER)).toBe(true);
    });

    it('should allow owner to view their own brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(privateBrand, 'seller-1', UserRole.SELLER)).toBe(true);
    });

    it('should not allow non-owner to view private brands', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(privateBrand, 'seller-2', UserRole.SELLER)).toBe(false);
    });

    it('should handle shared brands (requires access check)', () => {
      // Arrange
      const sharedBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_SHARED,
        sellerId: 'seller-1',
      });

      // Act & Assert
      // Note: This would require checking BrandAccess table in real implementation
      // For now, it returns false as access check is not implemented in this method
      expect(BrandPolicies.canUserViewBrand(sharedBrand, 'seller-2', UserRole.SELLER)).toBe(false);
    });

    it('should handle null sellerId for global brands', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        sellerId: null,
      });

      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(globalBrand, 'any-user', UserRole.SELLER)).toBe(true);
    });
  });

  describe('canUserUseBrand', () => {
    it('should allow admin to use any brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'other-seller',
        status: BrandStatus.ACTIVE,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(privateBrand, 'admin-1', UserRole.ADMIN)).toBe(true);
    });

    it('should allow anyone to use active global brands', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        status: BrandStatus.ACTIVE,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(globalBrand, 'any-user', UserRole.SELLER)).toBe(true);
    });

    it('should not allow use of non-active brands', () => {
      // Arrange
      const inactiveBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        status: BrandStatus.INACTIVE,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(inactiveBrand, 'any-user', UserRole.SELLER)).toBe(false);
    });

    it('should allow owner to use their active private brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
        status: BrandStatus.ACTIVE,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(privateBrand, 'seller-1', UserRole.SELLER)).toBe(true);
    });

    it('should not allow non-owner to use private brands', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
        status: BrandStatus.ACTIVE,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(privateBrand, 'seller-2', UserRole.SELLER)).toBe(false);
    });

    it('should handle draft status brands', () => {
      // Arrange
      const draftBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        status: BrandStatus.DRAFT,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(draftBrand, 'any-user', UserRole.SELLER)).toBe(false);
    });

    it('should handle suspended brands', () => {
      // Arrange
      const suspendedBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        status: BrandStatus.SUSPENDED,
      });

      // Act & Assert
      expect(BrandPolicies.canUserUseBrand(suspendedBrand, 'any-user', UserRole.SELLER)).toBe(false);
    });
  });

  describe('canUserManageBrand', () => {
    it('should allow admin to manage any brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'other-seller',
      });

      // Act & Assert
      expect(BrandPolicies.canUserManageBrand(privateBrand, 'admin-1', UserRole.ADMIN)).toBe(true);
    });

    it('should allow owner to manage their own brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserManageBrand(privateBrand, 'seller-1', UserRole.SELLER)).toBe(true);
    });

    it('should not allow non-owner to manage private brands', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserManageBrand(privateBrand, 'seller-2', UserRole.SELLER)).toBe(false);
    });

    it('should not allow sellers to manage global brands', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
        sellerId: null,
      });

      // Act & Assert
      expect(BrandPolicies.canUserManageBrand(globalBrand, 'seller-1', UserRole.SELLER)).toBe(false);
    });

    it('should handle shared brands (owner can manage)', () => {
      // Arrange
      const sharedBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_SHARED,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserManageBrand(sharedBrand, 'seller-1', UserRole.SELLER)).toBe(true);
      expect(BrandPolicies.canUserManageBrand(sharedBrand, 'seller-2', UserRole.SELLER)).toBe(false);
    });
  });

  describe('canUserDeleteBrand', () => {
    it('should allow admin to delete any brand', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'other-seller',
      });

      // Act & Assert
      expect(BrandPolicies.canUserDeleteBrand(privateBrand, 'admin-1', UserRole.ADMIN)).toBe(true);
    });

    it('should not allow sellers to delete brands', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
        sellerId: 'seller-1',
      });

      // Act & Assert
      expect(BrandPolicies.canUserDeleteBrand(privateBrand, 'seller-1', UserRole.SELLER)).toBe(false);
    });

    it('should not allow deletion of global brands by non-admins', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
      });

      // Act & Assert
      expect(BrandPolicies.canUserDeleteBrand(globalBrand, 'seller-1', UserRole.SELLER)).toBe(false);
    });
  });

  describe('getBrandVisibilityScope', () => {
    it('should return correct visibility for global brands', () => {
      // Arrange
      const globalBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.GLOBAL,
      });

      // Act
      const visibility = BrandPolicies.getBrandVisibilityScope(globalBrand);

      // Assert
      expect(visibility).toBe('PUBLIC');
    });

    it('should return correct visibility for private brands', () => {
      // Arrange
      const privateBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_PRIVATE,
      });

      // Act
      const visibility = BrandPolicies.getBrandVisibilityScope(privateBrand);

      // Assert
      expect(visibility).toBe('PRIVATE');
    });

    it('should return correct visibility for shared brands', () => {
      // Arrange
      const sharedBrand = TestDataFactory.createTestBrand({
        scope: BrandScope.SELLER_SHARED,
      });

      // Act
      const visibility = BrandPolicies.getBrandVisibilityScope(sharedBrand);

      // Assert
      expect(visibility).toBe('RESTRICTED');
    });
  });

  describe('validateBrandStatusTransition', () => {
    it('should validate admin-only transitions', () => {
      // Act & Assert
      expect(() => {
        BrandPolicies.validateBrandStatusTransition(
          BrandStatus.PENDING_APPROVAL,
          BrandStatus.APPROVED,
          UserRole.SELLER
        );
      }).toThrow('Only admins can approve brands');
    });

    it('should allow valid admin transitions', () => {
      // Act & Assert
      expect(() => {
        BrandPolicies.validateBrandStatusTransition(
          BrandStatus.PENDING_APPROVAL,
          BrandStatus.APPROVED,
          UserRole.ADMIN
        );
      }).not.toThrow();
    });

    it('should validate invalid transitions', () => {
      // Act & Assert
      expect(() => {
        BrandPolicies.validateBrandStatusTransition(
          BrandStatus.ACTIVE,
          BrandStatus.DRAFT,
          UserRole.ADMIN
        );
      }).toThrow('Invalid status transition');
    });

    it('should allow seller transitions to pending approval', () => {
      // Act & Assert
      expect(() => {
        BrandPolicies.validateBrandStatusTransition(
          BrandStatus.DRAFT,
          BrandStatus.PENDING_APPROVAL,
          UserRole.SELLER
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null brand gracefully', () => {
      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(null as any, 'user-1', UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserUseBrand(null as any, 'user-1', UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserManageBrand(null as any, 'user-1', UserRole.SELLER)).toBe(false);
    });

    it('should handle undefined user role gracefully', () => {
      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(mockBrand, 'user-1', undefined as any)).toBe(false);
      expect(BrandPolicies.canUserUseBrand(mockBrand, 'user-1', undefined as any)).toBe(false);
      expect(BrandPolicies.canUserManageBrand(mockBrand, 'user-1', undefined as any)).toBe(false);
    });

    it('should handle empty user ID gracefully', () => {
      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(mockBrand, '', UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserUseBrand(mockBrand, '', UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserManageBrand(mockBrand, '', UserRole.SELLER)).toBe(false);
    });

    it('should handle null user ID gracefully', () => {
      // Act & Assert
      expect(BrandPolicies.canUserViewBrand(mockBrand, null as any, UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserUseBrand(mockBrand, null as any, UserRole.SELLER)).toBe(false);
      expect(BrandPolicies.canUserManageBrand(mockBrand, null as any, UserRole.SELLER)).toBe(false);
    });
  });
});