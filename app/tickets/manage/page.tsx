"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Ticket {
  ticket_id: number;
  showing_id: number;
  seat_number: string;
  price: number;
  age: string;
}

export default function ManageTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.from("tickets_sold").select("*");
    if (error) setError(error.message);
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDelete = async (ticket_id: number) => {
    const supabase = createClient();
    // Fetch the ticket to get showing_id before deleting
    const { data: ticketData, error: fetchError } = await supabase.from("tickets_sold").select("showing_id").eq("ticket_id", ticket_id).single();
    if (fetchError) {
      setError("Failed to fetch ticket info: " + fetchError.message);
      return;
    }
    await supabase.from("tickets_sold").delete().eq("ticket_id", ticket_id);
    if (ticketData && ticketData.showing_id) {
      // Increment available_seats for the showing
      await supabase.rpc('decrement_available_seats', {
        showing_id_input: ticketData.showing_id,
        decrement_by: -1 // negative to increment
      });
    }
    fetchTickets();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Tickets</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Showing ID</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.ticket_id}>
                <TableCell className="text-center">{ticket.ticket_id}</TableCell>
                <TableCell className="text-center">{ticket.showing_id}</TableCell>
                <TableCell className="text-center">{ticket.seat_number}</TableCell>
                <TableCell className="text-center">${ticket.price.toFixed(2)}</TableCell>
                <TableCell className="text-center">{ticket.age}</TableCell>
                <TableCell className="text-center">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ticket.ticket_id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
