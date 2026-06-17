import {
  Badge,
  Button,
  Card,
  Label,
  Navbar,
  NavbarBrand,
  Select,
} from "flowbite-react";
import Link from "next/link";
import { BookingSuccessDialog } from "@/app/BookingSuccessDialog";
import { bookTable } from "@/lib/actions";
import {
  getAvailableSlots,
  getHours,
  getMenuItems,
  menuCategories,
  type HoursRecord,
} from "@/lib/db";

type HomeProps = {
  searchParams: Promise<{
    date?: string;
    people?: string;
    booked?: string;
    status?: string;
  }>;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = params.date || today;
  const selectedPeople = Number(params.people || 2);
  const availableSlots = getAvailableSlots(selectedDate, selectedPeople);
  const menuItems = getMenuItems();
  const hours = getHours();
  const calendarDays = getCalendarDays(selectedDate);
  const hoursByWeekday = new Map(hours.map((day) => [day.weekday, day]));

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <Navbar
        fluid
        className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95"
      >
        <NavbarBrand as={Link} href="/">
          <span className="self-center text-xl font-semibold whitespace-nowrap">
            Good Food
          </span>
        </NavbarBrand>
        <div className="flex items-center gap-3">
          <Button as={Link} href="/admin/login" color="light" size="sm">
            Admin
          </Button>
        </div>
      </Navbar>

      <section className="relative min-h-[620px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gray-950/55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-24">
          <div className="flex max-w-3xl flex-col justify-center text-white">
            <Badge color="warning" className="mb-6 w-fit">
              Dinner, drinks, and weekend lunch
            </Badge>
            <h1 className="text-5xl font-bold tracking-normal sm:text-6xl">
              Good Food
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-100">
              A single-room neighborhood restaurant with seasonal plates, a
              focused wine list, and simple online reservations.
            </p>
          </div>

          <Card className="self-start">
            <form action="/" className="grid gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Find a table
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a day and party size to see live availability.
                </p>
              </div>
              <div>
                <Label htmlFor="people">People</Label>
                <Select
                  id="people"
                  name="people"
                  defaultValue={String(selectedPeople)}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((people) => (
                    <option key={people} value={people}>
                      {people} {people === 1 ? "person" : "people"}
                    </option>
                  ))}
                </Select>
              </div>
              <input type="hidden" name="date" value={selectedDate} />
              <Button type="submit">Check availability</Button>
            </form>

            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {formatMonth(selectedDate)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select a day
                  </p>
                </div>
                <Badge color="gray">
                  {selectedPeople} {selectedPeople === 1 ? "guest" : "guests"}
                </Badge>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {weekdayLabels.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) =>
                  day ? (
                    <CalendarDay
                      key={day.date}
                      day={day}
                      hours={hoursByWeekday.get(day.weekday)}
                      isSelected={day.date === selectedDate}
                      isPast={day.date < today}
                      people={selectedPeople}
                    />
                  ) : (
                    <div key={`blank-${index}`} className="aspect-square" />
                  ),
                )}
              </div>
            </div>

            {params.status && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {params.status}
              </div>
            )}

            <div className="border-t border-gray-200 pt-5 dark:border-gray-700">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                Available times
              </h3>
              {availableSlots.length > 0 ? (
                <form action={bookTable} className="grid gap-3">
                  <input
                    type="hidden"
                    name="bookingDate"
                    value={selectedDate}
                  />
                  <input
                    type="hidden"
                    name="partySize"
                    value={selectedPeople}
                  />
                  <div>
                    <Label htmlFor="bookingTime">Time</Label>
                    <Select id="bookingTime" name="bookingTime" required>
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <input
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    name="guestName"
                    placeholder="Guest name"
                    required
                  />
                  <input
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    name="guestEmail"
                    placeholder="Email"
                    type="email"
                    required
                  />
                  <Button type="submit" color="dark">
                    Book table
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tables are available for this party size on the selected
                  day.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {params.booked && (
        <BookingSuccessDialog
          date={selectedDate}
          partySize={selectedPeople}
          time={params.booked}
        />
      )}

      <section className="border-y border-gray-200 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {hours.map((day) => (
            <div
              key={day.weekday}
              className="rounded-lg bg-white p-4 dark:bg-gray-800"
            >
              <div className="text-sm font-semibold">{day.day_name}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {day.is_closed
                  ? "Closed"
                  : `${day.open_time} - ${day.close_time}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge color="success" className="mb-3 w-fit">
              Pizza Roma menu
            </Badge>
            <h2 className="text-3xl font-bold">Italian favorites</h2>
          </div>
          <p className="max-w-xl text-sm text-gray-500 dark:text-gray-400">
            A fuller Pizza Roma-style spread with salads, antipasti, pizzas,
            pasta, grilled mains, desserts, and drinks.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {menuCategories.map((category) => (
            <Card key={category} className="[&>div]:justify-start">
              <h3 className="text-xl font-semibold">{category}</h3>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div key={item.id} className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                        <div className="font-semibold">
                          {(item.price_cents / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function CalendarDay({
  day,
  hours,
  isSelected,
  isPast,
  people,
}: {
  day: CalendarDate;
  hours: HoursRecord | undefined;
  isSelected: boolean;
  isPast: boolean;
  people: number;
}) {
  const isClosed = !hours || Boolean(hours.is_closed);
  const disabled = isPast || isClosed;
  const baseClass =
    "flex aspect-square min-h-10 items-center justify-center rounded-lg border text-sm font-medium transition";

  if (disabled) {
    return (
      <div
        className={`${baseClass} border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600`}
        title={isPast ? "Past date" : "Closed"}
      >
        {day.dayOfMonth}
      </div>
    );
  }

  return (
    <Link
      href={`/?date=${day.date}&people=${people}`}
      className={
        isSelected
          ? `${baseClass} border-blue-700 bg-blue-700 text-white`
          : `${baseClass} border-gray-200 bg-white text-gray-900 hover:border-blue-700 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-500 dark:hover:text-blue-400`
      }
    >
      {day.dayOfMonth}
    </Link>
  );
}

type CalendarDate = {
  date: string;
  dayOfMonth: number;
  weekday: number;
};

function getCalendarDays(selectedDate: string) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const monthStart = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    1,
    12,
  );
  const monthEnd = new Date(
    selected.getFullYear(),
    selected.getMonth() + 1,
    0,
    12,
  );
  const days: Array<CalendarDate | null> = Array.from(
    { length: monthStart.getDay() },
    () => null,
  );

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const date = new Date(selected.getFullYear(), selected.getMonth(), day, 12);

    days.push({
      date: date.toISOString().slice(0, 10),
      dayOfMonth: day,
      weekday: date.getDay(),
    });
  }

  return days;
}

function formatMonth(selectedDate: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedDate}T12:00:00`));
}
