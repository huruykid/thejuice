import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, UserPlus, Search, PenLine } from "lucide-react";

interface Member {
  user_id: string;
  email: string | null;
  anonymous_username: string | null;
  city: string | null;
  created_at: string;
  verification_status: "pending" | "approved" | "rejected" | null;
  has_post: boolean;
}

type Filter = "all" | "none" | "pending" | "approved" | "rejected";

const AdminMembers = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_list_members");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const filtered = useMemo(() => {
    let rows = members ?? [];
    if (filter === "none") rows = rows.filter((m) => !m.verification_status);
    else if (filter !== "all") rows = rows.filter((m) => m.verification_status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (m) =>
          (m.email ?? "").toLowerCase().includes(q) ||
          (m.anonymous_username ?? "").toLowerCase().includes(q) ||
          (m.city ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [members, filter, search]);

  if (authLoading || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  if (!user || !isAdmin) return null;

  const statusBadge = (s: Member["verification_status"]) => {
    if (s === "approved")
      return <Badge variant="outline" className="text-success border-success"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    if (s === "pending")
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    if (s === "rejected")
      return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-600"><UserPlus className="w-3 h-3 mr-1" />No verification yet</Badge>;
  };

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-sm text-muted-foreground">
              Every signup — including people who haven't started verification yet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email / username / city"
                className="pl-8 w-64"
              />
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="none">No verification yet</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} member{filtered.length === 1 ? "" : "s"}</p>

        <div className="space-y-2">
          {filtered.map((m) => (
            <Card key={m.user_id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.anonymous_username || "(no username)"}
                      {m.has_post && (
                        <span className="ml-2 inline-flex items-center text-[11px] font-normal text-primary">
                          <PenLine className="w-3 h-3 mr-0.5" />posted
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.email ?? "(no email)"}{m.city ? ` · ${m.city}` : ""} · joined {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {statusBadge(m.verification_status)}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground text-sm">
                No members match this view.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;
