"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TicketConfirmationContent() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get ticket details from query parameters
    const ticket_id = searchParams.get("ticket_id");
    const show_time = searchParams.get("show_time");
    const movie_name = searchParams.get("movie_name");
    const theater_number = searchParams.get("theater_number");
    if (ticket_id && show_time && movie_name && theater_number) {
      setTicket({ ticket_id, show_time, movie_name, theater_number });
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!ticket) return <div className="text-center py-8">Ticket not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6 items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ticket Purchase Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div><span className="font-semibold">Movie:</span> {ticket.movie_name}</div>
          <div>
            <span className="font-semibold">Showtime:</span>{" "}
            {ticket.show_time
              ? new Date(ticket.show_time).toLocaleString("en-US", {
                  timeZone: "America/Chicago",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }) + " CST"
              : ""}
          </div>
          <div><span className="font-semibold">Theater #:</span> {ticket.theater_number}</div>
          <div><span className="font-semibold">Ticket ID:</span> {ticket.ticket_id}</div>
          <div className="flex gap-4 mt-6 justify-center">
            <Button asChild variant="outline">
              <a href="/showings">Back to Showings</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
