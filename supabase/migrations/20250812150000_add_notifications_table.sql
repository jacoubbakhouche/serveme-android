create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  type text not null, -- 'message' or 'review'
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table notifications enable row level security;

create policy "Users can see their own notifications."
on notifications for select
using (auth.uid() = user_id);
