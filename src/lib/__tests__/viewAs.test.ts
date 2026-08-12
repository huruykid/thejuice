import { describe, it, expect } from 'vitest';
import { activePreview } from '@/lib/viewAs';
import type { ViewAsMode } from '@/contexts/ViewAsContext';

const MODES: Exclude<ViewAsMode, null>[] = [
  'logged_out',
  'unverified_user',
  'verified_user',
];

/**
 * The stored preview mode is a plain sessionStorage string, so a non-admin can set
 * one by hand. These tests pin the gate that makes that pointless — every consumer
 * (useAuth, useUserRole, useVerification) reads the mode through this function.
 */
describe('activePreview', () => {
  it('ignores every stored mode when the viewer is not a real admin', () => {
    for (const mode of MODES) {
      expect(activePreview(false, mode)).toBeNull();
    }
  });

  it('honors the mode for a real admin', () => {
    for (const mode of MODES) {
      expect(activePreview(true, mode)).toBe(mode);
    }
  });

  it('is null when an admin is not previewing anything', () => {
    expect(activePreview(true, null)).toBeNull();
  });

  it('never invents a preview out of nothing', () => {
    expect(activePreview(false, null)).toBeNull();
  });
});
