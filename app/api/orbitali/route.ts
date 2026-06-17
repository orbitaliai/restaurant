import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createBooking,
  getAvailableSlots,
  getMenuItems,
  menuCategories,
} from "@/lib/db";

export const runtime = "nodejs";

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

function verifyOrbitaliSignature({
  secret,
  rawBody,
  signature,
}: {
  secret: string;
  rawBody: string;
  signature: string | null;
}) {
  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const actual = signature.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(actual)) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInteger(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function extractToolCall(event: unknown): ToolCall | null {
  if (!isRecord(event) || !isRecord(event.message)) {
    return null;
  }

  if (event.message.type !== "agent:tool-call") {
    return null;
  }

  const candidates = [
    event.message.toolCall,
    event.message.tool_call,
    event.message.tool,
    event.message,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const name = asString(candidate.name ?? candidate.toolName);
    const args =
      candidate.arguments ?? candidate.args ?? candidate.parameters ?? {};

    if (name && isRecord(args)) {
      return { name, arguments: args };
    }
  }

  return null;
}

function listMenuItems(args: Record<string, unknown>) {
  const category = asString(args.category).toLowerCase();
  const query = asString(args.query).toLowerCase();

  const items = getMenuItems()
    .filter((item) => {
      const matchesCategory =
        !category || item.category.toLowerCase() === category;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    })
    .map((item) => ({
      category: item.category,
      name: item.name,
      description: item.description,
      price: Number((item.price_cents / 100).toFixed(2)),
      currency: "EUR",
    }));

  return {
    categories: menuCategories,
    items,
  };
}

function checkTableAvailability(args: Record<string, unknown>) {
  const date = asString(args.date);
  const partySize = asPositiveInteger(args.party_size);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || partySize < 1) {
    return {
      ok: false,
      error:
        "Provide date as YYYY-MM-DD and party_size as a positive integer.",
    };
  }

  return {
    ok: true,
    date,
    party_size: partySize,
    available_times: getAvailableSlots(date, partySize),
  };
}

function reserveTable(args: Record<string, unknown>) {
  const guestName = asString(args.guest_name);
  const guestEmail = asString(args.guest_email);
  const bookingDate = asString(args.booking_date);
  const bookingTime = asString(args.booking_time);
  const partySize = asPositiveInteger(args.party_size);

  if (
    !guestName ||
    !guestEmail ||
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    !/^\d{2}:\d{2}$/.test(bookingTime) ||
    partySize < 1
  ) {
    return {
      ok: false,
      error:
        "Provide guest_name, guest_email, party_size, booking_date as YYYY-MM-DD, and booking_time as HH:mm.",
    };
  }

  const availableSlots = getAvailableSlots(bookingDate, partySize);

  if (!availableSlots.includes(bookingTime)) {
    return {
      ok: false,
      error: "That time is not available for this date and party size.",
      available_times: availableSlots,
    };
  }

  try {
    createBooking({
      guestName,
      guestEmail,
      partySize,
      bookingDate,
      bookingTime,
    });

    return {
      ok: true,
      reservation: {
        guest_name: guestName,
        guest_email: guestEmail,
        party_size: partySize,
        booking_date: bookingDate,
        booking_time: bookingTime,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "The reservation could not be completed.",
    };
  }
}

function dispatchToolCall(toolCall: ToolCall) {
  switch (toolCall.name) {
    case "list_menu_items":
      return listMenuItems(toolCall.arguments);
    case "check_table_availability":
      return checkTableAvailability(toolCall.arguments);
    case "reserve_table":
      return reserveTable(toolCall.arguments);
    default:
      return {
        ok: false,
        error: `Unsupported tool: ${toolCall.name}`,
      };
  }
}

function logOrbitali(label: string, value: unknown) {
  console.log(`[orbitali] ${label}`, JSON.stringify(value, null, 2));
}

export async function POST(request: Request) {
  const secret = process.env.ORBITALI_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  logOrbitali("webhook payload", {
    headers: Object.fromEntries(request.headers.entries()),
    rawBody,
  });

  if (
    secret &&
    !verifyOrbitaliSignature({
      secret,
      rawBody,
      signature: request.headers.get("x-orbitali-signature"),
    })
  ) {
    const response = { error: "Unauthorized" };
    logOrbitali("webhook response", response);
    return NextResponse.json(response, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    const response = { error: "Invalid JSON" };
    logOrbitali("webhook response", response);
    return NextResponse.json(response, { status: 400 });
  }

  const toolCall = extractToolCall(event);

  if (!toolCall) {
    const response = { error: "Unsupported event" };
    logOrbitali("webhook response", response);
    return NextResponse.json(response, { status: 400 });
  }

  const response = {
    ok: true,
    tool: toolCall.name,
    result: dispatchToolCall(toolCall),
  };

  logOrbitali("webhook response", response);
  return NextResponse.json(response);
}
