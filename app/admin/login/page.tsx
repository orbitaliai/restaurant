import { Button, Card, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { loginAdmin } from "@/lib/actions";

type LoginProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <div>
          <Link href="/" className="text-sm text-blue-700 dark:text-blue-400">
            Back to restaurant
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Use admin / admin for this proof of concept.
          </p>
        </div>

        {params.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            Invalid username or password.
          </div>
        )}

        <form action={loginAdmin} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <TextInput
              id="username"
              name="username"
              defaultValue="admin"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <TextInput
              id="password"
              name="password"
              type="password"
              defaultValue="admin"
              required
            />
          </div>
          <Button type="submit">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}
