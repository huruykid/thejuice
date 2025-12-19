import { describe, it, expect } from 'vitest';
import {
  getVerificationResult,
  determineVerificationStatus,
  validateApprovalData,
  isValidEmail,
  shouldDeleteSelfie,
  extractFilePathFromUrl,
  formatVerificationCount,
  calculateTimeUntilReset,
  formatTimeRemaining,
  isRateLimited,
  getRecentAttemptCount,
  filterRecentAttempts,
  sortVerificationsByDate,
  groupVerificationsByStatus,
  countVerificationsByStatus,
  isVerificationExpired,
  filterActiveVerifications,
  UserVerification,
} from '../verification';

// ==================== Test Fixtures ====================

const createMockVerification = (
  overrides: Partial<UserVerification> = {}
): UserVerification => ({
  id: 'test-id',
  user_id: 'user-123',
  selfie_url: 'https://example.com/selfie.jpg',
  verification_status: 'pending',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  notes: null,
  ...overrides,
});

// ==================== getVerificationResult Tests ====================

describe('getVerificationResult', () => {
  it('returns correct result for null verification', () => {
    const result = getVerificationResult(null);
    expect(result).toEqual({
      hasVerification: false,
      isVerified: false,
      isPending: false,
      isRejected: false,
    });
  });

  it('returns correct result for pending verification', () => {
    const verification = createMockVerification({ verification_status: 'pending' });
    const result = getVerificationResult(verification);
    expect(result).toEqual({
      hasVerification: true,
      isVerified: false,
      isPending: true,
      isRejected: false,
    });
  });

  it('returns correct result for approved verification', () => {
    const verification = createMockVerification({ verification_status: 'approved' });
    const result = getVerificationResult(verification);
    expect(result).toEqual({
      hasVerification: true,
      isVerified: true,
      isPending: false,
      isRejected: false,
    });
  });

  it('returns correct result for rejected verification', () => {
    const verification = createMockVerification({ verification_status: 'rejected' });
    const result = getVerificationResult(verification);
    expect(result).toEqual({
      hasVerification: true,
      isVerified: false,
      isPending: false,
      isRejected: true,
    });
  });
});

// ==================== determineVerificationStatus Tests ====================

describe('determineVerificationStatus', () => {
  it('auto-approves admin users', () => {
    const result = determineVerificationStatus(true);
    expect(result.finalStatus).toBe('approved');
    expect(result.reason).toContain('auto-approved');
  });

  it('auto-approves admin users regardless of requested status', () => {
    const result = determineVerificationStatus(true, 'pending');
    expect(result.finalStatus).toBe('approved');
  });

  it('returns pending for non-admin users by default', () => {
    const result = determineVerificationStatus(false);
    expect(result.finalStatus).toBe('pending');
  });

  it('respects requested status for non-admin users', () => {
    const result = determineVerificationStatus(false, 'rejected');
    expect(result.finalStatus).toBe('rejected');
  });

  it('includes reason in the determination', () => {
    const adminResult = determineVerificationStatus(true);
    expect(adminResult.reason).toBeTruthy();

    const userResult = determineVerificationStatus(false, 'approved');
    expect(userResult.reason).toContain('approved');
  });
});

// ==================== validateApprovalData Tests ====================

describe('validateApprovalData', () => {
  it('validates correct approval data', () => {
    const result = validateApprovalData({
      userId: 'user-123',
      email: 'test@example.com',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when userId is missing', () => {
    const result = validateApprovalData({
      userId: '',
      email: 'test@example.com',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('User ID is required');
  });

  it('fails when email is missing', () => {
    const result = validateApprovalData({
      userId: 'user-123',
      email: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('fails with invalid email format', () => {
    const result = validateApprovalData({
      userId: 'user-123',
      email: 'not-an-email',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('accepts optional fields when valid', () => {
    const result = validateApprovalData({
      userId: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      notes: 'Approved by admin',
    });
    expect(result.isValid).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = validateApprovalData({
      userId: '',
      email: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ==================== isValidEmail Tests ====================

describe('isValidEmail', () => {
  it('validates correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('rejects invalid email formats', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });

  it('handles null and undefined', () => {
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
  });
});

// ==================== shouldDeleteSelfie Tests ====================

describe('shouldDeleteSelfie', () => {
  it('returns true when both verificationId and selfieUrl are provided', () => {
    expect(shouldDeleteSelfie('ver-123', 'https://example.com/selfie.jpg')).toBe(true);
  });

  it('returns false when verificationId is missing', () => {
    expect(shouldDeleteSelfie(undefined, 'https://example.com/selfie.jpg')).toBe(false);
    expect(shouldDeleteSelfie('', 'https://example.com/selfie.jpg')).toBe(false);
  });

  it('returns false when selfieUrl is missing', () => {
    expect(shouldDeleteSelfie('ver-123', undefined)).toBe(false);
    expect(shouldDeleteSelfie('ver-123', '')).toBe(false);
  });

  it('returns false when both are missing', () => {
    expect(shouldDeleteSelfie(undefined, undefined)).toBe(false);
  });
});

// ==================== extractFilePathFromUrl Tests ====================

describe('extractFilePathFromUrl', () => {
  it('extracts path from Supabase public storage URL', () => {
    const url = 'https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg';
    const result = extractFilePathFromUrl(url);
    expect(result).toBe('path/to/file.jpg');
  });

  it('extracts path from Supabase signed URL', () => {
    const url = 'https://xxx.supabase.co/storage/v1/object/sign/bucket-name/path/to/file.jpg?token=abc123';
    const result = extractFilePathFromUrl(url);
    expect(result).toBe('path/to/file.jpg');
  });

  it('returns null for invalid URLs', () => {
    expect(extractFilePathFromUrl('not-a-url')).toBe(null);
    expect(extractFilePathFromUrl('')).toBe(null);
    expect(extractFilePathFromUrl(null as any)).toBe(null);
  });

  it('returns null for URLs without expected path structure', () => {
    const url = 'https://example.com/some/other/path';
    expect(extractFilePathFromUrl(url)).toBe(null);
  });
});

// ==================== formatVerificationCount Tests ====================

describe('formatVerificationCount', () => {
  it('formats zero count correctly', () => {
    expect(formatVerificationCount(0)).toBe('No pending verifications');
  });

  it('formats singular count correctly', () => {
    expect(formatVerificationCount(1)).toBe('1 pending verification');
  });

  it('formats plural count correctly', () => {
    expect(formatVerificationCount(5)).toBe('5 pending verifications');
    expect(formatVerificationCount(100)).toBe('100 pending verifications');
  });
});

// ==================== Rate Limiting Tests ====================

describe('calculateTimeUntilReset', () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = 1000000000;

  it('returns 0 for empty attempts', () => {
    expect(calculateTimeUntilReset([], ONE_HOUR, now)).toBe(0);
  });

  it('calculates correct time until reset', () => {
    const attempts = [now - 30 * 60 * 1000]; // 30 minutes ago
    const result = calculateTimeUntilReset(attempts, ONE_HOUR, now);
    expect(result).toBe(30 * 60 * 1000); // 30 minutes remaining
  });

  it('returns 0 when window has passed', () => {
    const attempts = [now - 2 * ONE_HOUR]; // 2 hours ago
    const result = calculateTimeUntilReset(attempts, ONE_HOUR, now);
    expect(result).toBe(0);
  });

  it('uses oldest attempt for calculation', () => {
    const attempts = [
      now - 50 * 60 * 1000, // 50 minutes ago (oldest)
      now - 30 * 60 * 1000, // 30 minutes ago
      now - 10 * 60 * 1000, // 10 minutes ago
    ];
    const result = calculateTimeUntilReset(attempts, ONE_HOUR, now);
    expect(result).toBe(10 * 60 * 1000); // 10 minutes remaining until oldest expires
  });
});

describe('formatTimeRemaining', () => {
  it('formats zero or negative as now', () => {
    expect(formatTimeRemaining(0)).toBe('now');
    expect(formatTimeRemaining(-1000)).toBe('now');
  });

  it('formats seconds correctly', () => {
    expect(formatTimeRemaining(1000)).toBe('1 second');
    expect(formatTimeRemaining(30000)).toBe('30 seconds');
    expect(formatTimeRemaining(59000)).toBe('59 seconds');
  });

  it('formats minutes correctly', () => {
    expect(formatTimeRemaining(60000)).toBe('1 minute');
    expect(formatTimeRemaining(120000)).toBe('2 minutes');
    expect(formatTimeRemaining(45 * 60 * 1000)).toBe('45 minutes');
  });

  it('formats hours correctly', () => {
    expect(formatTimeRemaining(60 * 60 * 1000)).toBe('1 hour');
    expect(formatTimeRemaining(2 * 60 * 60 * 1000)).toBe('2 hours');
  });
});

describe('isRateLimited', () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = 1000000000;

  it('returns false when under limit', () => {
    const attempts = [now - 10000, now - 20000];
    expect(isRateLimited(attempts, 5, ONE_HOUR, now)).toBe(false);
  });

  it('returns true when at limit', () => {
    const attempts = [now - 10000, now - 20000, now - 30000];
    expect(isRateLimited(attempts, 3, ONE_HOUR, now)).toBe(true);
  });

  it('returns true when over limit', () => {
    const attempts = [now - 10000, now - 20000, now - 30000, now - 40000];
    expect(isRateLimited(attempts, 3, ONE_HOUR, now)).toBe(true);
  });

  it('excludes old attempts outside window', () => {
    const attempts = [
      now - 2 * ONE_HOUR, // Outside window
      now - 2 * ONE_HOUR, // Outside window
      now - 10000, // Within window
    ];
    expect(isRateLimited(attempts, 3, ONE_HOUR, now)).toBe(false);
  });

  it('handles empty attempts', () => {
    expect(isRateLimited([], 3, ONE_HOUR, now)).toBe(false);
  });
});

describe('getRecentAttemptCount', () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = 1000000000;

  it('counts only recent attempts', () => {
    const attempts = [
      now - 2 * ONE_HOUR, // Outside
      now - 30 * 60 * 1000, // Inside
      now - 10 * 60 * 1000, // Inside
    ];
    expect(getRecentAttemptCount(attempts, ONE_HOUR, now)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(getRecentAttemptCount([], ONE_HOUR, now)).toBe(0);
  });

  it('returns 0 when all attempts are old', () => {
    const attempts = [now - 2 * ONE_HOUR, now - 3 * ONE_HOUR];
    expect(getRecentAttemptCount(attempts, ONE_HOUR, now)).toBe(0);
  });
});

describe('filterRecentAttempts', () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = 1000000000;

  it('filters to only recent attempts', () => {
    const old = now - 2 * ONE_HOUR;
    const recent1 = now - 30 * 60 * 1000;
    const recent2 = now - 10 * 60 * 1000;
    
    const attempts = [old, recent1, recent2];
    const result = filterRecentAttempts(attempts, ONE_HOUR, now);
    
    expect(result).toHaveLength(2);
    expect(result).toContain(recent1);
    expect(result).toContain(recent2);
    expect(result).not.toContain(old);
  });
});

// ==================== Verification Collection Tests ====================

describe('sortVerificationsByDate', () => {
  it('sorts verifications by date descending', () => {
    const verifications = [
      createMockVerification({ id: '1', created_at: '2024-01-01T00:00:00Z' }),
      createMockVerification({ id: '3', created_at: '2024-01-03T00:00:00Z' }),
      createMockVerification({ id: '2', created_at: '2024-01-02T00:00:00Z' }),
    ];

    const sorted = sortVerificationsByDate(verifications);
    
    expect(sorted[0].id).toBe('3');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('1');
  });

  it('does not mutate original array', () => {
    const verifications = [
      createMockVerification({ id: '1', created_at: '2024-01-01T00:00:00Z' }),
      createMockVerification({ id: '2', created_at: '2024-01-02T00:00:00Z' }),
    ];

    const originalFirst = verifications[0];
    sortVerificationsByDate(verifications);
    
    expect(verifications[0]).toBe(originalFirst);
  });

  it('handles empty array', () => {
    expect(sortVerificationsByDate([])).toEqual([]);
  });
});

describe('groupVerificationsByStatus', () => {
  it('groups verifications correctly', () => {
    const verifications = [
      createMockVerification({ id: '1', verification_status: 'pending' }),
      createMockVerification({ id: '2', verification_status: 'approved' }),
      createMockVerification({ id: '3', verification_status: 'pending' }),
      createMockVerification({ id: '4', verification_status: 'rejected' }),
    ];

    const grouped = groupVerificationsByStatus(verifications);
    
    expect(grouped.pending).toHaveLength(2);
    expect(grouped.approved).toHaveLength(1);
    expect(grouped.rejected).toHaveLength(1);
  });

  it('returns empty arrays for missing statuses', () => {
    const verifications = [
      createMockVerification({ verification_status: 'pending' }),
    ];

    const grouped = groupVerificationsByStatus(verifications);
    
    expect(grouped.approved).toHaveLength(0);
    expect(grouped.rejected).toHaveLength(0);
  });

  it('handles empty array', () => {
    const grouped = groupVerificationsByStatus([]);
    
    expect(grouped.pending).toHaveLength(0);
    expect(grouped.approved).toHaveLength(0);
    expect(grouped.rejected).toHaveLength(0);
  });
});

describe('countVerificationsByStatus', () => {
  it('counts verifications by status', () => {
    const verifications = [
      createMockVerification({ verification_status: 'pending' }),
      createMockVerification({ verification_status: 'approved' }),
      createMockVerification({ verification_status: 'pending' }),
      createMockVerification({ verification_status: 'rejected' }),
      createMockVerification({ verification_status: 'approved' }),
    ];

    const counts = countVerificationsByStatus(verifications);
    
    expect(counts.pending).toBe(2);
    expect(counts.approved).toBe(2);
    expect(counts.rejected).toBe(1);
  });
});

describe('isVerificationExpired', () => {
  it('returns false for recent verification', () => {
    const now = new Date('2024-01-15T00:00:00Z');
    const verification = createMockVerification({
      created_at: '2024-01-10T00:00:00Z', // 5 days ago
    });

    expect(isVerificationExpired(verification, 30, now)).toBe(false);
  });

  it('returns true for old verification', () => {
    const now = new Date('2024-03-15T00:00:00Z');
    const verification = createMockVerification({
      created_at: '2024-01-10T00:00:00Z', // 64 days ago
    });

    expect(isVerificationExpired(verification, 30, now)).toBe(true);
  });

  it('uses custom max age', () => {
    const now = new Date('2024-01-20T00:00:00Z');
    const verification = createMockVerification({
      created_at: '2024-01-10T00:00:00Z', // 10 days ago
    });

    expect(isVerificationExpired(verification, 7, now)).toBe(true);
    expect(isVerificationExpired(verification, 30, now)).toBe(false);
  });
});

describe('filterActiveVerifications', () => {
  it('filters out expired verifications', () => {
    const now = new Date('2024-03-01T00:00:00Z');
    const verifications = [
      createMockVerification({ id: '1', created_at: '2024-02-15T00:00:00Z' }), // 14 days - active
      createMockVerification({ id: '2', created_at: '2024-01-15T00:00:00Z' }), // 45 days - expired
      createMockVerification({ id: '3', created_at: '2024-02-20T00:00:00Z' }), // 9 days - active
    ];

    const active = filterActiveVerifications(verifications, 30, now);
    
    expect(active).toHaveLength(2);
    expect(active.find(v => v.id === '2')).toBeUndefined();
  });

  it('handles empty array', () => {
    expect(filterActiveVerifications([])).toEqual([]);
  });
});
