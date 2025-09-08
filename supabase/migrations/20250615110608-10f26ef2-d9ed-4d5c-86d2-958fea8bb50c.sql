
-- Create a table for services
create table public.services (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  is_urgent boolean not null default false,
  contact_number text,
  created_at timestamp with time zone not null default now()
);

-- Set up Row Level Security (RLS)
alter table public.services enable row level security;

-- Create a policy that allows everyone to view services
create policy "Services are viewable by everyone."
  on public.services for select
  using ( true );

-- Create a policy that allows authenticated users to insert their own services
create policy "Users can insert their own services."
  on public.services for insert
  with check ( auth.uid() = user_id );

-- Create a policy that allows users to update their own services
create policy "Users can update their own services."
  on public.services for update
  using ( auth.uid() = user_id );

-- Create a policy that allows users to delete their own services
create policy "Users can delete their own services."
  on public.services for delete
  using ( auth.uid() = user_id );
