ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_city_id_idx ON public.profiles(city_id);