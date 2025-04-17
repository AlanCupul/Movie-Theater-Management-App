"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpcomingMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchUpcomingMovies() {
      const now = new Date().toISOString();
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .gt("release_date", now)
        .order("release_date", { ascending: true });
      if (error) {
        console.error("Error fetching upcoming movies:", error);
      } else {
        setMovies(data || []);
      }
      setLoading(false);
    }
    fetchUpcomingMovies();
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Upcoming Movies</h1>
        <Button asChild>
          <Link href="/movies">Back to Movies</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-16">Loading...</div>
      ) : movies.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No upcoming movies found.</div>
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
                <div className="text-xs text-muted-foreground mb-1 text-center w-full">
                  {formatReleaseDate(movie.release_date)}
                </div>
                {typeof movie.rating === "number" && (
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1 text-center font-semibold w-full">
                    Rating: {movie.rating.toFixed(1)} / 10
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
                {movie.duration && (
                  <div className="text-xs text-muted-foreground mb-2">{movie.duration} min</div>
                )}
                <Link href={`/movies/${movie.movie_id}`} className="text-primary hover:underline text-xs font-medium">Details</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
