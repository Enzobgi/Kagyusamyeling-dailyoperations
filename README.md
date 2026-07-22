# Kagyu Samye Ling - Les Jardins de Meditation

A static web app for managing sleeping rooms and guest stays.

## Features

- Simple sleeping-room list with room type, beds, area, bathroom, active/inactive, and notes
- Guest stays with check-in, check-out, room, bed, status, people count, contact, and notes
- Double-booking prevention by bed, useful for dormitories and shared rooms
- Occupied, available, and arrival counts for the selected date
- Monthly occupancy grid with all rooms together
- Monthly occupancy grid with separate rows for each bed in multi-bed rooms
- Demo and true-data modes, with true data saved in the browser
- User accounts and shared data across devices with Neon Postgres
- JSON import/export for true data
- CSV export and printable room sheet
- Printable daily operations sheet

## Run

Open `index.html` directly in a browser. No build step or server is required.

## Data modes

- `Demo` shows fictive sample rooms and stays.
- `True data` is the editable workspace. Changes are saved in the browser with `localStorage`.
- Use the Data panel to export, import, or reset true-data JSON.

## User Accounts With Neon

To edit the same data from multiple devices, connect a Neon Postgres database to the Vercel project and set `DATABASE_URL`.

The app uses serverless API routes:

- `/api/auth` creates users, signs users in, and issues private sessions.
- `/api/data` loads and saves each signed-in user's room and stay data.

The API creates these Neon tables automatically on first use:

- `app_users`
- `app_sessions`
- `room_data`

After `DATABASE_URL` is configured on Vercel, open the app, create an account or sign in, then edit true data. Changes sync automatically for that account.
