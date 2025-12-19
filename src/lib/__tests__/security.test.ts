import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeText,
  validateUsername,
  validateStoryContent,
  validateRating,
  validateTag,
  validatePhoneNumber,
  sanitizeHtml,
  sanitizeUserInput,
  validateProfileData,
} from '../security';

// ==================== sanitizeText Tests ====================

describe('sanitizeText', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('removes script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('hello');
    expect(sanitizeText('hello<script>evil()</script>world')).toBe('helloworld');
  });

  it('removes javascript protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes event handlers', () => {
    expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeText('onmouseover=evil()')).toBe('evil()');
  });

  it('removes dangerous tags', () => {
    expect(sanitizeText('<iframe src="evil.com">')).toBe('');
    expect(sanitizeText('<embed src="evil.swf">')).toBe('');
    expect(sanitizeText('<object data="evil">')).toBe('');
  });

  it('truncates to 5000 characters', () => {
    const longText = 'a'.repeat(6000);
    expect(sanitizeText(longText).length).toBe(5000);
  });
});

// ==================== validateUsername Tests ====================

describe('validateUsername', () => {
  it('validates correct usernames', () => {
    expect(validateUsername('valid_user')).toEqual({ isValid: true });
    expect(validateUsername('User123')).toEqual({ isValid: true });
    expect(validateUsername('my-name')).toEqual({ isValid: true });
    expect(validateUsername('abc')).toEqual({ isValid: true });
  });

  it('rejects empty username', () => {
    const result = validateUsername('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects username too short', () => {
    const result = validateUsername('ab');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('3 characters');
  });

  it('rejects username too long', () => {
    const result = validateUsername('a'.repeat(21));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('20 characters');
  });

  it('rejects invalid characters', () => {
    expect(validateUsername('user@name').isValid).toBe(false);
    expect(validateUsername('user name').isValid).toBe(false);
    expect(validateUsername('user.name').isValid).toBe(false);
  });

  it('rejects reserved names', () => {
    expect(validateUsername('admin').isValid).toBe(false);
    expect(validateUsername('ADMIN').isValid).toBe(false);
    expect(validateUsername('root').isValid).toBe(false);
    expect(validateUsername('system').isValid).toBe(false);
    expect(validateUsername('support').isValid).toBe(false);
  });

  it('rejects names containing reserved words', () => {
    expect(validateUsername('myadmin').isValid).toBe(false);
    expect(validateUsername('rootuser').isValid).toBe(false);
  });
});

// ==================== validateStoryContent Tests ====================

describe('validateStoryContent', () => {
  it('validates correct content', () => {
    expect(validateStoryContent('This is a valid story.')).toEqual({ isValid: true });
    expect(validateStoryContent('Short')).toEqual({ isValid: true });
  });

  it('rejects empty content', () => {
    expect(validateStoryContent('').isValid).toBe(false);
    expect(validateStoryContent('   ').isValid).toBe(false);
  });

  it('rejects content over 5000 characters', () => {
    const result = validateStoryContent('a'.repeat(5001));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('5000');
  });

  it('rejects dangerous content', () => {
    expect(validateStoryContent('<script>alert(1)</script>').isValid).toBe(false);
    expect(validateStoryContent('javascript:void(0)').isValid).toBe(false);
    expect(validateStoryContent('data:text/html,<script>').isValid).toBe(false);
  });

  it('rejects event handlers', () => {
    expect(validateStoryContent('onload=evil()').isValid).toBe(false);
    expect(validateStoryContent('onerror=bad()').isValid).toBe(false);
  });
});

// ==================== validateRating Tests ====================

describe('validateRating', () => {
  it('validates correct ratings', () => {
    expect(validateRating(1, 'Test')).toEqual({ isValid: true });
    expect(validateRating(3, 'Test')).toEqual({ isValid: true });
    expect(validateRating(5, 'Test')).toEqual({ isValid: true });
  });

  it('rejects ratings below 1', () => {
    const result = validateRating(0, 'Communication');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Communication');
    expect(result.error).toContain('between 1 and 5');
  });

  it('rejects ratings above 5', () => {
    const result = validateRating(6, 'Loyalty');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Loyalty');
  });

  it('rejects non-numbers', () => {
    expect(validateRating(NaN, 'Test').isValid).toBe(false);
    expect(validateRating('3' as any, 'Test').isValid).toBe(false);
  });
});

// ==================== validateTag Tests ====================

describe('validateTag', () => {
  it('validates correct tags', () => {
    expect(validateTag('dating')).toEqual({ isValid: true });
    expect(validateTag('first-date')).toEqual({ isValid: true });
    expect(validateTag('❤️ love')).toEqual({ isValid: true });
    expect(validateTag('café')).toEqual({ isValid: true });
  });

  it('rejects empty tags', () => {
    expect(validateTag('').isValid).toBe(false);
    expect(validateTag('   ').isValid).toBe(false);
  });

  it('rejects tags over 50 characters', () => {
    const result = validateTag('a'.repeat(51));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('50 characters');
  });
});

// ==================== validatePhoneNumber Tests ====================

describe('validatePhoneNumber', () => {
  it('returns valid for empty phone (optional field)', () => {
    expect(validatePhoneNumber('')).toEqual({ isValid: true });
    expect(validatePhoneNumber('   ')).toEqual({ isValid: true });
  });

  it('validates US phone formats', () => {
    expect(validatePhoneNumber('1234567890')).toEqual({ isValid: true });
    expect(validatePhoneNumber('123-456-7890')).toEqual({ isValid: true });
    expect(validatePhoneNumber('(123) 456-7890')).toEqual({ isValid: true });
    expect(validatePhoneNumber('123.456.7890')).toEqual({ isValid: true });
    expect(validatePhoneNumber('+1 123 456 7890')).toEqual({ isValid: true });
  });

  it('rejects invalid phone formats', () => {
    expect(validatePhoneNumber('123').isValid).toBe(false);
    expect(validatePhoneNumber('abcdefghij').isValid).toBe(false);
    expect(validatePhoneNumber('123-456').isValid).toBe(false);
  });
});

// ==================== sanitizeHtml Tests ====================

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
  });

  it('removes script tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>safe')).toBe('safe');
  });

  it('neutralizes dangerous protocols', () => {
    expect(sanitizeHtml('javascript:alert(1)')).toContain('unsafe:');
    expect(sanitizeHtml('data:text/html')).toContain('unsafe:');
  });

  it('removes event handlers', () => {
    expect(sanitizeHtml('onclick=bad()')).toContain('data-removed=');
  });

  it('removes dangerous elements', () => {
    expect(sanitizeHtml('<iframe src="evil">content</iframe>')).not.toContain('iframe');
    expect(sanitizeHtml('<embed src="evil">')).not.toContain('embed');
    expect(sanitizeHtml('<object data="evil">')).not.toContain('object');
  });

  it('truncates to 10000 characters', () => {
    const longHtml = '<p>' + 'a'.repeat(11000) + '</p>';
    expect(sanitizeHtml(longHtml).length).toBe(10000);
  });
});

