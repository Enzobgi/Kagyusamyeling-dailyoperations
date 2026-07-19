# Kagyu Samye Ling - Les Jardins de Meditation

A static web app for managing sleeping rooms and guest stays.

## Features

- Simple sleeping-room list with room type, beds, area, bathroom, active/inactive, and notes
- Guest stays with check-in, check-out, status, people count, contact, and notes
- Double-booking prevention for sleeping rooms
- Occupied, available, and arrival counts for the selected date
- Demo and true-data modes, with true data saved in the browser
- Optional cloud sync across devices with Supabase
- JSON import/export for true data
- CSV export and printable room sheet
- Printable daily operations sheet

## Run

Open `index.html` directly in a browser. No build step or server is required.

## Data modes

- `Demo` shows fictive sample rooms and stays.
- `True data` is the editable workspace. Changes are saved in the browser with `localStorage`.
- Use the Data panel to export, import, or reset true-data JSON.

## Cloud sync

To edit the same data from multiple devices, create a Supabase project and run this SQL once:

```sql
create table if not exists room_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table room_data enable row level security;

create policy "room_data_read"
on room_data for select
to anon
using (true);

create policy "room_data_insert"
on room_data for insert
to anon
with check (true);

create policy "room_data_update"
on room_data for update
to anon
using (true)
with check (true);
```

Then open the app, paste the Supabase URL and anon public key in Cloud Sync, keep the record name as `main`, and turn on Auto-sync true data.
