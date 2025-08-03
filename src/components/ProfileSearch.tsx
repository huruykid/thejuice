import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Phone, User, MapPin } from 'lucide-react';
import { useProfileSearch } from '@/hooks/useProfileSearch';
import { useDebounce } from '@/hooks/useDebounce';

interface ProfileSearchProps {
  onProfileSelect?: (profileId: string, username: string) => void;
  placeholder?: string;
  className?: string;
}

const ProfileSearch = ({ 
  onProfileSelect, 
  placeholder = "Search by @username or phone number",
  className = ""
}: ProfileSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isSearching, searchResults, performSearch, clearResults } = useProfileSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 3) {
      performSearch(debouncedSearchQuery);
    } else {
      clearResults();
    }
  }, [debouncedSearchQuery]);

  const handleProfileSelect = (profileId: string, username: string) => {
    onProfileSelect?.(profileId, username);
    setSearchQuery('');
    clearResults();
  };

  const formatPhoneDisplay = (phone: string | null): string => {
    if (!phone) return '';
    // Display phone number in a readable format
    if (phone.startsWith('+1') && phone.length === 12) {
      const digits = phone.substring(2);
      return `+1 (${digits.substring(0,3)}) ${digits.substring(3,6)}-${digits.substring(6)}`;
    }
    return phone;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.profile.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleProfileSelect(result.profile.id, result.profile.anonymous_username)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {result.profile.anonymous_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">@{result.profile.anonymous_username}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {result.matchType === 'phone' ? (
                          <Phone className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span>
                          {result.matchType === 'phone' ? 'Phone match' : 'Username match'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {result.profile.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{result.profile.city}</span>
                        </div>
                      )}
                      {result.matchType === 'phone' && result.profile.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhoneDisplay(result.profile.phone_number)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchQuery.trim().length >= 3 && searchResults.length === 0 && !isSearching && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50">
          <CardContent className="p-4 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8" />
              <div>
                <p className="font-medium">No profiles found</p>
                <p className="text-sm">
                  Try searching with @username or full phone number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileSearch;