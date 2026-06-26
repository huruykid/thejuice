// The invite system was removed (unused + insecure — it bypassed the rate-limited
// generator and was not wired into the live onboarding). This stub remains only so any
// stray import keeps compiling; it performs no database calls. If a referral/invite loop
// is wanted later, build it fresh and securely (server-issued codes only).

export interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
}

export interface InviteStats {
  invites_remaining: number;
  invites_sent: number;
  invites_used: number;
}

export const useInvites = () => ({
  inviteCodes: [] as InviteCode[],
  stats: { invites_remaining: 0, invites_sent: 0, invites_used: 0 } as InviteStats,
  isLoading: false,
  generateInviteCode: async () => {
    throw new Error('Invites are disabled.');
  },
  isGenerating: false,
});
