import {
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { saveHours } from "@/lib/actions";
import { getHours } from "@/lib/db";

export default function HoursPage() {
  const hours = getHours();

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0">
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

      <Card className="min-h-0 flex-1">
        <form action={saveHours} className="flex h-full min-h-0 flex-col gap-5">
          <div className="min-h-0 flex-1 overflow-auto">
            <Table hoverable>
              <TableHead>
                <TableHeadCell>Day</TableHeadCell>
                <TableHeadCell>Open</TableHeadCell>
                <TableHeadCell>Close</TableHeadCell>
                <TableHeadCell>Closed</TableHeadCell>
              </TableHead>
              <TableBody className="divide-y">
                {hours.map((day) => (
                  <TableRow
                    key={day.weekday}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {day.day_name}
                      <input
                        type="hidden"
                        name="weekday"
                        value={day.weekday}
                      />
                    </TableCell>
                    <TableCell>
                      <Label
                        htmlFor={`open-${day.weekday}`}
                        className="sr-only"
                      >
                        {day.day_name} opening time
                      </Label>
                      <input
                        id={`open-${day.weekday}`}
                        name={`openTime-${day.weekday}`}
                        type="time"
                        defaultValue={day.open_time}
                        required
                        className="w-36 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <Label
                        htmlFor={`close-${day.weekday}`}
                        className="sr-only"
                      >
                        {day.day_name} closing time
                      </Label>
                      <input
                        id={`close-${day.weekday}`}
                        name={`closeTime-${day.weekday}`}
                        type="time"
                        defaultValue={day.close_time}
                        required
                        className="w-36 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`closed-${day.weekday}`}
                          name={`isClosed-${day.weekday}`}
                          defaultChecked={Boolean(day.is_closed)}
                        />
                        <Label htmlFor={`closed-${day.weekday}`}>Closed</Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-700">
            <Button type="submit">Save hours</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
