import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealIsAdmin } from "@/hooks/useRealIsAdmin";

/**
 * Admin status of the REAL session, read straight from Supabase rather than through
 * useAuth().
 *
 * useAuth() deliberately reports `user === null` while an admin previews the
 * logged-out visitor experience. Anything that has to keep working *during* that
 * preview — above all the control that turns it back off — cannot ask useAuth() who
 * it is talking to, or it would lock the admin out of their own escape hatch.
 */
export const useRealAdmin = () => {
  const [realUserId, setRealUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setRealUserId(data.session?.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setRealUserId(session?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return useRealIsAdmin(realUserId);
};
