import { authorize, json } from "@/lib/api";
import { getMenuItems, menuCategories } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  const category = params.get("category")?.trim().toLowerCase();
  const query = params.get("query")?.trim().toLowerCase();
  const items = getMenuItems()
    .filter(
      (item) =>
        (!category || item.category.toLowerCase() === category) &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)),
    )
    .map((item) => ({
      id: item.id,
      category: item.category,
      name: item.name,
      description: item.description,
      price: Number((item.price_cents / 100).toFixed(2)),
      currency: "EUR",
    }));
  return json({ categories: menuCategories, items });
}
