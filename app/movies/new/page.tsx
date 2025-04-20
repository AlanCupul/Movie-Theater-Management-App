"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchNewMovies() {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .gte("release_date", thirtyDaysAgo.toISOString())
        .lte("release_date", now.toISOString())
        .order("release_date", { ascending: false });
      if (error) {
        console.error("Error fetching new movies:", error);
      } else {
        setMovies(data || []);
      }
      setLoading(false);
    }
    fetchNewMovies();
  }, []);

  function formatReleaseDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">New Movies</h1>
        <Button asChild>
          <Link href="/movies">Back to Movies</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-16">Loading...</div>
      ) : movies.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No new movies found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {movies.map((movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full">
              {movie.movie_poster_url ? (
                <div className="w-full aspect-[27/40] bg-muted rounded-t overflow-hidden flex items-center justify-center">
                  <img
                    src={movie.movie_poster_url}
                    alt={movie.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center bg-muted rounded mb-3 text-muted-foreground">
                  No Image
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-4 pb-2">
                <CardTitle className="text-base text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
                <Link href={`/movies/${movie.movie_id}`} className="text-primary hover:underline text-xs font-medium">View Showings</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
