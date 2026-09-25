import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

test(
  "REST API authentication, validation, and reservation lifecycle",
  { timeout: 120_000 },
  async (t) => {
    // Run against a temporary app/database, never the user's demo bookings.
    const root = resolve(import.meta.dirname, "..");
    const fixture = await mkdtemp(join(tmpdir(), "restaurant-api-"));
    let server;
    let logs = "";
    t.after(async () => {
      if (server && server.exitCode === null) {
        const stopped = once(server, "exit");
        server.kill("SIGTERM");
        await stopped;
      }
      await rm(fixture, { recursive: true, force: true });
    });
    for (const path of ["app/api", "lib", "tsconfig.json", "package.json"]) {
      await cp(join(root, path), join(fixture, path), { recursive: true });
    }
    await symlink(
      join(root, "node_modules"),
      join(fixture, "node_modules"),
      "dir",
    );
    await writeFile(
      join(fixture, "app/layout.tsx"),
      "export default function Layout({ children }) { return <html><body>{children}</body></html>; }",
    );
    await writeFile(
      join(fixture, "app/page.tsx"),
      "export default function Page() { return <main>API test</main>; }",
    );
    const listener = createServer();
    listener.listen(0, "127.0.0.1");
    await once(listener, "listening");
    const port = listener.address().port;
    await new Promise((resolve) => listener.close(resolve));
    const key = process.env.TEST_API_KEY || "0000-0000-0000-0000-0000";
    server = spawn(
      process.execPath,
      [
        join(root, "node_modules/next/dist/bin/next"),
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: fixture,
        env: {
          ...process.env,
          RESTAURANT_API_KEY: process.env.TEST_API_KEY || "",
          NEXT_TELEMETRY_DISABLED: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (data) => {
      logs += data;
    });
    server.stderr.on("data", (data) => {
      logs += data;
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearInterval(poll);
        reject(new Error(logs));
      }, 30_000);
      const poll = setInterval(() => {
        if (logs.includes("Ready in")) {
          clearTimeout(timeout);
          clearInterval(poll);
          resolve();
        } else if (server.exitCode !== null) {
          clearTimeout(timeout);
          clearInterval(poll);
          reject(new Error(logs));
        }
      }, 100);
    });
    const base = `http://127.0.0.1:${port}`;
    const headers = { Authorization: `Bearer ${key}` };
    const request = (path, options = {}) =>
      fetch(base + path, { headers, ...options });
    const post = (body) =>
      request("/api/reservations", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    for (const [path, method] of [
      ["/api/menu", "GET"],
      ["/api/availability", "GET"],
      ["/api/reservations", "POST"],
    ]) {
      for (const authorization of ["", "Bearer wrong", "Basic " + key]) {
        const response = await request(path, {
          method,
          headers: { Authorization: authorization },
        });
        assert.equal(response.status, 401);
        assert.equal(response.headers.get("www-authenticate"), "Bearer");
      }
    }
    const menu = await request("/api/menu?category=pizzas&query=margherita");
    assert.equal(menu.status, 200);
    assert.equal(menu.headers.get("cache-control"), "no-store");
    const { items } = await menu.json();
    assert.equal(items.length, 1);
    assert.equal(items[0].currency, "EUR");

    for (const query of [
      "",
      "date=2026-02-30&party_size=4",
      "date=2026-10-02&party_size=0",
      "date=2026-10-02&party_size=1.5",
    ]) {
      assert.equal((await request(`/api/availability?${query}`)).status, 400);
    }
    const closed = await request(
      "/api/availability?date=2026-10-05&party_size=8",
    );
    assert.deepEqual((await closed.json()).available_times, []);
    const availabilityPath = "/api/availability?date=2026-10-02&party_size=8";
    const availability = await request(availabilityPath);
    assert.equal(availability.status, 200);
    const times = (await availability.json()).available_times;
    assert.ok(times.length > 0);
    const booking = {
      guest_name: "Test Guest",
      guest_email: "test@example.com",
      booking_date: "2026-10-02",
      booking_time: times[0],
      party_size: 8,
    };
    for (const body of [
      null,
      [],
      {},
      { ...booking, party_size: "8" },
      { ...booking, booking_time: "25:00" },
      { ...booking, guest_email: "invalid" },
      { ...booking, booking_date: "2026-02-30" },
    ]) {
      assert.equal((await post(body)).status, 400);
    }
    assert.equal(
      (
        await request("/api/reservations", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).status,
      415,
    );
    assert.equal(
      (
        await request("/api/reservations", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
      400,
    );
    assert.equal(
      (await post({ ...booking, booking_time: "01:00" })).status,
      409,
    );
    const created = await post(booking);
    assert.equal(created.status, 201);
    const { reservation } = await created.json();
    assert.ok(Number.isInteger(reservation.id));
    assert.deepEqual(reservation, { id: reservation.id, ...booking });
    const refreshed = await request(availabilityPath);
    assert.ok(!(await refreshed.json()).available_times.includes(times[0]));
    const duplicate = await post(booking);
    assert.equal(duplicate.status, 409);
    assert.ok(!(await duplicate.json()).available_times.includes(times[0]));
    assert.equal(
      (await request("/api/orbitali", { method: "POST" })).status,
      404,
    );
    assert.equal((await request("/api/menu", { method: "POST" })).status, 405);
  },
);
