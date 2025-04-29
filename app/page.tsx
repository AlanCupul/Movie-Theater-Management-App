import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <h1 className="text-4xl font-bold text-center">Welcome to Your Local Movie Theater!</h1>
      <p className="text-lg text-center text-muted-foreground max-w-xl">
        Guests can browse movies and showings here!
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="mt-2">
          <Link href="/movies">Browse Movies</Link>
        </Button>
        <Button asChild size="lg" className="mt-2">
          <Link href="/showings">Browse Showings</Link>
        </Button>
      </div>
    </div>
  );
}
