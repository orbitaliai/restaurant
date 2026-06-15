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
import { getDashboardStats } from "@/lib/db";

export default function AdminDashboard() {
  const { totals, nextBookings } = getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <Badge color="info" className="mb-3 w-fit">
          Admin
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Manage this restaurant&apos;s reservations, tables, opening hours, and
          menu.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Bookings
          </div>
          <div className="text-3xl font-bold">{totals.bookings}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tables</div>
          <div className="text-3xl font-bold">{totals.tables}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Menu items
          </div>
          <div className="text-3xl font-bold">{totals.menuItems}</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold">Upcoming bookings</h2>
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>Guest</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Time</TableHeadCell>
              <TableHeadCell>Party</TableHeadCell>
              <TableHeadCell>Table</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {nextBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell>{booking.guest_name}</TableCell>
                  <TableCell>{booking.booking_date}</TableCell>
                  <TableCell>{booking.booking_time}</TableCell>
                  <TableCell>{booking.party_size}</TableCell>
                  <TableCell>{booking.table_name}</TableCell>
                </TableRow>
              ))}
              {nextBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-gray-500">
                    No upcoming bookings yet.
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
