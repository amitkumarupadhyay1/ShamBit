import { Test, TestingModule } from '@nestjs/testing';
import { VariantCombinatorService } from '../services/variant-combinator.service';
import { LoggerService } from '../../../infrastructure/observability/logger.service';
import {
    MockServicesFactory
} from '../../../test/utils/test-helpers';

describe('VariantCombinatorService', () => {
    let service: VariantCombinatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VariantCombinatorService,
                {
                    provide: LoggerService,
                    useValue: MockServicesFactory.createMockLoggerService(),
                },
            ],
        }).compile();

        service = module.get<VariantCombinatorService>(VariantCombinatorService);
    });

    describe('calculateCombinationCount', () => {
        it('should calculate correct count for multiple attributes', () => {
            const options = [
                { attributeId: 'color', attributeName: 'Color', values: ['Red', 'Blue'] },
                { attributeId: 'size', attributeName: 'Size', values: ['S', 'M', 'L'] },
            ];
            expect(service.calculateCombinationCount(options)).toBe(6);
        });

        it('should return 0 if no attributes provided', () => {
            expect(service.calculateCombinationCount([])).toBe(0);
        });
    });

    describe('generateCombinations', () => {
        it('should generate all possible combinations', () => {
            const options = [
                { attributeId: 'color', attributeName: 'Color', values: ['Red', 'Blue'] },
                { attributeId: 'size', attributeName: 'Size', values: ['S'] },
            ];

            const result = service.generateCombinations(options);

            expect(result).toHaveLength(2);
            expect(result).toContainEqual(expect.objectContaining({
                attributeValues: { color: 'Red', size: 'S' }
            }));
            expect(result).toContainEqual(expect.objectContaining({
                attributeValues: { color: 'Blue', size: 'S' }
            }));
        });

        it('should apply maxCombinations limit', () => {
            const options = [
                { attributeId: 'color', attributeName: 'Color', values: ['Red', 'Blue'] },
                { attributeId: 'size', attributeName: 'Size', values: ['S', 'M', 'L'] },
            ];

            const result = service.generateCombinations(options, { maxCombinations: 3 });

            expect(result).toHaveLength(3);
        });

        it('should filter disabled combinations', () => {
            const options = [
                { attributeId: 'color', attributeName: 'Color', values: ['Red', 'Blue'] },
            ];
            // Generate hashes first to know what to disable
            const tempHash = service.generateCombinationHash({ color: 'Red' });

            const result = service.generateCombinations(options, {
                disabledCombinations: [tempHash]
            });

            expect(result).toHaveLength(1);
            expect(result[0].attributeValues.color).toBe('Blue');
        });
    });

    describe('validateCombination', () => {
        const options = [
            { attributeId: 'color', attributeName: 'Color', values: ['Red', 'Blue'] },
        ];

        it('should return true for valid combination', () => {
            expect(service.validateCombination({ color: 'Red' }, options)).toBe(true);
        });

        it('should return false if value is not in options', () => {
            expect(service.validateCombination({ color: 'Green' }, options)).toBe(false);
        });

        it('should return false if required attribute is missing', () => {
            expect(service.validateCombination({}, options)).toBe(false);
        });
    });

    describe('generateCombinationHash', () => {
        it('should be deterministic regardless of property order', () => {
            const hash1 = service.generateCombinationHash({ color: 'Red', size: 'S' });
            const hash2 = service.generateCombinationHash({ size: 'S', color: 'Red' });
            expect(hash1).toBe(hash2);
        });
    });

    describe('compareCombinations', () => {
        it('should correctly identify added and removed combinations', () => {
            const combo1 = { attributeValues: { id: '1' }, hash: 'h1' };
            const combo2 = { attributeValues: { id: '2' }, hash: 'h2' };
            const combo3 = { attributeValues: { id: '3' }, hash: 'h3' };

            const result = service.compareCombinations([combo1, combo2], [combo2, combo3]);

            expect(result.added).toEqual([combo3]);
            expect(result.removed).toEqual([combo1]);
            expect(result.unchanged).toEqual([combo2]);
        });
    });
});
