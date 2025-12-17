-- Job Files table for tracking file attachments
create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  file_name text not null,
  file_size bigint not null, -- in bytes
  file_type text not null, -- MIME type
  file_category text not null, -- 'source', 'deliverable', 'reference', 'other'
  storage_path text not null, -- path in Supabase Storage
  uploaded_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_files_job_id_idx on public.job_files(job_id);
create index if not exists job_files_owner_id_idx on public.job_files(owner_id);

-- Enable RLS
alter table public.job_files enable row level security;

-- RLS Policies for job_files
create policy "Users can view their own job files"
  on public.job_files for select
  using (public.is_owner(owner_id));

create policy "Users can insert their own job files"
  on public.job_files for insert
  with check (public.is_owner(owner_id));

create policy "Users can update their own job files"
  on public.job_files for update
  using (public.is_owner(owner_id));

create policy "Users can delete their own job files"
  on public.job_files for delete
  using (public.is_owner(owner_id));

-- Storage policies for job-files bucket
create policy "Users can view their own job files"
  on storage.objects for select
  using (bucket_id = 'job-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own job files"
  on storage.objects for insert
  with check (bucket_id = 'job-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own job files"
  on storage.objects for update
  using (bucket_id = 'job-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own job files"
  on storage.objects for delete
  using (bucket_id = 'job-files' and auth.uid()::text = (storage.foldername(name))[1]);

