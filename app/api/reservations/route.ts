import { authorize, isDate, isPartySize, json } from "@/lib/api";
import { createBooking, getAvailableSlots } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return json({ error: "Use Content-Type: application/json." }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Provide a JSON object." }, 400);
  }
  const { guest_name, guest_email, booking_date, booking_time, party_size } =
    body;
  if (
    typeof guest_name !== "string" ||
    !guest_name.trim() ||
    typeof guest_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email.trim()) ||
    !isDate(booking_date) ||
    typeof booking_time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(booking_time) ||
    !isPartySize(party_size)
  ) {
    return json(
      {
        error:
          "Provide guest_name, a valid guest_email, booking_date as YYYY-MM-DD, booking_time as HH:mm, and party_size as a positive integer.",
      },
      400,
    );
  }
  const availableTimes = getAvailableSlots(booking_date, party_size);
  if (!availableTimes.includes(booking_time)) {
    return json(
      {
        error: "That time is not available for this date and party size.",
        available_times: availableTimes,
      },
      409,
    );
  }
  try {
    const id = createBooking({
      guestName: guest_name.trim(),
      guestEmail: guest_email.trim(),
      partySize: party_size,
      bookingDate: booking_date,
      bookingTime: booking_time,
    });
    return json(
      {
        reservation: {
          id,
          guest_name: guest_name.trim(),
          guest_email: guest_email.trim(),
          party_size,
          booking_date,
          booking_time,
        },
      },
      201,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "No table is available for that time." ||
        error.message.includes("UNIQUE constraint failed: bookings."))
    ) {
      return json(
        {
          error: "That time is no longer available.",
          available_times: getAvailableSlots(booking_date, party_size),
        },
        409,
      );
    }
    return json({ error: "The reservation could not be completed." }, 500);
  }
}
