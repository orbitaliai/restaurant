export const ROOM_WIDTH = 1000;
export const MIN_SIZE = 80;
export const MAX_SIZE = 320;
export type TableLayout = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rectangle" | "round";
};
export type FloorTable = TableLayout & { name: string; capacity: number };
export function isValidLayout(table: TableLayout) {
  return (
    table != null &&
    Number.isInteger(table.id) &&
    table.id > 0 &&
    [table.x, table.y, table.width, table.height].every(Number.isFinite) &&
    table.x >= 24 &&
    table.y >= 24 &&
    table.x + table.width <= ROOM_WIDTH - 24 &&
    table.y + table.height <= 10000 &&
    table.width >= MIN_SIZE &&
    table.width <= MAX_SIZE &&
    table.height >= MIN_SIZE &&
    table.height <= MAX_SIZE &&
    (table.shape === "rectangle" || table.shape === "round")
  );
}
