# Restaurant API

Use this REST API to read the menu, check table availability, and create reservations. It shares the SQLite database used by the website and admin area.

## Getting started

From the project directory, install dependencies and start the server:

```bash
rtk npm install
rtk npm run dev
```

The local base URL is `http://localhost:3000`. Replace it in the examples if the app runs elsewhere. Example responses below are illustrative; menu data, IDs, and available times depend on the database.

## Authentication

Include this header in every request:

```http
Authorization: Bearer 0000-0000-0000-0000-0000
```

This is the default demo key. To use a different key, set `RESTAURANT_API_KEY` on the server before starting it and send that value in the header. An unset or blank value falls back to the demo key.

Missing or incorrect credentials return `401 Unauthorized`:

```json
{ "error": "Unauthorized" }
```

API JSON responses include `Cache-Control: no-store`. Unauthorized responses also include `WWW-Authenticate: Bearer`.

## Endpoints

| Method | Path | Purpose | Success status |
| --- | --- | --- | --- |
| GET | `/api/menu` | Read and filter menu items | 200 |
| GET | `/api/availability` | Find available times for a date and party size | 200 |
| POST | `/api/reservations` | Create a reservation | 201 |

## Read the menu

`GET /api/menu`

Both query parameters are optional and can be combined:

| Parameter | Behavior |
| --- | --- |
| `category` | Exact category match, ignoring case and surrounding whitespace. |
| `query` | Substring search in item names and descriptions, ignoring case and surrounding whitespace. |

Omit the parameters to retrieve all items. Empty filters are ignored. No matches return `200` with an empty `items` array. The `categories` array is returned regardless of the filters.

```bash
rtk curl --get 'http://localhost:3000/api/menu' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000' \
  --data-urlencode 'category=Pizzas' \
  --data-urlencode 'query=margherita'
```

Example response:

```json
{
  "categories": ["Salads", "Antipasti", "Pizzas", "Pasta", "Meat", "Desserts", "Drinks"],
  "items": [
    {
      "id": 13,
      "category": "Pizzas",
      "name": "Margherita Pizza",
      "description": "Tomato, mozzarella, basil, and extra virgin olive oil",
      "price": 9.9,
      "currency": "EUR"
    }
  ]
}
```

`price` is a JSON number in euros, not cents; `9.9` means €9.90.

## Check availability

`GET /api/availability`

| Query parameter | Required | Format |
| --- | --- | --- |
| `date` | Yes | Valid calendar date in `YYYY-MM-DD` format. |
| `party_size` | Yes | Digits representing a positive safe integer, such as `4`. |

```bash
rtk curl 'http://localhost:3000/api/availability?date=2026-10-02&party_size=4' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000'
```

Example response:

```json
{
  "date": "2026-10-02",
  "party_size": 4,
  "available_times": ["19:00", "19:30", "20:00"]
}
```

Dates and times use the restaurant's local calendar; times use 24-hour `HH:mm` format without a timezone offset. Slots are generated every 30 minutes from opening time, with the last possible slot one hour before closing.

Availability depends on opening hours, table capacity, and existing bookings. A party must fit at a single table; tables are not combined. Closed days or dates with no suitable free tables return `200` with `available_times: []`.

Checking availability does not hold a table. Choose a returned time and submit the reservation; availability is checked again when booking.

## Create a reservation

`POST /api/reservations`

Send a JSON object with `Content-Type: application/json` and all five fields:

| Field | JSON type | Requirements |
| --- | --- | --- |
| `guest_name` | string | Nonempty after trimming surrounding whitespace. |
| `guest_email` | string | Valid email format, such as `demo@example.com`. Surrounding whitespace is trimmed. |
| `booking_date` | string | Valid calendar date in `YYYY-MM-DD` format. |
| `booking_time` | string | 24-hour `HH:mm` time returned by availability for the same date and party size. |
| `party_size` | number | Positive safe integer. Send `4`, not `"4"`. |

Replace the example date and time with your selected available slot:

```bash
rtk curl -i 'http://localhost:3000/api/reservations' \
  -H 'Authorization: Bearer 0000-0000-0000-0000-0000' \
  -H 'Content-Type: application/json' \
  -d '{
    "guest_name": "Demo Guest",
    "guest_email": "demo@example.com",
    "booking_date": "2026-10-02",
    "booking_time": "19:00",
    "party_size": 4
  }'
```

Successful creation returns `201 Created`:

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

`id` is the saved reservation's database ID. The server assigns a suitable table automatically. The returned name and email have surrounding whitespace removed.

If the selected time is unavailable, the server returns `409 Conflict` with current alternatives:

```json
{
  "error": "That time is not available for this date and party size.",
  "available_times": ["19:30", "20:00"]
}
```

Choose another returned time and submit a new request. If another booking takes the table during creation, the error message is `That time is no longer available.` and the response also includes updated `available_times`.

## Errors

Errors handled by the API use a JSON `error` string. Check the HTTP status before reading a success response.

| Status | Meaning | What to check |
| --- | --- | --- |
| `400 Bad Request` | Invalid parameters, JSON, or reservation fields. | Required fields, date/time formats, email, and integer party size. The body must be a JSON object. |
| `401 Unauthorized` | Missing or incorrect Bearer key. | The authorization header and server key configuration. |
| `409 Conflict` | Reservation time is unavailable. | Select a time from the returned `available_times`, which may be empty. |
| `415 Unsupported Media Type` | Reservation request is not declared as JSON. | Send `Content-Type: application/json`. |
| `500 Internal Server Error` | Unexpected failure while saving a reservation. | The response is `{"error":"The reservation could not be completed."}`. Investigate the server failure. |

For example, invalid availability parameters return `400`:

```json
{
  "error": "Provide a valid date as YYYY-MM-DD and party_size as a positive integer."
}
```

## Current limitations

- This is a demo API with a shared key. See [README.md](README.md) for the project's demo status and setup details.
- Only the exact booked time is blocked for a table. Overlapping dining durations are not accounted for.
- Dates are validated as calendar dates; the API does not reject past dates or past times.
- Reservation listing, lookup, update, and cancellation endpoints are not implemented.
- Reservation requests have no idempotency mechanism. Repeating a successful POST can create another booking if capacity remains.
- The former `/api/orbitali` webhook has been removed. Use the REST endpoints directly; webhook signatures and tool-call envelopes are not used.
