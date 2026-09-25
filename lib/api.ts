import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function authorize(request: Request) {
  const key =
    process.env.RESTAURANT_API_KEY?.trim() || "0000-0000-0000-0000-0000";
  const token =
    request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1] ?? "";
  const actual = Buffer.from(token);
  const expected = Buffer.from(key);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer", "Cache-Control": "no-store" },
      },
    );
  }
}

export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function isPartySize(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
