"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function PurchaseTicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showing_id = searchParams.get("showing_id");
  const [seats, setSeats] = useState<string[]>([]);
  const [seat, setSeat] = useState<string>("");
  const [age, setAge] = useState<string>("adult");
  const getPrice = (age: string) => {
    if (age === "kid") return 8;
    if (age === "senior") return 6;
    return 10;
  };
  const price = getPrice(age);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    // Need to figure out how to fetch available seats for the showing. For now these are just static
    setSeats([
      "A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4"
    ]);
  }, []);

  const handleSeatSelect = (seat: string) => {
    setSeat(seat);
  };

  const handlePurchase = async () => {
    if (!showing_id || !seat) {
      setError("Please select a seat.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = createClient();
    const ticket = {
      showing_id: Number(showing_id),
      seat_number: seat,
      price,
      age,
    };
    const { data, error } = await supabase.from("tickets_sold").insert([ticket]).select().single();
    if (!error && data) {
      // Decrement available_seats in showings table
      await supabase.rpc('decrement_available_seats', {
        showing_id_input: Number(showing_id),
        decrement_by: 1
      });
      // Fetch showing, movie, and theater details for confirmation
      const { data: showingDetails } = await supabase
        .from('showings')
        .select('show_time, movie_id, theater_id')
        .eq('showing_id', showing_id)
        .single();

      let movieName = '';
      let theaterNumber = '';
      if (showingDetails) {
        // Fetch movie name
        const { data: movie } = await supabase
          .from('movies')
          .select('name')
          .eq('movie_id', showingDetails.movie_id)
          .single();
        movieName = movie?.name || '';
        // Fetch theater number
        const { data: theater } = await supabase
          .from('theaters')
          .select('theater_number')
          .eq('theater_id', showingDetails.theater_id)
          .single();
        theaterNumber = theater?.theater_number?.toString() || '';
      }
      // Redirect to confirmation page with ticket details as query params
      const params = new URLSearchParams({
        ticket_id: data.ticket_id,
        show_time: showingDetails?.show_time || '',
        movie_name: movieName,
        theater_number: theaterNumber
      });
      router.push(`/tickets/confirmation?${params.toString()}`);
    } else {
      setError("Purchase failed: " + (error?.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold mb-2">Purchase Ticket</h1>
      <div>
        <h2 className="font-semibold mb-2">Select Seat</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {seats.map((s) => (
            <button
              key={s}
              type="button"
              className={`border rounded px-2 py-1 text-sm ${seat === s ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => handleSeatSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Age Category</label>
        <RadioGroup value={age} onValueChange={setAge} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="adult" id="age-adult" />
            <label htmlFor="age-adult" className="text-sm">Adult</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="kid" id="age-kid" />
            <label htmlFor="age-kid" className="text-sm">Kid</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="senior" id="age-senior" />
            <label htmlFor="age-senior" className="text-sm">Senior</label>
          </div>
        </RadioGroup>
      </div>
      <div className="mb-4">
        <span className="font-medium">Price:</span> ${price}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <Button onClick={handlePurchase} disabled={loading || !seat}>
        {loading ? "Purchasing..." : "Purchase Ticket"}
      </Button>
    </div>
  );
}
