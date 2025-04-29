"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

interface Movie {
  movie_id: number;
  name: string;
  genre?: string;
  duration?: number;
  status: boolean;
  movie_poster_url?: string;
  release_date?: string;
  featured?: boolean;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAllMovies() {
      setLoading(true);
      try {
        const res = await fetch("/api/movies");
        if (!res.ok) throw new Error("Failed to fetch movies");
        const data: Movie[] = await res.json();
        setAllMovies(data || []);

        // New Movies: released in last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const newMovies = data.filter(movie => movie.release_date && new Date(movie.release_date) >= thirtyDaysAgo && new Date(movie.release_date) <= now)
          .sort((a, b) => new Date(b.release_date!).getTime() - new Date(a.release_date!).getTime())
          .slice(0, 4);
        setMovies(newMovies);

        // Upcoming Movies: release_date > now, order ascending, limit 4
        const upcoming = data.filter(movie => movie.release_date && new Date(movie.release_date) > now)
          .sort((a, b) => new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime())
          .slice(0, 4);
        setUpcomingMovies(upcoming);

        // Featured Movies: featured true, order by movie_id desc, limit 3
        const featured = data.filter(movie => !!movie.featured)
          .sort((a, b) => (b.movie_id ?? 0) - (a.movie_id ?? 0))
          .slice(0, 3);
        setFeaturedMovies(featured);
      } catch (error: any) {
        toast({ title: "Error", description: "Error fetching movies: " + (error.message || error), variant: "destructive" });
      }
      setLoading(false);
    }
    fetchAllMovies();
  }, []);

  // New: next 4, Browse: rest
  const newMovies = movies;
  const browseMovies = allMovies;

  return (
    <div className="max-w-6xl mx-auto pt-2 pb-6 flex flex-col gap-12">
      <h1 className="text-3xl font-bold">Movies</h1>

      {/* Featured Movies */}
      <section className="mt-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-semibold">Featured Movies</h2>
          <Button asChild>
            <Link href="/movies/featured">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredMovies.map((movie: Movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full bg-[#dd0000] text-white border-none shadow-lg">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-[#c00000] rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-4 pb-2">
                <CardTitle className="text-lg text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
                <Link href={`/movies/${movie.movie_id}`} className="text-white/80 hover:text-white hover:underline text-xs font-medium inline-flex items-center gap-1">View Showings <ArrowRight size={14} /></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* New Movies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">New Movies</h2>
          <Button asChild>
            <Link href="/movies/new">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newMovies.map((movie: Movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full bg-[#dd0000] text-white border-none shadow-lg">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-[#c00000] rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
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
      </section>

      {/* Upcoming Movies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Upcoming Movies</h2>
          <Button asChild>
            <Link href="/movies/upcoming">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {upcomingMovies.length === 0 && <div className="col-span-full text-muted-foreground text-center">No upcoming movies found.</div>}
          {upcomingMovies.map((movie: Movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full bg-[#dd0000] text-white border-none shadow-lg">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-[#c00000] rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
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
      </section>

      {/* Browse Movies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Browse Movies</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {browseMovies.map((movie: Movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full bg-[#dd0000] text-white border-none shadow-lg">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-[#c00000] rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-2 pb-1">
                <CardTitle className="text-base text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-1 pb-2">
                <Link href={`/movies/${movie.movie_id}`} className="text-white/80 hover:text-white hover:underline text-xs font-medium inline-flex items-center gap-1">View Showings <ArrowRight size={14} /></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {loading && <div className="text-center text-muted-foreground">Loading movies...</div>}
      {!loading && newMovies.length === 0 && <div className="text-center text-muted-foreground">No movies found.</div>}
    </div>
  );
}
