# Restaurant Reservations Demo

A Next.js demo app for testing restaurant reservations with a REST API.

The app includes:

- A public restaurant reservation page with date, party size, and time selection.
- A simple admin area for bookings, tables, menu items, and opening hours.
- A local SQLite database seeded with demo restaurant data.
- A key-protected REST API for menu items, table availability, and reservations.

Demo video: https://youtu.be/FFLk_M0Rblk

## Demo Status

This project is ready for testing and demoing REST API integrations. It is not production ready.

Known demo-only limitations:

- Admin login is hardcoded as `admin` / `admin`.
- The admin session is a simple cookie value, not a real authentication system.
- SQLite data is stored locally at `data/restaurant.sqlite`.
- The API uses a shared demo key by default. Set `RESTAURANT_API_KEY` to override it.
- Availability blocks only the exact booked time, not overlapping dining durations.

Do not deploy this as a public production app without replacing the authentication, API key configuration and data-storage approach.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 to use the reservation page.

Open http://localhost:3000/admin to use the admin area.

## REST API

See [API.md](API.md) for the full API usage guide, request fields, response examples, and error handling.

All endpoints require this header:

```http
Authorization: Bearer 0000-0000-0000-0000-0000
```

The provided key is the default demo key and works without additional setup.
Optionally set the server environment variable `RESTAURANT_API_KEY` to override it.
Missing or incorrect keys return `401 Unauthorized`. Responses use `Cache-Control: no-store`.
The old `/api/orbitali` webhook has been removed; tool-call envelopes and webhook signatures are no longer used.

| Method | Endpoint            | Input                                                       | Success                                                 |
| ------ | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/menu`         | Optional `category`, `query` query parameters               | 200 with `{ categories, items }`                        |
| GET    | `/api/availability` | Required `date` (YYYY-MM-DD), `party_size` query parameters | 200 with `{ date, party_size, available_times }`        |
| POST   | `/api/reservations` | JSON guest details, date, time, party size                  | 201 with `{ reservation }`, including its database `id` |

Menu items include `id`, `category`, `name`, `description`, `price`, and `currency` (EUR).
Category matching is case-insensitive; `query` searches names and descriptions.
Dates and times use the restaurant's local calendar, with 24-hour `HH:mm` times.
Availability checks opening hours, table capacity, and existing bookings; closed days return an empty array.
The API shares the same SQLite database as the website and admin area.

### Check availability

```bash
curl 'http://localhost:3000/api/availability?date=2026-10-02&party_size=4' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000'
```

### Create a reservation

Choose a time from `available_times`, then send:

```bash
curl -i 'http://localhost:3000/api/reservations' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000' \
  -H 'Content-Type: application/json' \
  -d '{"guest_name":"Demo Guest","guest_email":"demo@example.com","booking_date":"2026-10-02","booking_time":"19:00","party_size":4}'
```

Example `201 Created` response:

```json
{
  "reservation": {
    "id": 1,
    "guest_name": "Demo Guest",
    "guest_email": "demo@example.com",
    "party_size": 4,
    "booking_date": "2026-10-02",
    "booking_time": "19:00"
  }
}
```

### Read the menu

```bash
curl 'http://localhost:3000/api/menu?category=Pizzas&query=margherita' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000'
```

Errors return `{ "error": "..." }` with the appropriate HTTP status:

- `400`: invalid JSON or fields (including invalid calendar dates, email, time, or party size).
- `401`: missing or incorrect Bearer key.
- `409`: requested reservation time unavailable; includes updated `available_times`.
- `415`: reservation request is not `application/json`.
- `500`: unexpected reservation storage failure.

Reservation `party_size` must be a positive integer JSON number.
No reservation listing, lookup, update, or cancellation endpoints are currently provided.

## Local Data

The app creates a local SQLite database at:

```text
data/restaurant.sqlite
```

That file is ignored by git. If you want to reset the demo data, stop the dev server and delete the SQLite file. It will be recreated on the next app start.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
npm run test:api
```

## Tech Stack

- Next.js
- React
- Flowbite React
- Tailwind CSS
- SQLite through Node.js `node:sqlite`
