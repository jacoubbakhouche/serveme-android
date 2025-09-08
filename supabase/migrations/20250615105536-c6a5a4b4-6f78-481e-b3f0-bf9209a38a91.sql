
-- Create a table for user profiles
create table public.profiles (
  id uuid not null primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  location text,
  is_provider boolean not null default false,
  provider_category text,
  updated_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- This trigger automatically creates a profile for new users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to automatically update `updated_at`
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
