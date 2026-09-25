# Restaurant Demo API

The app exposes a REST API backed by the same SQLite database as the website
and admin area. The former `/api/orbitali` webhook has been removed.

## Authentication

Every API endpoint requires this header:

```http
Authorization: Bearer 0000-0000-0000-0000-0000
```

This is the default demo key. Set the server environment variable
`RESTAURANT_API_KEY` to override it. Missing or incorrect credentials return
`401 Unauthorized`. Authentication is implemented in `lib/api.ts`.

## Endpoints

| Method | Path                | Input                                                                                        |
| ------ | ------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/api/menu`         | Optional `category` and `query` query parameters                                             |
| GET    | `/api/availability` | Required `date` (`YYYY-MM-DD`) and `party_size` query parameters                             |
| POST   | `/api/reservations` | JSON body with `guest_name`, `guest_email`, `booking_date`, `booking_time`, and `party_size` |

Reservation requests require `Content-Type: application/json`. Use a valid
calendar date, a 24-hour `HH:mm` time returned by the availability endpoint,
and a positive integer JSON number for `party_size`.

Successful reads return `200`; reservation creation returns `201` with a
`reservation` object containing its database `id`. Errors use an `error`
field and HTTP status codes: `400` for invalid inputs, `401` for invalid
credentials, `409` for unavailable reservation times, `415` for unsupported
content types, and `500` for unexpected reservation storage failures.
Availability conflicts also include `available_times`.

Responses use `Cache-Control: no-store`. No reservation listing, lookup,
update, or cancellation endpoints are implemented. Availability blocks only
the exact booked time; it does not account for overlapping dining durations.

See `README.md` for curl examples and response formats. Route handlers are in
`app/api/`; shared database operations are in `lib/db.ts`.

## Verification

Prefix shell commands with `rtk`:

```bash
rtk npm run lint
rtk npm run build
rtk npm run test:api
```

API integration tests use a temporary app and database, leaving existing demo
bookings untouched. To check an overridden API key:

```bash
rtk proxy env TEST_API_KEY=override-test-key npm run test:api
```
