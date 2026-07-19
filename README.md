# Kagyu Samye Ling - Les Jardins de Meditation

A static web app for managing sleeping rooms and guest stays.

## Features

- Simple sleeping-room list with room type, beds, area, bathroom, active/inactive, and notes
- Guest stays with check-in, check-out, status, people count, contact, and notes
- Double-booking prevention for sleeping rooms
- Occupied, available, and arrival counts for the selected date
- Monthly occupancy grid with all rooms together
- Demo and true-data modes, with true data saved in the browser
- User accounts and optional cloud sync across devices with Supabase
- JSON import/export for true data
- CSV export and printable room sheet
- Printable daily operations sheet

## Run

Open `index.html` directly in a browser. No build step or server is required.

## Data modes

- `Demo` shows fictive sample rooms and stays.
- `True data` is the editable workspace. Changes are saved in the browser with `localStorage`.
- Use the Data panel to export, import, or reset true-data JSON.

## User accounts and cloud sync

To edit the same data from multiple devices, create a Supabase project, enable Email authentication, and run this SQL once:

```sql
create table if not exists room_data (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table room_data enable row level security;

create policy "room_data_read"
on room_data for select
to authenticated
using (auth.uid() = user_id);

create policy "room_data_insert"
on room_data for insert
to authenticated
with check (auth.uid() = user_id);

create policy "room_data_update"
on room_data for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Then open the app, paste the Supabase URL and anon public key in Cloud Sync, create an account or sign in, keep the record name as `main`, and turn on Auto-sync true data.
