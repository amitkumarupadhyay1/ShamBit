import { BadRequestException } from '@nestjs/common';
import { VariantValidators } from '../variant.validators';
import { VariantStatus } from '../enums/variant-status.enum';
import { ProductVariant } from '../entities/variant.entity';
import { TestDataFactory } from '../../../test/utils/test-helpers';

describe('VariantValidators', () => {
    let mockVariant: ProductVariant;

    beforeEach(() => {
        mockVariant = TestDataFactory.createTestVariant({
            status: VariantStatus.DRAFT,
            sku: 'OLD-SKU'
        }) as unknown as ProductVariant;
    });

    describe('validateSkuImmutability', () => {
        it('should throw error if attempting to change SKU of ACTIVE variant', () => {
            mockVariant.status = VariantStatus.ACTIVE;
            expect(() => {
                VariantValidators.validateSkuImmutability(mockVariant, 'NEW-SKU');
            }).toThrow(BadRequestException);
        });

        it('should NOT throw if SKU is same for ACTIVE variant', () => {
            mockVariant.status = VariantStatus.ACTIVE;
            expect(() => {
                VariantValidators.validateSkuImmutability(mockVariant, 'OLD-SKU');
            }).not.toThrow();
        });

        it('should NOT throw if variant is DRAFT', () => {
            mockVariant.status = VariantStatus.DRAFT;
            expect(() => {
                VariantValidators.validateSkuImmutability(mockVariant, 'NEW-SKU');
            }).not.toThrow();
        });
    });

    describe('validateStatusTransition', () => {
        it('should throw error if transition is invalid', () => {
            // Example: ARCHIVED to ACTIVE is usually invalid
            expect(() => {
                VariantValidators.validateStatusTransition(VariantStatus.ARCHIVED, VariantStatus.ACTIVE);
            }).toThrow(BadRequestException);
        });

        it('should throw error when archiving ACTIVE variant without disabling', () => {
            expect(() => {
                VariantValidators.validateStatusTransition(VariantStatus.ACTIVE, VariantStatus.ARCHIVED);
            }).toThrow('Must disable variant before archiving');
        });

        it('should allow valid transition', () => {
            expect(() => {
                VariantValidators.validateStatusTransition(VariantStatus.DRAFT, VariantStatus.ACTIVE);
            }).not.toThrow();
        });
    });

    describe('validateSkuFormat', () => {
        it('should throw if SKU is empty', () => {
            expect(() => VariantValidators.validateSkuFormat('')).toThrow('SKU is required');
        });

        it('should throw if SKU contains invalid characters', () => {
            expect(() => VariantValidators.validateSkuFormat('SKU 123')).toThrow();
            expect(() => VariantValidators.validateSkuFormat('sku-123')).toThrow(); // Should be uppercase
        });

        it('should allow valid SKU', () => {
            expect(() => VariantValidators.validateSkuFormat('SKU-123_ABC')).not.toThrow();
        });
    });

    describe('validatePriceOverride', () => {
        it('should throw if price is negative', () => {
            expect(() => VariantValidators.validatePriceOverride(-10)).toThrow();
        });

        it('should throw if price has more than 2 decimal places', () => {
            expect(() => VariantValidators.validatePriceOverride(10.123)).toThrow();
        });

        it('should allow valid price', () => {
            expect(() => VariantValidators.validatePriceOverride(10.99)).not.toThrow();
            expect(() => VariantValidators.validatePriceOverride(100)).not.toThrow();
        });
    });
});
