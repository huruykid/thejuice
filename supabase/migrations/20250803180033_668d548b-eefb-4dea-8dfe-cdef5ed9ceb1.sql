-- Check what extensions are in the public schema
SELECT e.extname, n.nspname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE n.nspname = 'public';

-- Check if this is the pg_net exception that's acceptable
SELECT public.is_pg_net_exception_acceptable();