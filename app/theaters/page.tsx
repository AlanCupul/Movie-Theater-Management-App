"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Theater {
  theater_id: number;
  theater_number: number;
  seat_capacity: number;
  status: boolean;
}

export default function TheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchTheaters() {
      setLoading(true);
      const { data, error } = await supabase
        .from("theaters")
        .select("*")
        .eq("status", true)
        .order("theater_number");
      if (error) {
        console.error("Error fetching theaters:", error);
      } else {
        setTheaters(data || []);
      }
      setLoading(false);
    }
    fetchTheaters();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-bold">Active Theaters</h1>
          <Button asChild>
            <Link href="/theaters/manage">Manage Theaters</Link>
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-16">Loading...</div>
      ) : theaters.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No theaters found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {theaters.map((theater) => (
            <Card key={theater.theater_id} className="flex flex-col h-full">
              <CardHeader className="flex flex-col items-center p-4 pb-2">
                <CardTitle className="text-lg text-center w-full font-semibold">
                  Theater {theater.theater_number}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pb-4">
                <div className="text-sm text-muted-foreground">Seat Capacity: {theater.seat_capacity}</div>
                <div className="text-xs text-muted-foreground">Theater ID: {theater.theater_id}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
