-- Supabase advisor: pin the search_path of the immutability trigger function.
alter function public.revisions_immutable() set search_path = '';
