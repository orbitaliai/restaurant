import {
  Button,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAdminSession, logoutAdmin } from "@/lib/actions";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await ensureAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const items = [
    ["Dashboard", "/admin"],
    ["Bookings", "/admin/bookings"],
    ["Tables", "/admin/tables"],
    ["Hours", "/admin/hours"],
    ["Menu", "/admin/menu"],
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white md:block dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Good Food
            </Link>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Restaurant admin
            </p>
          </div>
          <Sidebar aria-label="Admin navigation" className="h-auto">
            <SidebarItems>
              <SidebarItemGroup>
                {items.map(([label, href]) => (
                  <SidebarItem key={href} as={Link} href={href}>
                    {label}
                  </SidebarItem>
                ))}
              </SidebarItemGroup>
            </SidebarItems>
          </Sidebar>
          <form action={logoutAdmin} className="p-6">
            <Button type="submit" color="light" className="w-full">
              Sign out
            </Button>
          </form>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-gray-200 bg-white p-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="font-semibold">
                Good Food Admin
              </Link>
              <form action={logoutAdmin}>
                <Button type="submit" color="light" size="xs">
                  Sign out
                </Button>
              </form>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto">
              {items.map(([label, href]) => (
                <Button
                  key={href}
                  as={Link}
                  href={href}
                  color="light"
                  size="xs"
                >
                  {label}
                </Button>
              ))}
            </nav>
          </header>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
