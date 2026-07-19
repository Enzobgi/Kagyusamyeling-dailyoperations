# Meditation Center Operations Dashboard

A static web app for coordinating room bookings, meditation center events, volunteer scheduling, attendance, and daily operations alerts.

## Features

- Room bookings with edit, cancel, recurring booking, capacity warnings, and double-booking prevention
- Event calendar with day, week, month, room, type, and search filters
- Excel-like volunteer attendance table with status updates, check-in/check-out, CSV export, and Excel-compatible export
- Volunteer assignment with overlap conflict detection and recurring commitment tracking
- Dashboard alerts for missing volunteers, room conflicts, unconfirmed bookings, and capacity issues
- Admin, Coordinator, Volunteer, and Viewer role views
- Demo and true-data modes
- Browser-saved true data with JSON import, export, and reset
- Printable daily operations sheet

## Run

Open `index.html` directly in a browser. No build step or server is required.

## Data modes

- `Demo` shows fictive sample data for exploring the interface.
- `True data` is the editable workspace. Changes are saved in the browser with `localStorage`.
- Use Admin settings to export, import, or reset the true-data JSON.
