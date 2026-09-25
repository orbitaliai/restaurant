import { authorize, isDate, isPartySize, json } from "@/lib/api";
import { getAvailableSlots } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const rawPartySize = params.get("party_size") ?? "";
  const partySize = /^\d+$/.test(rawPartySize) ? Number(rawPartySize) : 0;
  if (!isDate(date) || !isPartySize(partySize)) {
    return json(
      {
        error:
          "Provide a valid date as YYYY-MM-DD and party_size as a positive integer.",
      },
      400,
    );
  }
  return json({
    date,
    party_size: partySize,
    available_times: getAvailableSlots(date, partySize),
  });
}
