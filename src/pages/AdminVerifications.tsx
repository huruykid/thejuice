import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApproveUser } from '@/hooks/useApproveUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Search, Filter, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationWithProfile {
  id: string;
  user_id: string;
  selfie_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes: string | null;
  profile: {
    anonymous_username: string;
    date_of_birth: string;
    city: string;
    relationship_status: string;
  } | null;
}

const AdminVerifications = () => {
  const approveUser = useApproveUser();
  // Admin email check
  const ADMIN_EMAILS = ['huruykid@gmail.com', 'huruydesigns@gmail.com'];
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();

  // Check admin access
  useEffect(() => {
    if (!authLoading && user) {
      const isAdmin = ADMIN_EMAILS.includes(user.email || '');
      if (!isAdmin) {
        navigate('/not-found');
        return;
      }
    }
  }, [user, authLoading, navigate]);

  // Fetch verifications with profiles
  const { data: verifications, isLoading } = useQuery({
    queryKey: ['admin-verifications', filter],
    queryFn: async () => {
      // First get verifications
      let verificationQuery = supabase
        .from('user_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        verificationQuery = verificationQuery.eq('verification_status', filter);
      }

      const { data: verificationsData, error: verificationError } = await verificationQuery;
      if (verificationError) throw verificationError;

      // Then get profiles for each verification
      const verificationsWithProfiles: VerificationWithProfile[] = [];
      
      for (const verification of verificationsData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('anonymous_username, date_of_birth, city, relationship_status')
          .eq('user_id', verification.user_id)
          .single();

        verificationsWithProfiles.push({
          ...verification,
          verification_status: verification.verification_status as 'pending' | 'approved' | 'rejected',
          profile: profileData
        });
      }

      return verificationsWithProfiles;
    },
  });

  // Update verification status
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setSelectedVerification(null);
      setNotes('');
      // Toast is handled in the useApproveUser hook or will show default success
      if (!approveUser.isSuccess) {
        toast.success('Verification status updated successfully');
      }
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
        notes: notes || undefined
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
        notes
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredVerifications = verifications?.filter(verification =>
    verification.profile?.anonymous_username.toLowerCase().includes(search.toLowerCase()) ||
    verification.profile?.city.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (redirect will happen in useEffect)
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Admin Verifications</h1>
          <p className="text-muted-foreground">Review and approve user verifications</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Verifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVerifications.map((verification) => (
            <Card key={verification.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{verification.profile?.anonymous_username || 'Unknown'}</CardTitle>
                    <CardDescription>
                      {verification.profile?.city} • Age {verification.profile?.date_of_birth ? calculateAge(verification.profile.date_of_birth) : 'Unknown'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(verification.verification_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verification.selfie_url && (
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={verification.selfie_url} 
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> {verification.profile?.relationship_status}</p>
                  <p><strong>Submitted:</strong> {new Date(verification.created_at).toLocaleDateString()}</p>
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
                {selectedVerification.selfie_url && (
                  <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedVerification.selfie_url} 
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerifications;