"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [maxSeats, setMaxSeats] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchShowings();
    // Fetch all theaters for seat capacity lookup
    fetch("/api/theaters")
      .then(res => res.ok ? res.json() : [])
      .then(data => setTheaters(data || []));
  }, []);

  async function fetchShowings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/showings");
      if (!res.ok) throw new Error("Failed to fetch showings");
      const data = await res.json();
      setShowings(data || []);
    } catch (error: any) {
      setError("Failed to fetch showings");
      toast({ title: "Error", description: "Error fetching showings: " + (error.message || error), variant: "destructive" });
    }
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

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId === null) {
        // Create
        const res = await fetch("/api/showings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create showing");
        toast({ title: "Success", description: "Showing added!" });
      } else {
        // Update
        const res = await fetch(`/api/showings/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update showing");
        toast({ title: "Success", description: "Showing updated!" });
      }
      setForm({ status: true });
      setEditingId(null);
      fetchShowings();
    } catch (error: any) {
      toast({ title: "Error", description: (error.message || error), variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/showings/${pendingDeleteId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to mark showing inactive");
      fetchShowings();
      toast({ title: "Success", description: "Showing marked inactive." });
      setPendingDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: "Error marking showing inactive: " + (error.message || error), variant: "destructive" });
    }
    setSaving(false);
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "theater_id") {
      const theater = theaters.find(t => Number(t.theater_id) === Number(value));
      setMaxSeats(theater ? theater.seat_capacity : null);
      setForm(f => ({ ...f, [name]: Number(value), available_seats: theater ? Math.min(f.available_seats || 0, theater.seat_capacity) : f.available_seats }));
    } else if (name === "available_seats") {
      setForm(f => ({ ...f, [name]: Math.max(0, maxSeats ? Math.min(Number(value), maxSeats) : Number(value)) }));
    } else if (name === "movie_id") {
      setForm(f => ({ ...f, [name]: Number(value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Showings</h1>
        <Button asChild variant="outline">
          <Link href="/showings">Browse Showings</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Add/Edit Showing Form */}
          <form onSubmit={e => { e.preventDefault(); saveEdit(e); }} className="mb-8 space-y-4 bg-background border p-4 rounded max-w-xl mx-auto">
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
                {maxSeats !== null && (
                  <div className="text-xs text-muted-foreground mt-1">Seat Capacity: {maxSeats}</div>
                )}
              </div>
              <div>
                <Label htmlFor="available_seats">Available Seats</Label>
                <Input
                  required
                  type="number"
                  name="available_seats"
                  min={0}
                  max={maxSeats || undefined}
                  value={form.available_seats ?? ''}
                  onChange={handleFormChange}
                  placeholder="Available Seats"
                  disabled={maxSeats === null}
                />
                {maxSeats !== null && (
                  <div className="text-xs text-muted-foreground mt-1">Max: {maxSeats}</div>
                )}
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
                      <AlertDialog open={deleteDialogOpen && pendingDeleteId === showing.showing_id} onOpenChange={open => {
                        setDeleteDialogOpen(open);
                        if (!open) setPendingDeleteId(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" onClick={() => {
                            setPendingDeleteId(showing.showing_id);
                            setDeleteDialogOpen(true);
                          }}>
                            Mark Inactive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Showing Inactive</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to mark this showing inactive?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={saving}>Mark Inactive</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
