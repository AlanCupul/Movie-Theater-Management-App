"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Showing {
  showing_id: number;
  movie_id: number;
  theater_id: number;
  show_time: string;
  available_seats: number;
  status: boolean;
  movie?: { name: string };
  theater?: { theater_number: number };
}

export default function ManageShowingsPage() {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Showing>>({ status: true });
  const { toast } = useToast();

  useEffect(() => {
    fetchShowings();
  }, []);

  async function fetchShowings() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("showings")
      .select("*, movie:movies(name), theater:theaters(theater_number)")
      .order("show_time", { ascending: true });
    if (error) {
      setError("Failed to fetch showings");
      toast({ title: "Error", description: "Error fetching showings: " + error.message, variant: "destructive" });
    }
    setShowings(data || []);
    setLoading(false);
  }

  function scrollToInput() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(showing: Showing) {
    setEditingId(showing.showing_id);
    setForm({ ...showing, status: showing.status ?? true });
    scrollToInput();
  }

  function startNew() {
    setForm({ show_time: "", available_seats: 0, movie_id: 0, theater_id: 0, status: true });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ status: true });
  }

  async function saveEdit() {
    const supabase = createClient();
    if (editingId === null) {
      // Fetch seat_capacity for the selected theater
      let seat_capacity = 0;
      if (form.theater_id) {
        const { data: theaterData, error: theaterError } = await supabase
          .from("theaters")
          .select("seat_capacity")
          .eq("theater_id", form.theater_id)
          .single();
        if (theaterError) {
          toast({ title: "Error", description: "Failed to fetch theater seat capacity: " + theaterError.message, variant: "destructive" });
          return;
        }
        seat_capacity = theaterData?.seat_capacity || 0;
      }
      // Convert local datetime-local value to UTC ISO string before saving
      let show_time_utc = form.show_time;
      if (form.show_time) {
        show_time_utc = new Date(form.show_time).toISOString();
      }
      const { error } = await supabase.from("showings").insert([{ ...form, show_time: show_time_utc, status: true, available_seats: seat_capacity }]);
      if (error) {
        toast({ title: "Error", description: "Failed to create showing: " + error.message, variant: "destructive" });
        return;
      } else {
        toast({ title: "Success", description: "Showing added!" });
      }
    } else {
      // Only send valid columns for update
      const { movie_id, theater_id, show_time, status } = form;
      // Convert local datetime-local value to UTC ISO string before updating
      let show_time_utc_update = show_time;
      if (show_time) {
        show_time_utc_update = new Date(show_time).toISOString();
      }
      const { error } = await supabase
        .from("showings")
        .update({ movie_id, theater_id, show_time: show_time_utc_update, status })
        .eq("showing_id", editingId!);
      if (error) {
        toast({ title: "Error", description: "Failed to update showing: " + error.message, variant: "destructive" });
        return;
      } else {
        toast({ title: "Success", description: "Showing updated!" });
      }
    }
    cancelEdit();
    fetchShowings();
  }

  async function deleteShowing(id: number) {
    if (!confirm("Are you sure you want to mark this showing inactive?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("showings").update({ status: false }).eq("showing_id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to mark showing inactive: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Showing marked inactive!" });
      fetchShowings();
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "movie_id" || name === "theater_id" ? Number(value) : value }));
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Showings</h1>
        <Button asChild variant="outline">
          <Link href="/showings">Back to Showings</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
        {/* Add/Edit Showing Form */}
        <form onSubmit={e => { e.preventDefault(); saveEdit(); }} className="mb-8 space-y-4 bg-background border p-4 rounded max-w-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <Label htmlFor="show_time">Showtime</Label>
                <Input
                  required
                  type="datetime-local"
                  name="show_time"
                  value={form.show_time ? form.show_time.slice(0, 16) : ''}
                  onChange={handleFormChange}
                />
              </div>
              <div>
              <Label htmlFor="movie_id">Movie ID</Label>
                <Input
                  required
                  type="number"
                  name="movie_id"
                  value={form.movie_id || ''}
                  min={1}
                  onChange={handleFormChange}
                  placeholder="Movie ID"
                />
              </div>
              <div>
              <Label htmlFor="theater_id">Theater ID</Label>
                <Input
                  required
                  type="number"
                  name="theater_id"
                  value={form.theater_id || ''}
                  min={1}
                  onChange={handleFormChange}
                  placeholder="Theater ID"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Checkbox
                  id="status"
                  name="status"
                  checked={!!form.status}
                  onCheckedChange={checked => setForm(f => ({ ...f, status: !!checked }))}
                />
                <Label htmlFor="status">Active</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="submit" size="sm" variant="default">{editingId ? 'Update Showing' : 'Add Showing'}</Button>
              {editingId && (
                <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
              )}
            </div>
          </form>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>ID</TableHead>
                <TableHead>Movie Name</TableHead>
                <TableHead>Theater #</TableHead>
                <TableHead>Show Time</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showings.map(showing => (
                <TableRow key={showing.showing_id}>
                  <TableCell className="text-center">{showing.showing_id}</TableCell>
                  <TableCell>{showing.movie?.name ?? showing.movie_id}</TableCell>
                  <TableCell>{showing.theater?.theater_number ?? showing.theater_id}</TableCell>
                  <TableCell>{new Date(showing.show_time).toLocaleString('en-US', {
                    timeZone: 'America/Chicago',
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                  })} CST</TableCell>
                  <TableCell>{showing.available_seats}</TableCell>
                  <TableCell>
                    <Checkbox checked={showing.status} disabled />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(showing)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteShowing(showing.showing_id)}>Mark Inactive</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}