// ==================== sanitizeUserInput Tests ====================

describe('sanitizeUserInput', () => {
  it('sanitizes and truncates input', () => {
    const result = sanitizeUserInput('<script>bad</script>hello', 100);
    expect(result).toBe('hello');
  });

  it('respects custom max length', () => {
    const result = sanitizeUserInput('hello world', 5);
    expect(result).toBe('hello');
  });

  it('returns empty string for falsy input', () => {
    expect(sanitizeUserInput('')).toBe('');
    expect(sanitizeUserInput(null as any)).toBe('');
  });
});

// ==================== validateProfileData Tests ====================

describe('validateProfileData', () => {
  it('validates correct profile data', () => {
    const result = validateProfileData({
      anonymous_username: 'validuser',
      city: 'New York',
      relationship_status: 'single',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid username', () => {
    const result = validateProfileData({
      anonymous_username: 'admin',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid phone number', () => {
    const result = validateProfileData({
      phone_number: 'not-a-phone',
    });
    expect(result.isValid).toBe(false);
  });

  it('sanitizes city and relationship_status', () => {
    const result = validateProfileData({
      city: '<script>NYC</script>',
      relationship_status: '<b>single</b>',
    });
    expect(result.sanitizedData.city).not.toContain('script');
  });

  it('truncates long city names', () => {
    const result = validateProfileData({
      city: 'a'.repeat(150),
    });
    expect(result.sanitizedData.city.length).toBeLessThanOrEqual(100);
  });
});
