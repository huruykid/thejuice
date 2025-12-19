/**
 * Pure business logic for user verification system
 * This module contains no side effects and can be tested without a browser
 */

// ==================== Types ====================

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface UserVerification {
  id: string;
  user_id: string;
  selfie_url: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  notes: string | null;
  selfie_deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface VerificationResult {
  hasVerification: boolean;
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
}

export interface VerificationStatusDetermination {
  finalStatus: VerificationStatus;
  reason: string;
}

export interface ApprovalData {
  userId: string;
  email: string;
  username?: string;
  notes?: string;
  verificationId?: string;
  selfieUrl?: string;
}

export interface ApprovalValidationResult {
  isValid: boolean;
  errors: string[];
}

// ==================== Pure Functions ====================

/**
 * Determines the verification result from a verification record
 */
export function getVerificationResult(verification: UserVerification | null): VerificationResult {
  return {
    hasVerification: verification !== null,
    isVerified: verification?.verification_status === 'approved',
    isPending: verification?.verification_status === 'pending',
    isRejected: verification?.verification_status === 'rejected',
  };
}

/**
 * Determines the final verification status based on user role
 * Admins are auto-approved, others go to pending
 */
export function determineVerificationStatus(
  isAdmin: boolean,
  requestedStatus?: VerificationStatus
): VerificationStatusDetermination {
  if (isAdmin) {
    return {
      finalStatus: 'approved',
      reason: 'Admin accounts are auto-approved',
    };
  }

  return {
    finalStatus: requestedStatus || 'pending',
    reason: requestedStatus 
      ? `Requested status: ${requestedStatus}` 
      : 'Default status for non-admin users',
  };
}

/**
 * Validates approval data before processing
 */
export function validateApprovalData(data: ApprovalData): ApprovalValidationResult {
  const errors: string[] = [];

  if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
    errors.push('User ID is required');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.username !== undefined && typeof data.username !== 'string') {
    errors.push('Username must be a string');
  }

  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.push('Notes must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Basic email format validation
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Checks if selfie deletion should be attempted
 */
export function shouldDeleteSelfie(verificationId?: string, selfieUrl?: string): boolean {
  return Boolean(verificationId && selfieUrl);
}

/**
 * Extracts file path from a Supabase storage URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Supabase storage URLs typically have format:
    // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    // or https://xxx.supabase.co/storage/v1/object/sign/bucket-name/path/to/file?token=xxx
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket name index (after 'public' or 'sign')
    const publicIndex = pathParts.indexOf('public');
    const signIndex = pathParts.indexOf('sign');
    const startIndex = Math.max(publicIndex, signIndex);
    
    if (startIndex === -1) return null;
    
    // Extract path after bucket indicator and bucket name
    const filePath = pathParts.slice(startIndex + 2).join('/');
    return filePath || null;
  } catch {
    return null;
  }
}

/**
 * Formats verification count for display
 */
export function formatVerificationCount(count: number): string {
  if (count === 0) return 'No pending verifications';
  if (count === 1) return '1 pending verification';
  return `${count} pending verifications`;
}

/**
 * Calculates time until rate limit reset
 */
export function calculateTimeUntilReset(
  attempts: number[],
  windowMs: number,
  now: number = Date.now()
): number {
  if (attempts.length === 0) return 0;
  
  const oldestAttempt = Math.min(...attempts);
  const resetTime = oldestAttempt + windowMs;
  return Math.max(0, resetTime - now);
}

/**
 * Formats milliseconds to human-readable time
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'now';
  
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  
  const minutes = Math.ceil(ms / (60 * 1000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Checks if rate limit should block the action
 */
export function isRateLimited(
  attempts: number[],
  maxAttempts: number,
  windowMs: number,
  now: number = Date.now()
): boolean {
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  return recentAttempts.length >= maxAttempts;
}

/**
 * Gets the count of recent attempts within the window
 */
export function getRecentAttemptCount(
  attempts: number[],
  windowMs: number,
  now: number = Date.now()
): number {
  return attempts.filter(timestamp => now - timestamp < windowMs).length;
}

/**
 * Filters and returns recent attempts within window
 */
export function filterRecentAttempts(
  attempts: number[],
  windowMs: number,
  now: number = Date.now()
): number[] {
  return attempts.filter(timestamp => now - timestamp < windowMs);
}

/**
 * Sorts verifications by date, most recent first
 */
export function sortVerificationsByDate(
  verifications: UserVerification[]
): UserVerification[] {
  return [...verifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Groups verifications by status
 */
export function groupVerificationsByStatus(
  verifications: UserVerification[]
): Record<VerificationStatus, UserVerification[]> {
  return verifications.reduce(
    (acc, verification) => {
      acc[verification.verification_status].push(verification);
      return acc;
    },
    {
      pending: [] as UserVerification[],
      approved: [] as UserVerification[],
      rejected: [] as UserVerification[],
    }
  );
}

/**
 * Counts verifications by status
 */
export function countVerificationsByStatus(
  verifications: UserVerification[]
): Record<VerificationStatus, number> {
  const grouped = groupVerificationsByStatus(verifications);
  return {
    pending: grouped.pending.length,
    approved: grouped.approved.length,
    rejected: grouped.rejected.length,
  };
}

/**
 * Checks if a verification has expired based on age
 */
export function isVerificationExpired(
  verification: UserVerification,
  maxAgeDays: number = 30,
  now: Date = new Date()
): boolean {
  const createdAt = new Date(verification.created_at);
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  return now.getTime() - createdAt.getTime() > maxAgeMs;
}

/**
 * Filters out expired verifications
 */
export function filterActiveVerifications(
  verifications: UserVerification[],
  maxAgeDays: number = 30,
  now: Date = new Date()
): UserVerification[] {
  return verifications.filter(v => !isVerificationExpired(v, maxAgeDays, now));
}
