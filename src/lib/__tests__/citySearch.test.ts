import { describe, it, expect } from 'vitest';
import {
  normalizeCityName,
  fuzzySearchCities,
  getUniqueCities,
} from '../citySearch';

describe('normalizeCityName', () => {
  it('returns empty string for falsy input', () => {
    expect(normalizeCityName('')).toBe('');
    expect(normalizeCityName(null as any)).toBe('');
    expect(normalizeCityName(undefined as any)).toBe('');
  });

  it('converts to lowercase', () => {
    expect(normalizeCityName('NEW YORK')).toBe('new york');
    expect(normalizeCityName('Los Angeles')).toBe('los angeles');
  });

  it('trims whitespace', () => {
    expect(normalizeCityName('  Chicago  ')).toBe('chicago');
  });

  it('removes special characters', () => {
    expect(normalizeCityName("St. Louis")).toBe('st. louis');
    expect(normalizeCityName('San José')).toBe('san jos');
  });

  it('normalizes multiple spaces', () => {
    expect(normalizeCityName('San    Francisco')).toBe('san francisco');
  });

  it('handles hyphenated names', () => {
    expect(normalizeCityName('Winston-Salem')).toBe('winston-salem');
  });
});

describe('fuzzySearchCities', () => {
  const cities = [
    'new york',
    'los angeles',
    'chicago',
    'houston',
    'phoenix',
    'philadelphia',
    'san antonio',
    'san diego',
    'dallas',
    'san jose',
  ];

  it('returns empty array for empty query', () => {
    expect(fuzzySearchCities('', cities)).toEqual([]);
  });

  it('returns empty array for empty cities list', () => {
    expect(fuzzySearchCities('new york', [])).toEqual([]);
  });

  it('finds exact matches', () => {
    const results = fuzzySearchCities('new york', cities);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item).toBe('new york');
  });

  it('finds partial matches', () => {
    const results = fuzzySearchCities('san', cities);
    expect(results.length).toBeGreaterThan(0);
    // Should find san antonio, san diego, san jose
    const items = results.map(r => r.item);
    expect(items.some(item => item.includes('san'))).toBe(true);
  });

  it('handles typos with fuzzy matching', () => {
    const results = fuzzySearchCities('chcago', cities);
    // Should still find chicago despite typo
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.item === 'chicago')).toBe(true);
  });

  it('respects limit parameter', () => {
    const results = fuzzySearchCities('s', cities, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('includes score in results', () => {
    const results = fuzzySearchCities('new york', cities);
    expect(results[0]).toHaveProperty('score');
    expect(typeof results[0].score).toBe('number');
  });
});

describe('getUniqueCities', () => {
  it('returns empty array for empty input', () => {
    expect(getUniqueCities([])).toEqual([]);
  });

  it('extracts unique cities from stories', () => {
    const stories = [
      { location: 'New York', normalized_location: 'new york' },
      { location: 'Los Angeles', normalized_location: 'los angeles' },
      { location: 'New York', normalized_location: 'new york' },
    ];

    const cities = getUniqueCities(stories);
    expect(cities).toHaveLength(2);
    expect(cities).toContain('new york');
    expect(cities).toContain('los angeles');
  });

  it('uses normalized_location when available', () => {
    const stories = [
      { location: 'NYC', normalized_location: 'new york' },
    ];

    const cities = getUniqueCities(stories);
    expect(cities).toContain('new york');
    expect(cities).not.toContain('nyc');
  });

  it('normalizes location when normalized_location is not available', () => {
    const stories = [
      { location: 'Los Angeles', normalized_location: null },
    ];

    const cities = getUniqueCities(stories);
    expect(cities).toContain('los angeles');
  });

  it('ignores null locations', () => {
    const stories = [
      { location: null, normalized_location: null },
      { location: 'Chicago', normalized_location: 'chicago' },
    ];

    const cities = getUniqueCities(stories);
    expect(cities).toHaveLength(1);
    expect(cities).toContain('chicago');
  });

  it('returns sorted cities', () => {
    const stories = [
      { location: 'Zebra City', normalized_location: 'zebra city' },
      { location: 'Alpha Town', normalized_location: 'alpha town' },
      { location: 'Middle Place', normalized_location: 'middle place' },
    ];

    const cities = getUniqueCities(stories);
    expect(cities).toEqual(['alpha town', 'middle place', 'zebra city']);
  });
});
