import Fuse from 'fuse.js';

// Normalize city name for consistent storage and search
export const normalizeCityName = (city: string): string => {
  if (!city || typeof city !== 'string') return '';
  
  // Convert to lowercase, remove extra spaces, and remove special characters
  let normalized = city.toLowerCase().trim();
  // Remove special characters but keep spaces, letters, and basic punctuation
  normalized = normalized.replace(/[^a-z0-9\s\-\.]/g, '');
  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');
  // Trim again after cleanup
  return normalized.trim();
};

// Fuzzy search interface for cities
export interface CitySearchResult {
  item: string;
  score?: number;
}

// Create fuzzy search instance for city names
export const createCityFuzzySearch = (cities: string[]): Fuse<string> => {
  const normalizedCities = cities.map(normalizeCityName).filter(Boolean);
  
  return new Fuse(normalizedCities, {
    // Lower threshold = more strict matching (0.0 = exact match, 1.0 = match anything)
    threshold: 0.4,
    // Include score in results
    includeScore: true,
    // Don't limit by location
    ignoreLocation: true,
    // Search the entire string
    findAllMatches: true,
    // Minimum character length before search starts
    minMatchCharLength: 2
  });
};

// Perform fuzzy city search
export const fuzzySearchCities = (
  query: string, 
  cities: string[], 
  limit: number = 10
): CitySearchResult[] => {
  if (!query || !cities.length) return [];
  
  const normalizedQuery = normalizeCityName(query);
  if (!normalizedQuery) return [];
  
  const fuse = createCityFuzzySearch(cities);
  const results = fuse.search(normalizedQuery, { limit });
  
  return results.map(result => ({
    item: result.item,
    score: result.score
  }));
};

// Get unique cities from stories for search suggestions
export const getUniqueCities = (stories: Array<{ location?: string | null; normalized_location?: string | null }>): string[] => {
  const cities = new Set<string>();
  
  stories.forEach(story => {
    // Use normalized_location if available, otherwise normalize location
    const city = story.normalized_location || (story.location ? normalizeCityName(story.location) : '');
    if (city) {
      cities.add(city);
    }
  });
  
  return Array.from(cities).sort();
};
