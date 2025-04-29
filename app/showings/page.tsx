"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface Showing {
  showing_id: number;
  movie_id: number;
  theater_id: number;
  show_time: string;
  available_seats: number;
  movie?: { name: string; movie_poster_url?: string };
  theater?: { theater_number: number };
}

interface MovieGroup {
  movie_id: number;
  name: string;
  movie_poster_url?: string;
  showings: Showing[];
}

export default function ShowingsPage() {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);

  useEffect(() => {
    async function fetchShowings() {
      setLoading(true);
      try {
        // Fetch showings with movie and theater info (including poster)
        const res = await fetch("/api/showings");
        if (!res.ok) throw new Error("Failed to fetch showings");
        let data = await res.json();
        // Fetch movies and theaters for enrichment
        const [moviesRes, theatersRes] = await Promise.all([
          fetch("/api/movies"),
          fetch("/api/theaters"),
        ]);
        let movies = [];
        let theaters = [];
        if (moviesRes.ok) movies = await moviesRes.json();
        if (theatersRes.ok) theaters = await theatersRes.json();
        // Map movie_id to movie object
        const movieMap = Object.fromEntries(movies.map((m: any) => [Number(m.movie_id), m]));
        const theaterMap = Object.fromEntries(theaters.map((t: any) => [Number(t.theater_id), t]));
        // Attach movie and theater info to each showing
        data = data.map((showing: any) => ({
          ...showing,
          movie: movieMap[Number(showing.movie_id)]
            ? { name: movieMap[Number(showing.movie_id)].name, movie_poster_url: movieMap[Number(showing.movie_id)].movie_poster_url }
            : undefined,
          theater: theaterMap[Number(showing.theater_id)]
            ? { theater_number: theaterMap[Number(showing.theater_id)].theater_number }
            : undefined,
        }));
        setShowings(data || []);
      } catch (error) {
        console.error("Error fetching showings:", error);
        setShowings([]);
      }
      setLoading(false);
    }
    fetchShowings();
    // Set up 8 upcoming days + today
    const base = new Date();
    setDateOptions(Array.from({ length: 9 }, (_, i) => addDays(base, i)));
  }, []);

  function formatShowTime(showTime: string) {
    if (!showTime) return "";
    return new Date(showTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  // Filter showings for selected date
  const showingsForSelectedDate = showings.filter(showing =>
    isSameDay(parseISO(showing.show_time), selectedDate)
  );

  // Group showings by movie
  const groupedByMovie: MovieGroup[] = [];
  for (const showing of showingsForSelectedDate) {
    let group = groupedByMovie.find(g => g.movie_id === showing.movie_id);
    if (!group) {
      group = {
        movie_id: showing.movie_id,
        name: showing.movie?.name || `Movie #${showing.movie_id}`,
        movie_poster_url: showing.movie?.movie_poster_url,
        showings: [],
      };
      groupedByMovie.push(group);
    }
    group.showings.push(showing);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-bold">Movie Showings</h1>
          <Button asChild>
            <Link href="/showings/manage">Manage Showings</Link>
          </Button>
        </div>
      </div>
      {/* Date Selector Bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 items-center">
        {dateOptions.map((date, idx) => (
          <button
            key={date.toISOString()}
            className={`px-4 py-2 rounded border font-medium whitespace-nowrap transition-colors ${isSameDay(date, selectedDate) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-muted'} ${idx === 0 ? 'font-bold' : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            {idx === 0 ? 'Today' : format(date, 'MMMM d')}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-2 min-w-[140px] justify-start">
              <span className="truncate">
                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
              </span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={date => date && setSelectedDate(date)}
              initialFocus
              fromDate={new Date()}
              toDate={addDays(new Date(), 29)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : groupedByMovie.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No showings for this date.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupedByMovie.map(movie => (
            <Card key={movie.movie_id} className="flex flex-col items-center">
              {movie.movie_poster_url ? (
                <img
                  src={movie.movie_poster_url}
                  alt={movie.name}
                  className="w-32 h-48 object-cover rounded mb-2 border"
                />
              ) : (
                <div className="w-32 h-48 bg-muted rounded mb-2 flex items-center justify-center text-xs text-muted-foreground border">No Poster</div>
              )}
              <CardHeader className="flex flex-col items-center p-2 pb-0 w-full">
                <CardTitle className="text-lg text-center w-full line-clamp-2">{movie.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 w-full pt-2">
                <div className="flex flex-wrap gap-2 w-full">
                  {movie.showings.map(showing => (
                    <Button
                      key={showing.showing_id}
                      variant="secondary"
                      className="px-4 py-2 text-sm bg-[#dd0000] hover:bg-[#c00000] text-white"
                      onClick={() => window.location.href = `/showings/${showing.showing_id}`}
                    >
                      {formatShowTime(showing.show_time)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
