import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useApproveUser } from '@/hooks/useApproveUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Search, Filter, Mail, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

/** Returns a human-readable wait time and urgency level for triage. */
const getWaitInfo = (createdAt: string): { label: string; urgent: boolean; critical: boolean } => {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (hours < 1) return { label: `${Math.round(hours * 60)}m`, urgent: false, critical: false };
  if (hours < 24) return { label: `${Math.round(hours)}h`, urgent: false, critical: false };
  if (hours < 48) return { label: `${Math.round(hours / 24)}d`, urgent: true, critical: false };
  return { label: `${Math.round(hours / 24)}d`, urgent: true, critical: true };
};

interface VerificationWithProfile {
  id: string;
  user_id: string;
  selfie_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes: string | null;
  selfie_deleted_at: string | null;
  deleted_by: string | null;
  profile: {
    anonymous_username: string;
    date_of_birth: string;
    city: string;
    relationship_status: string;
  } | null;
  signedUrl?: string;
}

const AdminVerifications = () => {
  const approveUser = useApproveUser();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [search, setSearch] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VerificationWithProfile | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

  const queryClient = useQueryClient();

  // Check admin access
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (!isAdmin) {
        navigate('/app');
        return;
      }
    }
  }, [user, authLoading, roleLoading, isAdmin, navigate]);

  // Clear selection when filter changes — selection only applies to pending.
  useEffect(() => {
    setSelected(new Set());
  }, [filter]);

  // Fetch verifications with profiles
  const { data: verifications, isLoading } = useQuery({
    queryKey: ['admin-verifications', filter, sort],
    queryFn: async () => {
      // First get verifications
      let verificationQuery = supabase
        .from('user_verifications')
        .select('*')
        .order('created_at', { ascending: sort === 'oldest' });

      if (filter !== 'all') {
        verificationQuery = verificationQuery.eq('verification_status', filter);
      }

      const { data: verificationsData, error: verificationError } = await verificationQuery;
      if (verificationError) throw verificationError;

      const verifications = verificationsData || [];

      // Batch-fetch all profiles in a single query instead of N individual fetches.
      const userIds = verifications.map((v) => v.user_id);
      const { data: profilesData } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, anonymous_username, date_of_birth, city, relationship_status')
            .in('user_id', userIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profilesData ?? []).map((p: any) => [p.user_id, p]));

      // Generate all signed URLs in parallel with Promise.all instead of serially.
      const getFilePath = (url: string) => {
        if (!url.startsWith('http')) return url;
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/');
          const bucketIndex = parts.indexOf('verification-selfies');
          return bucketIndex !== -1 ? parts.slice(bucketIndex + 1).join('/') : url;
        } catch {
          return url;
        }
      };

      const signedUrls = await Promise.all(
        verifications.map(async (v) => {
          if (!v.selfie_url) return undefined;
          try {
            const { data } = await supabase.storage
              .from('verification-selfies')
              .createSignedUrl(getFilePath(v.selfie_url), 3600);
            return data?.signedUrl;
          } catch {
            return undefined;
          }
        })
      );

      const verificationsWithProfiles: VerificationWithProfile[] = verifications.map((v, i) => ({
        ...v,
        verification_status: v.verification_status as 'pending' | 'approved' | 'rejected',
        profile: profileMap[v.user_id] ?? null,
        signedUrl: signedUrls[i],
      }));

      return verificationsWithProfiles;
    },
  });

  // Update verification status (used for rejections only — approvals go through approveUser)
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { error } = await supabase
        .from('user_verifications')
        .update({
          verification_status: status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      setSelectedVerification(null);
      setNotes('');
      toast.success(status === 'approved' ? 'Verification approved' : 'Verification rejected');
    },
    onError: (error) => {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    },
  });

  const handleApprove = async () => {
    if (!selectedVerification) return;
    
    setIsProcessing(true);
    try {
      // Get user email through edge function that has proper permissions
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-email', {
        body: { userId: selectedVerification.user_id }
      });
      
      if (emailError || !emailResponse?.email) {
        toast.error('Failed to get user email for notification');
        return;
      }
      
      await approveUser.mutateAsync({
        userId: selectedVerification.user_id,
        email: emailResponse.email,
        username: selectedVerification.profile?.anonymous_username,
        notes: notes || undefined,
        verificationId: selectedVerification.id,
        selfieUrl: selectedVerification.selfie_url || undefined
      });
      
      // Reset form
      setSelectedVerification(null);
      setNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;

    setIsProcessing(true);
    try {
      await updateVerificationMutation.mutateAsync({
        id: selectedVerification.id,
        status: 'rejected',
        notes,
      });

      // Fire-and-forget rejection email (don't block UX on email failure).
      try {
        const { data: emailResponse, error: emailError } =
          await supabase.functions.invoke('get-user-email', {
            body: { userId: selectedVerification.user_id },
          });
        if (!emailError && emailResponse?.email) {
          const { error: sendErr } = await supabase.functions.invoke(
            'send-rejection-email',
            {
              body: {
                email: emailResponse.email,
                username: selectedVerification.profile?.anonymous_username,
                reason: notes || undefined,
              },
            }
          );
          if (sendErr) console.warn('Rejection email failed:', sendErr);
        }
      } catch (e) {
        console.warn('Rejection email pipeline failed:', e);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = () => {
    if (!selectedVerification) return;
    setDeleteConfirm(selectedVerification);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm) return;
    const username = deleteConfirm.profile?.anonymous_username || 'this user';
    setDeleteConfirm(null);
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: deleteConfirm.user_id, reason: notes || undefined },
      });
      if (error) throw error;
      toast.success(`Deleted ${username}`);
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      setSelectedVerification(null);
      setNotes('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredVerifications = (verifications?.filter(verification =>
    verification.profile?.anonymous_username?.toLowerCase().includes(search.toLowerCase()) ||
    verification.profile?.city?.toLowerCase().includes(search.toLowerCase())
  ) || []);

  const selectablePending = filteredVerifications.filter(
    (v) => v.verification_status === 'pending'
  );
  const allSelected =
    selectablePending.length > 0 && selectablePending.every((v) => selected.has(v.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectablePending.map((v) => v.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    const targets = selectablePending.filter((v) => selected.has(v.id));
    if (targets.length === 0) return;
    const ok = window.confirm(
      `Approve ${targets.length} user${targets.length === 1 ? '' : 's'} and email them?`
    );
    if (!ok) return;
    setBulkProgress({ done: 0, total: targets.length });
    setBulkAction('approve');
    let success = 0;
    let failed = 0;
    for (const v of targets) {
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          'get-user-email',
          { body: { userId: v.user_id } }
        );
        if (emailError || !emailResponse?.email) {
          throw new Error('Could not fetch email');
        }
        await approveUser.mutateAsync({
          userId: v.user_id,
          email: emailResponse.email,
          username: v.profile?.anonymous_username,
          verificationId: v.id,
          selfieUrl: v.selfie_url || undefined,
        });
        success++;
      } catch (err) {
        console.error('Bulk approve failed for', v.id, err);
        failed++;
      } finally {
        setBulkProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    }
    setBulkProgress(null);
    setBulkAction(null);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    if (failed === 0) toast.success(`Approved ${success} user${success === 1 ? '' : 's'}`);
    else toast.error(`Approved ${success}, failed ${failed}`);
  };

  const handleBulkReject = async () => {
    const targets = selectablePending.filter((v) => selected.has(v.id));
    if (targets.length === 0) return;
    const reason = bulkRejectReason.trim();
    setBulkRejectOpen(false);
    setBulkProgress({ done: 0, total: targets.length });
    setBulkAction('reject');
    let success = 0;
    let failed = 0;
    for (const v of targets) {
      try {
        const { error: updErr } = await supabase
          .from('user_verifications')
          .update({
            verification_status: 'rejected',
            notes: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', v.id);
        if (updErr) throw updErr;

        // Fire-and-forget rejection email (don't block on email failure).
        try {
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
            'get-user-email',
            { body: { userId: v.user_id } }
          );
          if (!emailError && emailResponse?.email) {
            await supabase.functions.invoke('send-rejection-email', {
              body: {
                email: emailResponse.email,
                username: v.profile?.anonymous_username,
                reason: reason || undefined,
              },
            });
          }
        } catch (e) {
          console.warn('Rejection email failed for', v.id, e);
        }
        success++;
      } catch (err) {
        console.error('Bulk reject failed for', v.id, err);
        failed++;
      } finally {
        setBulkProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    }
    setBulkProgress(null);
    setBulkAction(null);
    setSelected(new Set());
    setBulkRejectReason('');
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    if (failed === 0) toast.success(`Rejected ${success} user${success === 1 ? '' : 's'}`);
    else toast.error(`Rejected ${success}, failed ${failed}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Show loading while checking auth or fetching data
  if (authLoading || isLoading) {
    return (
      <div className="bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (redirect will happen in useEffect)
  if (!user || (!isAdmin && !roleLoading)) {
    return null;
  }

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Verifications</h1>
          <p className="text-sm text-muted-foreground">Review and approve user verifications.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by username or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filter">Filter by Status</Label>
                <Select value={filter} onValueChange={(value: typeof filter) => setFilter(value)}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sort">Sort</Label>
                <Select value={sort} onValueChange={(value: 'newest' | 'oldest') => setSort(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verifications Grid */}
        {filter === 'pending' && selectablePending.length > 0 && (
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border flex items-center gap-3 flex-wrap rounded-md">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span>Select all ({selectablePending.length})</span>
            </label>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {bulkProgress
                ? `${bulkAction === 'reject' ? 'Rejecting' : 'Approving'} ${bulkProgress.done}/${bulkProgress.total}…`
                : `${selected.size} selected`}
            </span>
            <Button
              size="sm"
              disabled={selected.size === 0 || !!bulkProgress}
              onClick={handleBulkApprove}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={selected.size === 0 || !!bulkProgress}
              onClick={() => setBulkRejectOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={selected.size === 0 || !!bulkProgress}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVerifications.map((verification) => (
            <Card key={verification.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {verification.verification_status === 'pending' && (
                      <Checkbox
                        className="mt-1"
                        checked={selected.has(verification.id)}
                        onCheckedChange={() => toggleOne(verification.id)}
                        aria-label="Select for bulk approval"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{verification.profile?.anonymous_username || 'Unknown'}</CardTitle>
                      <CardDescription>
                        {verification.profile?.city} • Age {verification.profile?.date_of_birth ? calculateAge(verification.profile.date_of_birth) : 'Unknown'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(verification.verification_status)}
                    {verification.verification_status === 'pending' && (() => {
                      const { label, urgent, critical } = getWaitInfo(verification.created_at);
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                          critical ? 'text-red-700 bg-red-50' : urgent ? 'text-amber-700 bg-amber-50' : 'text-muted-foreground'
                        }`}>
                          {critical && <AlertTriangle className="w-3 h-3" />}
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verification.selfie_deleted_at ? (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                    <div className="text-center space-y-2">
                      <Shield className="w-8 h-8 mx-auto text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Image Deleted</p>
                      <p className="text-xs text-muted-foreground">Privacy Protected</p>
                    </div>
                  </div>
                ) : (verification.signedUrl || verification.selfie_url) ? (
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={verification.signedUrl || verification.selfie_url} 
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load image:', verification.selfie_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
                
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> {verification.profile?.relationship_status}</p>
                  <p><strong>Submitted:</strong> {new Date(verification.created_at).toLocaleDateString()}</p>
                  {verification.selfie_deleted_at && (
                    <p className="text-green-600 text-xs flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      <strong>Selfie deleted:</strong> {new Date(verification.selfie_deleted_at).toLocaleDateString()}
                    </p>
                  )}
                  {verification.notes && (
                    <p className="text-muted-foreground"><strong>Notes:</strong> {verification.notes}</p>
                  )}
                </div>

                {verification.verification_status === 'pending' && (
                  <Button
                    onClick={() => {
                      setSelectedVerification(verification);
                      setNotes(verification.notes || '');
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVerifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No verifications found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete{" "}
                <strong>{deleteConfirm?.profile?.anonymous_username ?? "this user"}</strong> and all
                their data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDeleteUser}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk reject confirmation dialog */}
        <AlertDialog
          open={bulkRejectOpen}
          onOpenChange={(open) => { if (!open) setBulkRejectOpen(false); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Reject {selected.size} user{selected.size === 1 ? '' : 's'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Each selected user's verification will be marked as rejected and they'll
                receive a rejection email. Add an optional reason to include in the email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bulk-reject-reason">Reason (optional)</Label>
              <Textarea
                id="bulk-reject-reason"
                placeholder="e.g. Selfie didn't match our verification requirements..."
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleBulkReject}
              >
                Reject &amp; email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Review Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
              <CardHeader>
                <CardTitle>Review Verification</CardTitle>
                <CardDescription>
                  {selectedVerification.profile?.anonymous_username} from {selectedVerification.profile?.city}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedVerification.selfie_deleted_at ? (
                  <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                    <div className="text-center space-y-3">
                      <Shield className="w-12 h-12 mx-auto text-green-600" />
                      <div>
                        <p className="text-lg text-green-600 font-medium">Image Deleted</p>
                        <p className="text-sm text-muted-foreground">Privacy Protected</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted: {new Date(selectedVerification.selfie_deleted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (selectedVerification.signedUrl || selectedVerification.selfie_url) ? (
                  <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedVerification.signedUrl || selectedVerification.selfie_url} 
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load image:', selectedVerification.selfie_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Username:</strong> {selectedVerification.profile?.anonymous_username}
                  </div>
                  <div>
                    <strong>Age:</strong> {selectedVerification.profile?.date_of_birth ? calculateAge(selectedVerification.profile.date_of_birth) : 'Unknown'}
                  </div>
                  <div>
                    <strong>City:</strong> {selectedVerification.profile?.city}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedVerification.profile?.relationship_status}
                  </div>
                  <div className="col-span-2">
                    <strong>Submitted:</strong> {new Date(selectedVerification.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add any notes about this verification..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing || approveUser.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isProcessing || approveUser.isPending ? 'Approving...' : 'Approve & Email'}
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedVerification(null);
                      setNotes('');
                    }}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="pt-3 mt-3 border-t border-border">
                  <Button
                    onClick={handleDeleteUser}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Permanently delete user
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerifications;