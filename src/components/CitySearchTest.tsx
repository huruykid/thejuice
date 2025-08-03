import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fuzzySearchCities, normalizeCityName } from '@/lib/citySearch';

const CitySearchTest = () => {
  const [query, setQuery] = useState('');
  
  // Sample cities for testing
  const sampleCities = [
    'Los Angeles',
    'New York',
    'San Francisco',
    'Chicago',
    'Boston',
    'Miami',
    'Seattle',
    'Las Vegas',
    'San Diego',
    'Phoenix'
  ];
  
  const searchResults = query.length >= 2 
    ? fuzzySearchCities(query, sampleCities, 5)
    : [];
    
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>City Search Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a city name..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Type full city name (e.g. "Los Angeles", not "LA") for better search results.
          </p>
        </div>
        
        {query && (
          <div>
            <p className="text-sm font-medium mb-2">
              Normalized: "{normalizeCityName(query)}"
            </p>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Fuzzy Search Results:</h4>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{result.item}</span>
                  <Badge variant="outline">
                    {result.score ? Math.round((1 - result.score) * 100) : 100}% match
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {query.length >= 2 && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground">No matching cities found</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CitySearchTest;