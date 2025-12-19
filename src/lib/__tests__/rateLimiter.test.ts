import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for the RateLimiter class
 * We recreate the class here to test it in isolation
 */

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  getRemainingAttempts(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - recentAttempts.length);
  }
  
  getTimeUntilReset(key: string, windowMs: number): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    const resetTime = oldestAttempt + windowMs;
    return Math.max(0, resetTime - now);
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const ONE_HOUR = 60 * 60 * 1000;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('isAllowed', () => {
    it('allows first attempt', () => {
      expect(rateLimiter.isAllowed('user1', 3, ONE_HOUR)).toBe(true);
    });

    it('allows attempts under limit', () => {
      expect(rateLimiter.isAllowed('user1', 3, ONE_HOUR)).toBe(true);
      expect(rateLimiter.isAllowed('user1', 3, ONE_HOUR)).toBe(true);
      expect(rateLimiter.isAllowed('user1', 3, ONE_HOUR)).toBe(true);
    });

    it('blocks attempts at limit', () => {
      rateLimiter.isAllowed('user1', 3, ONE_HOUR);
      rateLimiter.isAllowed('user1', 3, ONE_HOUR);
      rateLimiter.isAllowed('user1', 3, ONE_HOUR);
      expect(rateLimiter.isAllowed('user1', 3, ONE_HOUR)).toBe(false);
    });

    it('tracks different users separately', () => {
      // User 1 hits limit
      rateLimiter.isAllowed('user1', 2, ONE_HOUR);
      rateLimiter.isAllowed('user1', 2, ONE_HOUR);
      expect(rateLimiter.isAllowed('user1', 2, ONE_HOUR)).toBe(false);

      // User 2 should still be allowed
      expect(rateLimiter.isAllowed('user2', 2, ONE_HOUR)).toBe(true);
    });

    it('tracks different actions separately', () => {
      // Fill up 'login' action
      rateLimiter.isAllowed('user1:login', 2, ONE_HOUR);
      rateLimiter.isAllowed('user1:login', 2, ONE_HOUR);
      expect(rateLimiter.isAllowed('user1:login', 2, ONE_HOUR)).toBe(false);

      // 'verification' action should still work
      expect(rateLimiter.isAllowed('user1:verification', 2, ONE_HOUR)).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears attempts for a key', () => {
      rateLimiter.isAllowed('user1', 1, ONE_HOUR);
      expect(rateLimiter.isAllowed('user1', 1, ONE_HOUR)).toBe(false);

      rateLimiter.reset('user1');
      expect(rateLimiter.isAllowed('user1', 1, ONE_HOUR)).toBe(true);
    });

    it('only resets specified key', () => {
      rateLimiter.isAllowed('user1', 1, ONE_HOUR);
      rateLimiter.isAllowed('user2', 1, ONE_HOUR);

      rateLimiter.reset('user1');

      expect(rateLimiter.isAllowed('user1', 1, ONE_HOUR)).toBe(true);
      expect(rateLimiter.isAllowed('user2', 1, ONE_HOUR)).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('returns max attempts when no attempts made', () => {
      expect(rateLimiter.getRemainingAttempts('user1', 5, ONE_HOUR)).toBe(5);
    });

    it('decrements correctly', () => {
      rateLimiter.isAllowed('user1', 5, ONE_HOUR);
      expect(rateLimiter.getRemainingAttempts('user1', 5, ONE_HOUR)).toBe(4);

      rateLimiter.isAllowed('user1', 5, ONE_HOUR);
      expect(rateLimiter.getRemainingAttempts('user1', 5, ONE_HOUR)).toBe(3);
    });

    it('returns 0 when exhausted', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('user1', 5, ONE_HOUR);
      }
      expect(rateLimiter.getRemainingAttempts('user1', 5, ONE_HOUR)).toBe(0);
    });
  });

  describe('getTimeUntilReset', () => {
    it('returns 0 when no attempts', () => {
      expect(rateLimiter.getTimeUntilReset('user1', ONE_HOUR)).toBe(0);
    });

    it('returns positive time after attempt', () => {
      rateLimiter.isAllowed('user1', 5, ONE_HOUR);
      const timeUntilReset = rateLimiter.getTimeUntilReset('user1', ONE_HOUR);
      
      // Should be close to ONE_HOUR (within a few ms)
      expect(timeUntilReset).toBeGreaterThan(ONE_HOUR - 1000);
      expect(timeUntilReset).toBeLessThanOrEqual(ONE_HOUR);
    });
  });
});

// ==================== Verification Rate Limit Scenario Tests ====================

describe('Verification Rate Limit Scenarios', () => {
  let rateLimiter: RateLimiter;
  const ONE_HOUR = 60 * 60 * 1000;
  const MAX_VERIFICATION_ATTEMPTS = 3;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it('allows 3 verification attempts per hour', () => {
    const key = 'verification:user-123';
    
    expect(rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(true);
    expect(rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(true);
    expect(rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(true);
    expect(rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(false);
  });

  it('blocks spammy verification submissions', () => {
    const key = 'verification:spammer-456';
    
    // Simulate rapid-fire submissions
    for (let i = 0; i < MAX_VERIFICATION_ATTEMPTS; i++) {
      rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR);
    }
    
    // 4th attempt should be blocked
    expect(rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(false);
    expect(rateLimiter.getRemainingAttempts(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR)).toBe(0);
  });

  it('provides meaningful time until reset', () => {
    const key = 'verification:user-789';
    
    rateLimiter.isAllowed(key, MAX_VERIFICATION_ATTEMPTS, ONE_HOUR);
    
    const timeUntilReset = rateLimiter.getTimeUntilReset(key, ONE_HOUR);
    const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));
    
    expect(minutesUntilReset).toBeGreaterThan(55);
    expect(minutesUntilReset).toBeLessThanOrEqual(60);
  });
});
