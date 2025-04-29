"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import Link from "next/link";

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.movie_id);
  const [movie, setMovie] = useState<any>(null);
  const [showings, setShowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);
  const [description, setDescription] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;
    async function fetchMovieAndShowings() {
      setLoading(true);
      // Fetch movie details from Prisma API
      const movieRes = await fetch(`/api/movies/${movieId}`);
      let movieData = null;
      if (movieRes.ok) movieData = await movieRes.json();
      let showingsData: any[] = [];
      if (movieData) {
        // Fetch showings for this movie, including theater info
        const showingsRes = await fetch(`/api/showings?movie_id=${movieId}`);
        if (showingsRes.ok) {
          showingsData = await showingsRes.json();
          // If showings don't have theater info, fetch all theaters and attach
          if (showingsData.length && !showingsData[0].theater) {
            const theatersRes = await fetch("/api/theaters");
            let theaters = [];
            if (theatersRes.ok) theaters = await theatersRes.json();
            const theaterMap = Object.fromEntries(theaters.map((t: any) => [Number(t.theater_id), t]));
            showingsData = showingsData.map((showing: any) => ({
              ...showing,
              theater: theaterMap[Number(showing.theater_id)]
                ? { theater_number: theaterMap[Number(showing.theater_id)].theater_number }
                : undefined,
            }));
          }
        }
      }
      setMovie(movieData);
      setShowings(showingsData);
      setLoading(false);
    }
    fetchMovieAndShowings();
    // Set up 8 upcoming days + today
    const base = new Date();
    setDateOptions(Array.from({ length: 9 }, (_, i) => addDays(base, i)));
  }, [movieId]);

  useEffect(() => {
    async function fetchDescription() {
      setDescLoading(true);
      if (!movie?.name) return;
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieTitle: movie.name }),
      });
      const data = await res.json();
      setDescription(data.description);
      setDescLoading(false);
    }
    fetchDescription();
  }, [movie?.name]);

  function formatShowTime(showTime: string) {
    if (!showTime) return "";
    return new Date(showTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  // Filter showings for selected date
  const showingsForSelectedDate = showings.filter(showing =>
    isSameDay(parseISO(showing.show_time), selectedDate)
  );

  if (loading) return <div className="max-w-6xl mx-auto p-6 text-center">Loading...</div>;
  if (!movie) return <div className="max-w-6xl mx-auto p-6 text-center text-muted-foreground">Movie not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Movie Details</h1>
        <Button asChild variant="outline">
          <Link href="/movies">Back to Movies</Link>
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
        {movie.movie_poster_url ? (
          <img
            src={movie.movie_poster_url}
            alt={movie.name}
            className="w-60 h-96 object-cover rounded border shadow"
          />
        ) : (
          <div className="w-60 h-96 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground border">No Poster</div>
        )}
        <div className="flex-1 flex flex-col gap-4 bg-[#dd0000] text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">{movie.name}</h1>
          <div className="text-white/80">Release Date: {movie.release_date ? format(parseISO(movie.release_date), 'MMMM d, yyyy') : 'Unknown'}</div>
          {typeof movie.duration === "number" && <div>Duration: {movie.duration} min</div>}
          {typeof movie.rating === "number" && <div>Rating: {movie.rating.toFixed(1)} / 10</div>}
          {movie.featured && <div className="text-white/80 font-semibold">Featured</div>}
          {descLoading ? (
            <div className="text-white/80">Generating description with AI...</div>
          ) : (
            <div className="mb-4"><span className="font-medium">Movie Description:</span> {description}</div>
          )}
        </div>
      </div>
      {/* Date Selector Bar (same as Showings page) */}
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
      {/* Showings for selected date */}
      <div className="flex flex-wrap gap-2 w-full mb-4">
        {showingsForSelectedDate.length === 0 ? (
          <div className="text-muted-foreground">No showings for this date.</div>
        ) : (
          showingsForSelectedDate.map(showing => (
            <Button
              key={showing.showing_id}
              variant="secondary"
              className="px-4 py-2 text-sm bg-[#dd0000] hover:bg-[#c00000] text-white"
              onClick={() => router.push(`/showings/${showing.showing_id}`)}
            >
              {formatShowTime(showing.show_time)}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
