import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { getBookings } from "@/lib/db";

export default function BookingsPage() {
  const bookings = getBookings();

  return (
    <div className="space-y-6">
      <div>
        <Badge color="purple" className="mb-3 w-fit">
          Reservations
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bookings
        </h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>Guest</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Time</TableHeadCell>
              <TableHeadCell>Party</TableHeadCell>
              <TableHeadCell>Table</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {bookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell className="font-medium">
                    {booking.guest_name}
                  </TableCell>
                  <TableCell>{booking.guest_email}</TableCell>
                  <TableCell>{booking.booking_date}</TableCell>
                  <TableCell>{booking.booking_time}</TableCell>
                  <TableCell>{booking.party_size}</TableCell>
                  <TableCell>
                    {booking.table_name} ({booking.table_capacity})
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-gray-500">
                    No bookings yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
