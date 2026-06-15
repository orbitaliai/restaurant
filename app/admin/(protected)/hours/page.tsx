import {
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  TextInput,
} from "flowbite-react";
import { saveHours } from "@/lib/actions";
import { getHours } from "@/lib/db";

export default function HoursPage() {
  const hours = getHours();

  return (
    <div className="space-y-6">
      <div>
        <Badge color="warning" className="mb-3 w-fit">
          Availability
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hours of operation
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Reservation slots are generated every 30 minutes while the restaurant
          is open.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {hours.map((day) => (
          <Card key={day.weekday}>
            <form action={saveHours} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="weekday" value={day.weekday} />
              <div className="sm:col-span-2">
                <h2 className="text-xl font-semibold">{day.day_name}</h2>
              </div>
              <div>
                <Label htmlFor={`open-${day.weekday}`}>Open</Label>
                <TextInput
                  id={`open-${day.weekday}`}
                  name="openTime"
                  type="time"
                  defaultValue={day.open_time}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`close-${day.weekday}`}>Close</Label>
                <TextInput
                  id={`close-${day.weekday}`}
                  name="closeTime"
                  type="time"
                  defaultValue={day.close_time}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`closed-${day.weekday}`}
                  name="isClosed"
                  defaultChecked={Boolean(day.is_closed)}
                />
                <Label htmlFor={`closed-${day.weekday}`}>Closed</Label>
              </div>
              <Button type="submit">Save {day.day_name}</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
