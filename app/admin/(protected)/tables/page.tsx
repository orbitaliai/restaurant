import {
  Badge,
  Button,
  Card,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { addTable } from "@/lib/actions";
import { getTables } from "@/lib/db";

export default function TablesPage() {
  const tables = getTables();

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <Badge color="success" className="mb-2 w-fit">
          Floor plan
        </Badge>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add table
        </h1>
        <form action={addTable} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Table name</Label>
            <TextInput id="name" name="name" placeholder="Patio 2" required />
          </div>
          <div>
            <Label htmlFor="capacity">Seats</Label>
            <TextInput
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              max="20"
              defaultValue="4"
              required
            />
          </div>
          <Button type="submit">Create table</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Tables</h2>
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Capacity</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {tables.map((table) => (
                <TableRow
                  key={table.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
