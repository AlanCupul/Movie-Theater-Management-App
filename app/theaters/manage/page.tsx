"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Theater {
  theater_id: number;
  theater_number: number;
  seat_capacity: number;
  status: boolean;
}

export default function ManageTheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Theater>>({ status: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const inputSectionRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    fetchTheaters();
  }, []);

  useEffect(() => {
    // Client-side auth protection
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
      } else {
        setUser(user);
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, [router, supabase]);

  async function fetchTheaters() {
    setLoading(true);
    const { data, error } = await supabase.from("theaters").select("*").order("theater_number");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTheaters(data || []);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.theater_number || !form.seat_capacity || !form.status) {
      toast({ title: "Missing Fields", description: "Theater number, seat capacity, and status are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("theaters").insert({
      theater_number: Number(form.theater_number),
      seat_capacity: Number(form.seat_capacity),
      status: form.status,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Theater added!", variant: "default" });
      setForm({ status: true });
      fetchTheaters();
    }
    setSaving(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.theater_number || !form.seat_capacity || !form.status || editingId == null) {
      toast({ title: "Missing Fields", description: "Theater number, seat capacity, and status are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("theaters").update({
      theater_number: Number(form.theater_number),
      seat_capacity: Number(form.seat_capacity),
      status: form.status,
    }).eq("theater_id", editingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Theater updated!", variant: "default" });
      setForm({ status: true });
      setEditingId(null);
      fetchTheaters();
    }
    setSaving(false);
  }

  function scrollToInput() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEdit(theater: Theater) {
    setEditingId(theater.theater_id);
    setForm({
      theater_number: theater.theater_number,
      seat_capacity: theater.seat_capacity,
      status: theater.status ?? true,
    });
    scrollToInput();
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ status: true });
  }

  async function handleDelete() {
    if (pendingDeleteId == null) return;
    setSaving(true);
    const { error } = await supabase.from("theaters").update({ status: false }).eq("theater_id", pendingDeleteId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Theater marked inactive!", variant: "default" });
      fetchTheaters();
    }
    setSaving(false);
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  }

  if (authLoading) {
    return <div className="text-center text-muted-foreground py-20">Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Theaters</h1>
        <Button asChild variant="outline">
          <Link href="/theaters">Browse Theaters</Link>
        </Button>
      </div>
      {/* Add/Edit Theater Form */}
      <form ref={inputSectionRef} onSubmit={editingId ? handleUpdate : handleAdd} className="mb-8 space-y-4 bg-background border p-4 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="theater_number" className="block mb-1 font-medium">Theater Number</Label>
            <Input
              id="theater_number"
              name="theater_number"
              type="number"
              min={1}
              value={form.theater_number ?? ""}
              onChange={e => setForm(f => ({ ...f, theater_number: Number(e.target.value) }))}
              placeholder="Theater Number"
              required
            />
          </div>
          <div>
            <Label htmlFor="seat_capacity" className="block mb-1 font-medium">Seat Capacity</Label>
            <Input
              id="seat_capacity"
              name="seat_capacity"
              type="number"
              min={1}
              max={50}
              value={form.seat_capacity ?? ""}
              onChange={e => {
                let val = Number(e.target.value);
                if (val > 50) val = 50;
                setForm(f => ({ ...f, seat_capacity: val }));
              }}
              placeholder="Seat Capacity (max 50)"
              required
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
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {editingId ? "Update Theater" : "Add Theater"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </form>
      {/* Theaters Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Theater #</TableHead>
              <TableHead>Seat Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center p-4">Loading...</TableCell></TableRow>
            ) : theaters.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center p-4">No theaters found.</TableCell></TableRow>
            ) : theaters.map((theater) => (
              <TableRow key={theater.theater_id}>
                <TableCell className="text-center">{theater.theater_id}</TableCell>
                <TableCell>{theater.theater_number}</TableCell>
                <TableCell>{theater.seat_capacity}</TableCell>
                <TableCell>
                  <Checkbox checked={theater.status} disabled />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(theater)}>
                      Edit
                    </Button>
                    <AlertDialog open={deleteDialogOpen && pendingDeleteId === theater.theater_id} onOpenChange={open => {
                      setDeleteDialogOpen(open);
                      if (!open) setPendingDeleteId(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteId(theater.theater_id)}>
                          Mark Inactive
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mark Theater Inactive</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark <span className="font-semibold">Theater #{theater.theater_number}</span> as inactive?
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
      </div>
    </div>
  );
}
