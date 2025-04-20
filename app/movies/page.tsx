"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchMovies() {
      setLoading(true);
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      // Fetch all movies
      const { data: all, error: allError } = await supabase
        .from("movies")
        .select("*")
        .eq("status", true)
        .order("release_date", { ascending: false });
      if (allError) {
        console.error("Error fetching all movies:", allError);
        setAllMovies([]);
      } else {
        setAllMovies(all || []);
      }
      // Fetch new movies (last 30 days)
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .gte("release_date", thirtyDaysAgo.toISOString())
        .lte("release_date", now.toISOString())
        .order("release_date", { ascending: false });
      if (error) {
        console.error("Error fetching new movies:", error);
        setMovies([]);
      } else {
        setMovies(data || []);
      }
      setLoading(false);
    }
    // Fetch upcoming movies (release_date > now, earliest first, limit 4)
    async function fetchUpcomingMovies() {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .gt("release_date", now)
        .order("release_date", { ascending: true })
        .limit(4);
      if (error) {
        console.error("Error fetching upcoming movies:", error);
      } else {
        setUpcomingMovies(data || []);
      }
    }
    async function fetchFeaturedMovies() {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("featured", true)
        .order("movie_id", { ascending: false })
        .limit(3);
      if (error) {
        console.error("Error fetching featured movies:", error);
      } else {
        setFeaturedMovies(data || []);
      }
    }
    fetchMovies();
    fetchUpcomingMovies();
    fetchFeaturedMovies();
  }, []);

  // Utility to format release date
  function formatReleaseDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // New: next 4, Browse: rest
  const newMovies = movies.slice(0, 4);
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
          {featuredMovies.map((movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-muted rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-4 pb-2">
                <CardTitle className="text-lg text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
                <Link href={`/movies/${movie.movie_id}`} className="text-primary hover:underline text-xs font-medium">View Showings</Link>
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
          {newMovies.map((movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-muted rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
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
          {upcomingMovies.map((movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-muted rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
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
      </section>

      {/* Browse Movies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Browse Movies</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {browseMovies.map((movie) => (
            <Card key={movie.movie_id} className="flex flex-col h-full">
              {movie.movie_poster_url && (
                <div className="w-full aspect-[27/40] bg-muted rounded-t overflow-hidden flex items-center justify-center">
                  <img src={movie.movie_poster_url} alt={movie.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader className="flex-1 flex flex-col items-center p-2 pb-1">
                <CardTitle className="text-xs text-center w-full line-clamp-2 font-medium">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-1 pb-2">
                <Link href={`/movies/${movie.movie_id}`} className="text-primary hover:underline text-xs font-medium">View Showings</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {loading && <div className="text-center text-muted-foreground">Loading movies...</div>}
      {!loading && movies.length === 0 && <div className="text-center text-muted-foreground">No movies found.</div>}
    </div>
  );
}
