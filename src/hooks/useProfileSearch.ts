import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parsePhoneNumber } from 'react-phone-number-input';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  anonymous_username: string;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  date_of_birth: string | null;
  city: string | null;
  relationship_status: string | null;
}

interface SearchResult {
  profile: Profile;
  matchType: 'username' | 'phone';
}

export const useProfileSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const normalizePhoneNumber = (input: string): string | null => {
    try {
      // Remove any @ symbols if user includes them
      const cleanInput = input.replace('@', '').trim();
      
      // Must start with + for international format
      if (!cleanInput.startsWith('+')) {
        return null;
      }
      
      // Try to parse as phone number - must be valid international format
      const phoneNumber = parsePhoneNumber(cleanInput);
      
      if (phoneNumber && phoneNumber.isValid()) {
        // Return in E.164 format
        return phoneNumber.format('E.164');
      }
      
      return null;
    } catch (error) {
      console.error('Phone number parsing error:', error);
      return null;
    }
  };

  const isPhoneNumberInput = (input: string): boolean => {
    const cleanInput = input.trim();
    // Must start with + and contain mostly digits
    return cleanInput.startsWith('+') && /^\+[\d\s\-\(\)\.]{7,}$/.test(cleanInput);
  };

  const searchProfiles = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 3) {
      return [];
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      const trimmedQuery = query.trim();
      
      // Determine if this looks like a phone number or username
      const isPhoneQuery = isPhoneNumberInput(trimmedQuery);
      
      if (isPhoneQuery) {
        // Search by phone number
        const normalizedPhone = normalizePhoneNumber(trimmedQuery);
        
        if (normalizedPhone) {
          // Select only the columns the UI needs — avoids sending PII like
          // date_of_birth and relationship_status to the client unnecessarily.
          const { data: phoneResults, error: phoneError } = await supabase
            .from('profiles')
            .select('id, user_id, anonymous_username, city')
            .eq('phone_number', normalizedPhone);

          if (phoneError) {
            console.error('Phone search error:', phoneError);
          } else if (phoneResults && phoneResults.length > 0) {
            phoneResults.forEach(profile => {
              results.push({
                profile,
                matchType: 'phone'
              });
            });
          }
        }
      } else {
        // Search by username
        const usernameQuery = trimmedQuery.startsWith('@') 
          ? trimmedQuery.substring(1) 
          : trimmedQuery;

        const { data: usernameResults, error: usernameError } = await supabase
          .from('profiles')
          .select('id, user_id, anonymous_username, city')
          .ilike('anonymous_username', `%${usernameQuery}%`);

        if (usernameError) {
          console.error('Username search error:', usernameError);
        } else if (usernameResults && usernameResults.length > 0) {
          usernameResults.forEach(profile => {
            results.push({
              profile,
              matchType: 'username'
            });
          });
        }
      }

      // No fallback search - strict phone number formatting required

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }

    return results;
  };

  const performSearch = async (query: string) => {
    const results = await searchProfiles(query);
    setSearchResults(results);
    return results;
  };

  const clearResults = () => {
    setSearchResults([]);
  };

  return {
    isSearching,
    searchResults,
    performSearch,
    clearResults,
    normalizePhoneNumber
  };
};