import { BadRequestException } from '@nestjs/common';
import { BrandValidators } from '../brand.validators';

describe('BrandValidators', () => {
  describe('validateBrandName', () => {
    it('should accept valid brand names', () => {
      // Arrange
      const validNames = [
        'Nike',
        'Apple Inc',
        'Coca-Cola',
        'McDonald\'s',
        'H&M',
        'AT&T',
        'Ben & Jerry\'s',
        'Johnson & Johnson',
        'Procter & Gamble',
        'L\'Oréal',
      ];

      // Act & Assert
      validNames.forEach(name => {
        expect(() => BrandValidators.validateBrandName(name)).not.toThrow();
      });
    });

    it('should reject names that are too short', () => {
      // Arrange
      const shortNames = ['A', 'B'];

      // Act & Assert
      shortNames.forEach(name => {
        expect(() => BrandValidators.validateBrandName(name)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandName(name)).toThrow('Brand name must be between 2 and 100 characters');
      });
    });

    it('should reject names that are too long', () => {
      // Arrange
      const longName = 'A'.repeat(101);

      // Act & Assert
      expect(() => BrandValidators.validateBrandName(longName)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateBrandName(longName)).toThrow('Brand name must be between 2 and 100 characters');
    });

    it('should reject empty or whitespace-only names', () => {
      // Arrange
      const invalidNames = ['', '   ', '\t', '\n'];

      // Act & Assert
      invalidNames.forEach(name => {
        expect(() => BrandValidators.validateBrandName(name)).toThrow(BadRequestException);
      });
    });

    it('should reject reserved words', () => {
      // Arrange
      const reservedWords = ['admin', 'api', 'www', 'test', 'brand', 'brands'];

      // Act & Assert
      reservedWords.forEach(word => {
        expect(() => BrandValidators.validateBrandName(word)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandName(word)).toThrow('Brand name contains reserved words');
      });
    });

    it('should reject reserved words case-insensitively', () => {
      // Arrange
      const reservedWords = ['ADMIN', 'Api', 'WWW', 'Test', 'BRAND'];

      // Act & Assert
      reservedWords.forEach(word => {
        expect(() => BrandValidators.validateBrandName(word)).toThrow(BadRequestException);
      });
    });

    it('should reject names containing profanity', () => {
      // Note: This test assumes profanity words are configured
      // In the actual implementation, you would add profanity words to the PROFANITY_WORDS array
      
      // Arrange
      const profaneNames = ['BadWord Brand', 'Another BadWord'];
      
      // Mock the profanity check by temporarily adding words
      const originalProfanityWords = (BrandValidators as any).PROFANITY_WORDS;
      (BrandValidators as any).PROFANITY_WORDS = ['badword'];

      // Act & Assert
      profaneNames.forEach(name => {
        expect(() => BrandValidators.validateBrandName(name)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandName(name)).toThrow('Brand name contains inappropriate content');
      });

      // Restore original profanity words
      (BrandValidators as any).PROFANITY_WORDS = originalProfanityWords;
    });

    it('should handle Unicode characters correctly', () => {
      // Arrange
      const unicodeNames = [
        'Café Deluxe',
        'Naïve Brand',
        'Björk Music',
        'Zürich Bank',
        'Москва Brand',
        '北京 Company',
        'العربية Brand',
      ];

      // Act & Assert
      unicodeNames.forEach(name => {
        expect(() => BrandValidators.validateBrandName(name)).not.toThrow();
      });
    });

    it('should normalize Unicode characters', () => {
      // Arrange
      const nameWithAccents = 'Café';
      const normalizedName = BrandValidators.normalizeBrandName(nameWithAccents);

      // Act & Assert
      expect(normalizedName).toBe('Cafe'); // Accents removed
    });
  });

  describe('validateBrandSlug', () => {
    it('should accept valid slugs', () => {
      // Arrange
      const validSlugs = [
        'nike',
        'apple-inc',
        'coca-cola',
        'mcdonalds',
        'h-and-m',
        'at-and-t',
        'ben-and-jerrys',
        'johnson-and-johnson',
        'procter-and-gamble',
        'loreal',
      ];

      // Act & Assert
      validSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).not.toThrow();
      });
    });

    it('should reject slugs with uppercase letters', () => {
      // Arrange
      const invalidSlugs = ['Nike', 'APPLE', 'CocaCola'];

      // Act & Assert
      invalidSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow('Brand slug must be lowercase with hyphens only');
      });
    });

    it('should reject slugs with invalid characters', () => {
      // Arrange
      const invalidSlugs = [
        'brand_name',
        'brand.name',
        'brand name',
        'brand@name',
        'brand#name',
        'brand$name',
        'brand%name',
      ];

      // Act & Assert
      invalidSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
      });
    });

    it('should reject slugs that are too short', () => {
      // Arrange
      const shortSlugs = ['a', 'b'];

      // Act & Assert
      shortSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow('Brand slug must be between 2 and 100 characters');
      });
    });

    it('should reject slugs that are too long', () => {
      // Arrange
      const longSlug = 'a'.repeat(101);

      // Act & Assert
      expect(() => BrandValidators.validateBrandSlug(longSlug)).toThrow(BadRequestException);
    });

    it('should reject reserved word slugs', () => {
      // Arrange
      const reservedSlugs = ['admin', 'api', 'www', 'test', 'brand', 'brands'];

      // Act & Assert
      reservedSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow('Brand slug contains reserved words');
      });
    });

    it('should reject slugs starting or ending with hyphens', () => {
      // Arrange
      const invalidSlugs = ['-brand', 'brand-', '-brand-'];

      // Act & Assert
      invalidSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow('Brand slug cannot start or end with hyphens');
      });
    });

    it('should reject slugs with consecutive hyphens', () => {
      // Arrange
      const invalidSlugs = ['brand--name', 'brand---name', 'my--brand'];

      // Act & Assert
      invalidSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow('Brand slug cannot contain consecutive hyphens');
      });
    });

    it('should handle empty or whitespace slugs', () => {
      // Arrange
      const invalidSlugs = ['', '   ', '\t'];

      // Act & Assert
      invalidSlugs.forEach(slug => {
        expect(() => BrandValidators.validateBrandSlug(slug)).toThrow(BadRequestException);
      });
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      // Arrange
      const validUrls = [
        'https://example.com',
        'https://www.example.com',
        'https://subdomain.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com:8080',
        'http://localhost:3000',
        'https://example.co.uk',
        'https://example-site.com',
      ];

      // Act & Assert
      validUrls.forEach(url => {
        expect(() => BrandValidators.validateUrl(url)).not.toThrow();
      });
    });

    it('should reject invalid URLs', () => {
      // Arrange
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'example.com',
        'www.example.com',
        'https://',
        'https://.',
        'https://.com',
        'https://example',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ];

      // Act & Assert
      invalidUrls.forEach(url => {
        expect(() => BrandValidators.validateUrl(url)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateUrl(url)).toThrow('Invalid URL format');
      });
    });

    it('should accept null or undefined URLs (optional)', () => {
      // Act & Assert
      expect(() => BrandValidators.validateUrl(null)).not.toThrow();
      expect(() => BrandValidators.validateUrl(undefined)).not.toThrow();
    });

    it('should reject URLs that are too long', () => {
      // Arrange
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);

      // Act & Assert
      expect(() => BrandValidators.validateUrl(longUrl)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateUrl(longUrl)).toThrow('URL is too long');
    });
  });

  describe('validateCategoryIds', () => {
    it('should accept valid category ID arrays', () => {
      // Arrange
      const validCategoryIds = [
        ['cat-1'],
        ['cat-1', 'cat-2'],
        ['cat-1', 'cat-2', 'cat-3'],
        Array.from({ length: 10 }, (_, i) => `cat-${i + 1}`), // 10 categories
      ];

      // Act & Assert
      validCategoryIds.forEach(categoryIds => {
        expect(() => BrandValidators.validateCategoryIds(categoryIds)).not.toThrow();
      });
    });

    it('should reject empty category arrays', () => {
      // Act & Assert
      expect(() => BrandValidators.validateCategoryIds([])).toThrow(BadRequestException);
      expect(() => BrandValidators.validateCategoryIds([])).toThrow('At least one category is required');
    });

    it('should reject too many categories', () => {
      // Arrange
      const tooManyCategories = Array.from({ length: 11 }, (_, i) => `cat-${i + 1}`);

      // Act & Assert
      expect(() => BrandValidators.validateCategoryIds(tooManyCategories)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateCategoryIds(tooManyCategories)).toThrow('Maximum 10 categories allowed');
    });

    it('should reject invalid UUID formats', () => {
      // Arrange
      const invalidCategoryIds = [
        ['not-a-uuid'],
        ['cat-1', 'invalid-uuid'],
        ['123'],
        ['cat-1', ''],
        ['cat-1', null],
      ];

      // Act & Assert
      invalidCategoryIds.forEach(categoryIds => {
        expect(() => BrandValidators.validateCategoryIds(categoryIds)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateCategoryIds(categoryIds)).toThrow('All category IDs must be valid UUIDs');
      });
    });

    it('should reject duplicate category IDs', () => {
      // Arrange
      const duplicateCategoryIds = ['cat-1', 'cat-2', 'cat-1'];

      // Act & Assert
      expect(() => BrandValidators.validateCategoryIds(duplicateCategoryIds)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateCategoryIds(duplicateCategoryIds)).toThrow('Duplicate category IDs are not allowed');
    });

    it('should handle null or undefined category arrays', () => {
      // Act & Assert
      expect(() => BrandValidators.validateCategoryIds(null)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateCategoryIds(undefined)).toThrow(BadRequestException);
    });
  });

  describe('validateBusinessJustification', () => {
    it('should accept valid business justifications', () => {
      // Arrange
      const validJustifications = [
        'A'.repeat(50), // Minimum length
        'This is a valid business justification for creating this brand. It explains the business need and expected usage in detail.',
        'A'.repeat(2000), // Maximum length
      ];

      // Act & Assert
      validJustifications.forEach(justification => {
        expect(() => BrandValidators.validateBusinessJustification(justification)).not.toThrow();
      });
    });

    it('should reject justifications that are too short', () => {
      // Arrange
      const shortJustifications = [
        '',
        'Short',
        'A'.repeat(49), // One character short
      ];

      // Act & Assert
      shortJustifications.forEach(justification => {
        expect(() => BrandValidators.validateBusinessJustification(justification)).toThrow(BadRequestException);
        expect(() => BrandValidators.validateBusinessJustification(justification)).toThrow('Business justification must be between 50 and 2000 characters');
      });
    });

    it('should reject justifications that are too long', () => {
      // Arrange
      const longJustification = 'A'.repeat(2001);

      // Act & Assert
      expect(() => BrandValidators.validateBusinessJustification(longJustification)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateBusinessJustification(longJustification)).toThrow('Business justification must be between 50 and 2000 characters');
    });

    it('should handle null or undefined justifications', () => {
      // Act & Assert
      expect(() => BrandValidators.validateBusinessJustification(null)).toThrow(BadRequestException);
      expect(() => BrandValidators.validateBusinessJustification(undefined)).toThrow(BadRequestException);
    });

    it('should trim whitespace and validate length', () => {
      // Arrange
      const justificationWithWhitespace = '   ' + 'A'.repeat(50) + '   ';

      // Act & Assert
      expect(() => BrandValidators.validateBusinessJustification(justificationWithWhitespace)).not.toThrow();
    });

    it('should reject whitespace-only justifications', () => {
      // Arrange
      const whitespaceJustification = ' '.repeat(100);

      // Act & Assert
      expect(() => BrandValidators.validateBusinessJustification(whitespaceJustification)).toThrow(BadRequestException);
    });
  });

  describe('generateSlugFromName', () => {
    it('should generate valid slugs from brand names', () => {
      // Arrange & Act & Assert
      expect(BrandValidators.generateSlugFromName('Nike')).toBe('nike');
      expect(BrandValidators.generateSlugFromName('Apple Inc')).toBe('apple-inc');
      expect(BrandValidators.generateSlugFromName('Coca-Cola')).toBe('coca-cola');
      expect(BrandValidators.generateSlugFromName('McDonald\'s')).toBe('mcdonalds');
      expect(BrandValidators.generateSlugFromName('H&M')).toBe('h-and-m');
      expect(BrandValidators.generateSlugFromName('AT&T')).toBe('at-and-t');
    });

    it('should handle special characters', () => {
      // Arrange & Act & Assert
      expect(BrandValidators.generateSlugFromName('Ben & Jerry\'s')).toBe('ben-and-jerrys');
      expect(BrandValidators.generateSlugFromName('Johnson & Johnson')).toBe('johnson-and-johnson');
      expect(BrandValidators.generateSlugFromName('Procter & Gamble')).toBe('procter-and-gamble');
      expect(BrandValidators.generateSlugFromName('L\'Oréal')).toBe('loreal');
    });

    it('should handle Unicode characters', () => {
      // Arrange & Act & Assert
      expect(BrandValidators.generateSlugFromName('Café Deluxe')).toBe('cafe-deluxe');
      expect(BrandValidators.generateSlugFromName('Naïve Brand')).toBe('naive-brand');
      expect(BrandValidators.generateSlugFromName('Björk Music')).toBe('bjork-music');
    });

    it('should handle multiple spaces and special characters', () => {
      // Arrange & Act & Assert
      expect(BrandValidators.generateSlugFromName('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(BrandValidators.generateSlugFromName('Brand!@#$%^&*()Name')).toBe('brand-name');
      expect(BrandValidators.generateSlugFromName('Brand___Name')).toBe('brand-name');
    });

    it('should handle empty or invalid input', () => {
      // Arrange & Act & Assert
      expect(BrandValidators.generateSlugFromName('')).toBe('');
      expect(BrandValidators.generateSlugFromName('   ')).toBe('');
      expect(BrandValidators.generateSlugFromName('!@#$%^&*()')).toBe('');
    });

    it('should truncate long slugs', () => {
      // Arrange
      const longName = 'A'.repeat(150);
      
      // Act
      const slug = BrandValidators.generateSlugFromName(longName);
      
      // Assert
      expect(slug.length).toBeLessThanOrEqual(100);
    });
  });

  describe('isReservedWord', () => {
    it('should identify reserved words case-insensitively', () => {
      // Arrange
      const reservedWords = ['admin', 'ADMIN', 'Admin', 'api', 'API', 'www', 'WWW'];

      // Act & Assert
      reservedWords.forEach(word => {
        expect(BrandValidators.isReservedWord(word)).toBe(true);
      });
    });

    it('should not identify non-reserved words', () => {
      // Arrange
      const nonReservedWords = ['nike', 'apple', 'google', 'microsoft', 'amazon'];

      // Act & Assert
      nonReservedWords.forEach(word => {
        expect(BrandValidators.isReservedWord(word)).toBe(false);
      });
    });

    it('should handle empty or null input', () => {
      // Act & Assert
      expect(BrandValidators.isReservedWord('')).toBe(false);
      expect(BrandValidators.isReservedWord(null)).toBe(false);
      expect(BrandValidators.isReservedWord(undefined)).toBe(false);
    });
  });

  describe('containsProfanity', () => {
    it('should detect profanity in text', () => {
      // Arrange
      const originalProfanityWords = (BrandValidators as any).PROFANITY_WORDS;
      (BrandValidators as any).PROFANITY_WORDS = ['badword', 'inappropriate'];

      // Act & Assert
      expect(BrandValidators.containsProfanity('This contains badword')).toBe(true);
      expect(BrandValidators.containsProfanity('Inappropriate content here')).toBe(true);
      expect(BrandValidators.containsProfanity('BADWORD in caps')).toBe(true);

      // Restore original profanity words
      (BrandValidators as any).PROFANITY_WORDS = originalProfanityWords;
    });

    it('should not detect profanity in clean text', () => {
      // Act & Assert
      expect(BrandValidators.containsProfanity('This is clean text')).toBe(false);
      expect(BrandValidators.containsProfanity('Nike Brand')).toBe(false);
      expect(BrandValidators.containsProfanity('Apple Inc')).toBe(false);
    });

    it('should handle empty or null input', () => {
      // Act & Assert
      expect(BrandValidators.containsProfanity('')).toBe(false);
      expect(BrandValidators.containsProfanity(null)).toBe(false);
      expect(BrandValidators.containsProfanity(undefined)).toBe(false);
    });
  });

  describe('normalizeBrandName', () => {
    it('should normalize Unicode characters', () => {
      // Act & Assert
      expect(BrandValidators.normalizeBrandName('Café')).toBe('Cafe');
      expect(BrandValidators.normalizeBrandName('Naïve')).toBe('Naive');
      expect(BrandValidators.normalizeBrandName('Björk')).toBe('Bjork');
      expect(BrandValidators.normalizeBrandName('Zürich')).toBe('Zurich');
    });

    it('should preserve non-accented characters', () => {
      // Act & Assert
      expect(BrandValidators.normalizeBrandName('Nike')).toBe('Nike');
      expect(BrandValidators.normalizeBrandName('Apple')).toBe('Apple');
      expect(BrandValidators.normalizeBrandName('Google')).toBe('Google');
    });

    it('should handle empty or null input', () => {
      // Act & Assert
      expect(BrandValidators.normalizeBrandName('')).toBe('');
      expect(BrandValidators.normalizeBrandName(null)).toBe('');
      expect(BrandValidators.normalizeBrandName(undefined)).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete brand data successfully', () => {
      // Arrange
      const validBrandData = {
        name: 'Nike Sports',
        slug: 'nike-sports',
        logoUrl: 'https://example.com/logo.png',
        websiteUrl: 'https://nike.com',
        categoryIds: ['cat-1', 'cat-2'],
        businessJustification: 'This brand is needed for our new sports equipment line. We expect to use it for athletic wear, shoes, and accessories targeting professional athletes and fitness enthusiasts.',
      };

      // Act & Assert
      expect(() => {
        BrandValidators.validateBrandName(validBrandData.name);
        BrandValidators.validateBrandSlug(validBrandData.slug);
        BrandValidators.validateUrl(validBrandData.logoUrl);
        BrandValidators.validateUrl(validBrandData.websiteUrl);
        BrandValidators.validateCategoryIds(validBrandData.categoryIds);
        BrandValidators.validateBusinessJustification(validBrandData.businessJustification);
      }).not.toThrow();
    });

    it('should reject invalid brand data', () => {
      // Arrange
      const invalidBrandData = {
        name: 'admin', // Reserved word
        slug: 'Invalid Slug!', // Invalid format
        logoUrl: 'not-a-url', // Invalid URL
        websiteUrl: 'ftp://example.com', // Invalid protocol
        categoryIds: [], // Empty array
        businessJustification: 'Too short', // Too short
      };

      // Act & Assert
      expect(() => BrandValidators.validateBrandName(invalidBrandData.name)).toThrow();
      expect(() => BrandValidators.validateBrandSlug(invalidBrandData.slug)).toThrow();
      expect(() => BrandValidators.validateUrl(invalidBrandData.logoUrl)).toThrow();
      expect(() => BrandValidators.validateUrl(invalidBrandData.websiteUrl)).toThrow();
      expect(() => BrandValidators.validateCategoryIds(invalidBrandData.categoryIds)).toThrow();
      expect(() => BrandValidators.validateBusinessJustification(invalidBrandData.businessJustification)).toThrow();
    });
  });
});