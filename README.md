# Restaurant Reservations Demo

A Next.js demo app for testing restaurant reservations with an Orbitali agent integration.

The app includes:

- A public restaurant reservation page with date, party size, and time selection.
- A simple admin area for bookings, tables, menu items, and opening hours.
- A local SQLite database seeded with demo restaurant data.
- An Orbitali webhook endpoint that can list menu items, check table availability, and create reservations.

Demo video: https://youtu.be/FFLk_M0Rblk

## Demo Status

This project is ready for testing and demoing Orbitali. It is not production ready.

Known demo-only limitations:

- Admin login is hardcoded as `admin` / `admin`.
- The admin session is a simple cookie value, not a real authentication system.
- SQLite data is stored locally at `data/restaurant.sqlite`.
- The Orbitali webhook accepts unsigned requests when `ORBITALI_WEBHOOK_SECRET` is not set.
- Webhook payloads and responses are logged for debugging, including reservation details.

Do not deploy this as a public production app without replacing the authentication, webhook security, logging, and data-storage approach.

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

## Orbitali Webhooks

The Orbitali webhook endpoint is:

```text
/api/orbitali
```

At a high level, Orbitali calls this endpoint when the agent needs restaurant data or wants to take an action. The app reads the webhook event, extracts the tool call from the payload, runs the matching local function, and returns a JSON result that Orbitali can use in the conversation.

The flow is:

1. Orbitali sends a webhook event to `/api/orbitali`.
2. The app logs the incoming payload for demo/debugging purposes.
3. If `ORBITALI_WEBHOOK_SECRET` is configured, the app verifies the `x-orbitali-signature` header using HMAC SHA-256.
4. The app extracts the requested tool call from the Orbitali event.
5. The app dispatches the tool call to the local SQLite-backed restaurant data layer.
6. The app returns a JSON response with either the requested data, the reservation result, or an error message.

For signed webhook requests, set:

```bash
ORBITALI_WEBHOOK_SECRET=your_webhook_secret
```

The endpoint currently handles these tool calls:

- `list_menu_items`
- `check_table_availability`
- `reserve_table`

`list_menu_items` returns menu categories and matching menu items. It can optionally filter by category or search query.

`check_table_availability` checks the restaurant opening hours, party size, existing bookings, and available tables, then returns open reservation times.

`reserve_table` validates the requested guest details, date, time, and party size. If a matching table is still available, it creates a booking in the local SQLite database and returns the reservation details.

This integration is intentionally simple for demo purposes. It does not use queues, retries, rate limits, production-grade auth, or persistent external storage.

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
```

## Tech Stack

- Next.js
- React
- Flowbite React
- Tailwind CSS
- SQLite through Node.js `node:sqlite`
