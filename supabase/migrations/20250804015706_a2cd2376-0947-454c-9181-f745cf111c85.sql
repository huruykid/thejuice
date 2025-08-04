-- Create cities table for structured location data
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT,
  country_code TEXT,
  state_province TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create policies for cities (read-only for all users)
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities 
FOR SELECT 
USING (true);

-- Create index for efficient searching
CREATE INDEX idx_cities_city_name ON public.cities (city_name);
CREATE INDEX idx_cities_slug ON public.cities (slug);
CREATE INDEX idx_cities_country ON public.cities (country);

-- Add city_id column to stories table
ALTER TABLE public.stories ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Create index for stories city lookup
CREATE INDEX idx_stories_city_id ON public.stories (city_id);

-- Insert some major cities to get started
INSERT INTO public.cities (city_name, slug, country, country_code, state_province, latitude, longitude, population) VALUES
('New York', 'new-york', 'United States', 'US', 'New York', 40.7128, -74.0060, 8336817),
('Los Angeles', 'los-angeles', 'United States', 'US', 'California', 34.0522, -118.2437, 3979576),
('Chicago', 'chicago', 'United States', 'US', 'Illinois', 41.8781, -87.6298, 2693976),
('Houston', 'houston', 'United States', 'US', 'Texas', 29.7604, -95.3698, 2320268),
('Phoenix', 'phoenix', 'United States', 'US', 'Arizona', 33.4484, -112.0740, 1680992),
('Philadelphia', 'philadelphia', 'United States', 'US', 'Pennsylvania', 39.9526, -75.1652, 1584064),
('San Antonio', 'san-antonio', 'United States', 'US', 'Texas', 29.4241, -98.4936, 1547253),
('San Diego', 'san-diego', 'United States', 'US', 'California', 32.7157, -117.1611, 1423851),
('Dallas', 'dallas', 'United States', 'US', 'Texas', 32.7767, -96.7970, 1343573),
('San Jose', 'san-jose', 'United States', 'US', 'California', 37.3382, -121.8863, 1021795),
('Austin', 'austin', 'United States', 'US', 'Texas', 30.2672, -97.7431, 978908),
('Jacksonville', 'jacksonville', 'United States', 'US', 'Florida', 30.3322, -81.6557, 949611),
('Fort Worth', 'fort-worth', 'United States', 'US', 'Texas', 32.7555, -97.3308, 918915),
('Columbus', 'columbus', 'United States', 'US', 'Ohio', 39.9612, -82.9988, 898553),
('Charlotte', 'charlotte', 'United States', 'US', 'North Carolina', 35.2271, -80.8431, 885708),
('San Francisco', 'san-francisco', 'United States', 'US', 'California', 37.7749, -122.4194, 881549),
('Indianapolis', 'indianapolis', 'United States', 'US', 'Indiana', 39.7684, -86.1581, 876384),
('Seattle', 'seattle', 'United States', 'US', 'Washington', 47.6062, -122.3321, 753675),
('Denver', 'denver', 'United States', 'US', 'Colorado', 39.7392, -104.9903, 715522),
('Washington', 'washington', 'United States', 'US', 'District of Columbia', 38.9072, -77.0369, 705749),
('Boston', 'boston', 'United States', 'US', 'Massachusetts', 42.3601, -71.0589, 692600),
('El Paso', 'el-paso', 'United States', 'US', 'Texas', 31.7619, -106.4850, 681728),
('Nashville', 'nashville', 'United States', 'US', 'Tennessee', 36.1627, -86.7816, 670820),
('Detroit', 'detroit', 'United States', 'US', 'Michigan', 42.3314, -83.0458, 670031),
('Oklahoma City', 'oklahoma-city', 'United States', 'US', 'Oklahoma', 35.4676, -97.5164, 695537),
('Portland', 'portland', 'United States', 'US', 'Oregon', 45.5152, -122.6784, 652503),
('Las Vegas', 'las-vegas', 'United States', 'US', 'Nevada', 36.1699, -115.1398, 641903),
('Memphis', 'memphis', 'United States', 'US', 'Tennessee', 35.1495, -90.0490, 633104),
('Louisville', 'louisville', 'United States', 'US', 'Kentucky', 38.2527, -85.7585, 617638),
('Baltimore', 'baltimore', 'United States', 'US', 'Maryland', 39.2904, -76.6122, 576498),
('Milwaukee', 'milwaukee', 'United States', 'US', 'Wisconsin', 43.0389, -87.9065, 577222),
('Albuquerque', 'albuquerque', 'United States', 'US', 'New Mexico', 35.0844, -106.6504, 564559),
('Tucson', 'tucson', 'United States', 'US', 'Arizona', 32.2226, -110.9747, 548073),
('Fresno', 'fresno', 'United States', 'US', 'California', 36.7378, -119.7871, 542107),
('Sacramento', 'sacramento', 'United States', 'US', 'California', 38.5816, -121.4944, 508529),
('Mesa', 'mesa', 'United States', 'US', 'Arizona', 33.4152, -111.8315, 518012),
('Kansas City', 'kansas-city', 'United States', 'US', 'Missouri', 39.0997, -94.5786, 495327),
('Atlanta', 'atlanta', 'United States', 'US', 'Georgia', 33.7490, -84.3880, 498715),
('Colorado Springs', 'colorado-springs', 'United States', 'US', 'Colorado', 38.8339, -104.8214, 478221),
('Raleigh', 'raleigh', 'United States', 'US', 'North Carolina', 35.7796, -78.6382, 474069),
('Omaha', 'omaha', 'United States', 'US', 'Nebraska', 41.2565, -95.9345, 486051),
('Miami', 'miami', 'United States', 'US', 'Florida', 25.7617, -80.1918, 470914),
('Long Beach', 'long-beach', 'United States', 'US', 'California', 33.7701, -118.1937, 466742),
('Virginia Beach', 'virginia-beach', 'United States', 'US', 'Virginia', 36.8529, -75.9780, 459470),
('Oakland', 'oakland', 'United States', 'US', 'California', 37.8044, -122.2712, 433031),
('Minneapolis', 'minneapolis', 'United States', 'US', 'Minnesota', 44.9778, -93.2650, 429606),
('Tulsa', 'tulsa', 'United States', 'US', 'Oklahoma', 36.1540, -95.9928, 413066),
('Tampa', 'tampa', 'United States', 'US', 'Florida', 27.9506, -82.4572, 399700),
('Arlington', 'arlington', 'United States', 'US', 'Texas', 32.7357, -97.1081, 398854),
('Wichita', 'wichita', 'United States', 'US', 'Kansas', 37.6872, -97.3301, 397532);

-- Function to generate slug from city name
CREATE OR REPLACE FUNCTION public.generate_city_slug(city_name_param text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(city_name_param, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$function$;