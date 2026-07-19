# Kagyu Samye Ling - Les Jardins de Meditation

A static web app for managing sleeping rooms and guest stays.

## Features

- Simple sleeping-room list with room type, beds, area, bathroom, active/inactive, and notes
- Guest stays with check-in, check-out, status, people count, contact, and notes
- Double-booking prevention for sleeping rooms
- Occupied, available, and arrival counts for the selected date
- Demo and true-data modes, with true data saved in the browser
- JSON import/export for true data
- CSV export and printable room sheet
- Printable daily operations sheet

## Run

Open `index.html` directly in a browser. No build step or server is required.

## Data modes

- `Demo` shows fictive sample rooms and stays.
- `True data` is the editable workspace. Changes are saved in the browser with `localStorage`.
- Use the Data panel to export, import, or reset true-data JSON.
