-- Username validation must only run when the username is actually being written.
--
-- `validate_profile_username_trigger` fired BEFORE INSERT OR UPDATE and called
-- validate_profile_before_insert(), which validates NEW.anonymous_username
-- unconditionally. So ANY update to a profile row re-validated the username the
-- row already had. A member whose codename predates the current rules (or that
-- the rules were later tightened around) could no longer change their city,
-- answer the referral prompt, or edit anything else on their profile — every
-- write failed with "Invalid username", pointing at a field they weren't
-- touching.
--
-- Updates are already covered correctly by validate_profile_before_update(),
-- which only validates when NEW.anonymous_username IS DISTINCT FROM OLD. This
-- narrows the insert-time validator to INSERT, its intended scope. No change to
-- what a username is allowed to be.
drop trigger if exists validate_profile_username_trigger on public.profiles;

create trigger validate_profile_username_trigger
  before insert on public.profiles
  for each row execute function public.validate_profile_before_insert();
