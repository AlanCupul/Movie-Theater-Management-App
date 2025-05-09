"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Movie {
  movie_id: number;
  name: string;
  movie_poster_url?: string;
  release_date?: string;
}

export default function NewMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewMovies() {
      setLoading(true);
      try {
        const res = await fetch("/api/movies");
        if (!res.ok) throw new Error("Failed to fetch movies");
        const data: Movie[] = await res.json();
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const newMovies = data.filter(movie => movie.release_date && new Date(movie.release_date) >= thirtyDaysAgo && new Date(movie.release_date) <= now)
          .sort((a, b) => new Date(b.release_date!).getTime() - new Date(a.release_date!).getTime());
        setMovies(newMovies);
      } catch (error) {
        setMovies([]);
      }
      setLoading(false);
    }
    fetchNewMovies();
  }, []);

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
            <Card key={movie.movie_id} className="flex flex-col h-full bg-[#dd0000] text-white border-none shadow-lg">
              {movie.movie_poster_url ? (
                <div className="w-full aspect-[27/40] bg-[#c00000] rounded-t overflow-hidden flex items-center justify-center">
                  <img
                    src={movie.movie_poster_url}
                    alt={movie.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center bg-[#c00000] rounded mb-3 text-white">
                  No Image
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-4 pb-2">
                <CardTitle className="text-base text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
              <Link href={`/movies/${movie.movie_id}`} className="text-white/80 hover:text-white hover:underline text-xs font-medium inline-flex items-center gap-1">View Showings <ArrowRight size={14} /></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
