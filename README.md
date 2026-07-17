# Table Management System

An interactive table reservation and floor plan management system for restaurants, built with React and Supabase. Customers book a table by clicking directly on a 2D map of the venue, while restaurant staff manage bookings, seating, and the floor plan itself from a dedicated admin dashboard.

Think of it as a Vivaticket-style seat map, adapted for restaurant table booking: pick a date and time, see which tables are free in real time, click one, and confirm — no phone calls required.

## Features

- **Interactive floor plan booking** — customers select their table directly on a live, color-coded 2D map (available / occupied / too small for the party size), instead of an anonymous "table for 4" request.
- **Real venue recreation** — restaurant owners can upload a photo or blueprint of their actual space as a background reference and trace tables, walls, doors, and the bar counter on top of it for a 1:1 layout match.
- **Drag-and-drop floor plan editor** — freely place, resize, rotate, and recolor tables and other room elements; supports multiple rooms/areas (e.g. indoor dining room, outdoor patio) per venue.
- **Saved table layouts** — save multiple named table arrangements per room, mark one as the default used every day, and assign alternate layouts to specific dates (e.g. a private event that requires rearranging tables).
- **Live admin dashboard** — staff see real-time table occupancy on the same map, manage the day's reservation list, create walk-in bookings by clicking an open table, and update reservation status (seated, completed, cancelled, no-show).
- **Conflict-safe booking** — double-booking is prevented at the database level, even under concurrent requests, with live updates so the map reflects other customers' bookings instantly.
- **Guest checkout** — customers book with just their name, phone, and email; no account required.

## Tech stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS, Zustand
- **Floor plan canvas**: Konva / react-konva
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)

## Getting started

```bash
npm install
npm run dev
```

The app expects a Supabase project with the following environment variables (create a `.env` file, see `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Project structure

```
src/
  features/
    booking/            customer-facing table reservation flow
    admin/               staff dashboard (reservations, table status)
    floor-plan-editor/   drag-and-drop room/table editor
    layouts/             saved table layout management
  components/            shared UI pieces (map background image, ...)
  lib/                   Supabase client and shared helpers
```

## License

Proprietary — all rights reserved.
