-- Prevent forged audit entries. Previously any authenticated user could INSERT
-- into security_audit_logs (including user_id = NULL "system" rows), so the audit
-- trail could be polluted or spoofed. Legitimate writes all go through
-- SECURITY DEFINER RPCs (log_security_event, detect_suspicious_activity) which
-- bypass RLS, so removing the open policy breaks nothing while closing the vector.
drop policy if exists "Users can insert their own audit logs" on public.security_audit_logs;

-- Belt-and-suspenders: explicit deny for direct client inserts. Service role and
-- SECURITY DEFINER functions are unaffected — they bypass RLS.
create policy "No direct client inserts into audit logs"
  on public.security_audit_logs for insert to authenticated, anon
  with check (false);
