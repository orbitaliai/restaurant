import {
  Badge,
  Button,
  Card,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Textarea,
} from "flowbite-react";
import { addMenuItem } from "@/lib/actions";
import { getMenuItems, menuCategories } from "@/lib/db";

export default function MenuPage() {
  const menuItems = getMenuItems();

  return (
    <div className="grid h-full min-h-0 items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="self-start">
        <Badge color="success" className="mb-2 w-fit">
          Menu
        </Badge>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add menu item
        </h1>
        <form action={addMenuItem} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" required>
              {menuCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <TextInput
              id="name"
              name="name"
              placeholder="Grilled prawns"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Short menu copy"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <TextInput
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="14.50"
              required
            />
          </div>
          <Button type="submit">Add item</Button>
        </form>
      </Card>

      <Card className="flex h-full min-h-0 flex-col">
        <h2 className="text-xl font-semibold">Menu items</h2>
        <div className="min-h-0 flex-1 overflow-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {menuItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{(item.price_cents / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
