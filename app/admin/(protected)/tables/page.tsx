import { getFloorTables } from "@/lib/db";
import FloorPlan from "./FloorPlan";

export default function TablesPage() {
  return <FloorPlan initialTables={getFloorTables()} />;
}
