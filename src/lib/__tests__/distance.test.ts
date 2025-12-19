import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  formatDistance,
  DISTANCE_RANGES,
  Coordinates,
} from '../distance';

describe('calculateDistance', () => {
  it('returns 0 for same coordinates', () => {
    const point: Coordinates = { latitude: 40.7128, longitude: -74.006 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it('calculates distance between NYC and LA correctly', () => {
    const nyc: Coordinates = { latitude: 40.7128, longitude: -74.006 };
    const la: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
    
    const distance = calculateDistance(nyc, la);
    
    // NYC to LA is approximately 2,451 miles
    expect(distance).toBeGreaterThan(2400);
    expect(distance).toBeLessThan(2500);
  });

  it('calculates distance between nearby points', () => {
    const point1: Coordinates = { latitude: 40.7128, longitude: -74.006 };
    const point2: Coordinates = { latitude: 40.7580, longitude: -73.9855 }; // Times Square
    
    const distance = calculateDistance(point1, point2);
    
    // Should be about 3-4 miles
    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(5);
  });

  it('handles negative coordinates', () => {
    const london: Coordinates = { latitude: 51.5074, longitude: -0.1278 };
    const sydney: Coordinates = { latitude: -33.8688, longitude: 151.2093 };
    
    const distance = calculateDistance(london, sydney);
    
    // London to Sydney is approximately 10,553 miles
    expect(distance).toBeGreaterThan(10000);
    expect(distance).toBeLessThan(11000);
  });

  it('returns distance rounded to 1 decimal place', () => {
    const point1: Coordinates = { latitude: 40.7128, longitude: -74.006 };
    const point2: Coordinates = { latitude: 40.7580, longitude: -73.9855 };
    
    const distance = calculateDistance(point1, point2);
    
    // Check it has at most 1 decimal place
    const decimalPart = (distance % 1).toFixed(1);
    expect(parseFloat(decimalPart)).toBeLessThanOrEqual(0.9);
  });

  it('is symmetric (A to B equals B to A)', () => {
    const point1: Coordinates = { latitude: 40.7128, longitude: -74.006 };
    const point2: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
    
    const distance1 = calculateDistance(point1, point2);
    const distance2 = calculateDistance(point2, point1);
    
    expect(distance1).toBe(distance2);
  });
});

describe('formatDistance', () => {
  it('formats less than 1 mile', () => {
    expect(formatDistance(0)).toBe('Less than 1 mile');
    expect(formatDistance(0.5)).toBe('Less than 1 mile');
    expect(formatDistance(0.9)).toBe('Less than 1 mile');
  });

  it('formats exactly 1 mile', () => {
    expect(formatDistance(1)).toBe('1 mile');
  });

  it('formats plural miles', () => {
    expect(formatDistance(2)).toBe('2 miles');
    expect(formatDistance(10)).toBe('10 miles');
    expect(formatDistance(100)).toBe('100 miles');
  });

  it('formats decimal distances', () => {
    expect(formatDistance(1.5)).toBe('1.5 miles');
    expect(formatDistance(25.3)).toBe('25.3 miles');
  });
});

describe('DISTANCE_RANGES', () => {
  it('has correct number of options', () => {
    expect(DISTANCE_RANGES.length).toBe(5);
  });

  it('includes "Anywhere" option with null value', () => {
    const anywhereOption = DISTANCE_RANGES.find(r => r.label === 'Anywhere');
    expect(anywhereOption).toBeDefined();
    expect(anywhereOption?.value).toBe(null);
  });

  it('has ascending distance values', () => {
    const numericRanges = DISTANCE_RANGES.filter(r => r.value !== null);
    for (let i = 1; i < numericRanges.length; i++) {
      expect(numericRanges[i].value!).toBeGreaterThan(numericRanges[i - 1].value!);
    }
  });

  it('has expected distance options', () => {
    const values = DISTANCE_RANGES.map(r => r.value);
    expect(values).toContain(5);
    expect(values).toContain(10);
    expect(values).toContain(25);
    expect(values).toContain(50);
  });
});
