"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createBooking, createMenuItem, createTable, updateHours } from "./db";

const sessionCookie = "restaurant_admin_session";

export async function bookTable(formData: FormData) {
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();
  const bookingDate = String(formData.get("bookingDate") ?? "").trim();
  const bookingTime = String(formData.get("bookingTime") ?? "").trim();
  const partySize = Number(formData.get("partySize") ?? 0);

  if (
    !guestName ||
    !guestEmail ||
    !bookingDate ||
    !bookingTime ||
    partySize < 1
  ) {
    redirect(
      `/?date=${bookingDate}&people=${partySize}&status=${encodeURIComponent("Complete all booking fields.")}`,
    );
  }

  try {
    createBooking({
      guestName,
      guestEmail,
      partySize,
      bookingDate,
      bookingTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed.";
    redirect(
      `/?date=${bookingDate}&people=${partySize}&status=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  redirect(
    `/?date=${bookingDate}&people=${partySize}&booked=${encodeURIComponent(bookingTime)}`,
  );
}

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (username !== "admin" || password !== "admin") {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
  redirect("/admin/login");
}

export async function ensureAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookie)?.value === "1";
}

export async function addTable(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);

  if (name && capacity > 0) {
    createTable(name, capacity);
    revalidatePath("/admin");
    revalidatePath("/admin/tables");
  }
}

export async function saveHours(formData: FormData) {
  const weekday = Number(formData.get("weekday"));
  const openTime = String(formData.get("openTime") ?? "17:00");
  const closeTime = String(formData.get("closeTime") ?? "22:00");
  const isClosed = formData.get("isClosed") === "on";

  if (Number.isInteger(weekday)) {
    updateHours(weekday, openTime, closeTime, isClosed);
    revalidatePath("/");
    revalidatePath("/admin/hours");
  }
}

export async function addMenuItem(formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (category && name && price >= 0) {
    createMenuItem({
      category,
      name,
      description,
      priceCents: Math.round(price * 100),
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/menu");
  }
}
