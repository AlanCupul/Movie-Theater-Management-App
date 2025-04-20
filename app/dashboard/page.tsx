"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8">
      <h1 className="text-3xl font-bold mb-2">Management Dashboard</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/movies/manage">Manage Movies</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/theaters/manage">Manage Theaters</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/showings/manage">Manage Showings</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/tickets/manage">Manage Tickets</Link>
        </Button>
      </div>
    </div>
  );
}
