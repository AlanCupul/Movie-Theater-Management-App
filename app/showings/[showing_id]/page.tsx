"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export default function ShowingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const showingId = Number(params?.showing_id);
  const [showing, setShowing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showingId) return;
    const supabase = createClient();
    async function fetchShowing() {
      setLoading(true);
      const { data, error } = await supabase
        .from("showings")
        .select("*, movie:movies(name, movie_poster_url), theater:theaters(theater_number)")
        .eq("showing_id", showingId)
        .single();
      if (error) {
        setShowing(null);
      } else {
        setShowing(data);
      }
      setLoading(false);
    }
    fetchShowing();
  }, [showingId]);

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-center">Loading...</div>;
  if (!showing) return <div className="max-w-2xl mx-auto p-6 text-center text-muted-foreground">Showing not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button asChild variant="outline" className="mb-4">
        <Link href="/showings">Back to Showings</Link>
      </Button>
      <Card>
        <CardHeader className="flex flex-col items-center">
          {showing.movie?.movie_poster_url ? (
            <img src={showing.movie.movie_poster_url} alt={showing.movie.name} className="w-32 h-48 object-cover rounded mb-2 border" />
          ) : (
            <div className="w-32 h-48 bg-muted rounded mb-2 flex items-center justify-center text-xs text-muted-foreground border">No Poster</div>
          )}
          <CardTitle className="text-xl text-center w-full line-clamp-2">{showing.movie?.name || `Movie #${showing.movie_id}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div><strong>Theater:</strong> {showing.theater ? `Theater ${showing.theater.theater_number}` : `Theater #${showing.theater_id}`}</div>
          <div><strong>Show Time:</strong> {format(new Date(showing.show_time), 'MMMM d, yyyy h:mm a')}</div>
          <div><strong>Available Seats:</strong> {showing.available_seats}</div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-6">
        <Button asChild size="lg">
          <Link href={`/tickets/purchase?showing_id=${showingId}`}>Purchase Tickets</Link>
        </Button>
      </div>
    </div>
  );
}
