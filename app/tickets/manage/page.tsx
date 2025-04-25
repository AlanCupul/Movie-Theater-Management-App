"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
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

interface Ticket {
  ticket_id: number;
  showing_id: number;
  seat_number: string;
  price: number;
  age: string;
}

// Helper to get price based on age
function getPrice(age: string) {
  if (age === "kid") return 8;
  if (age === "senior") return 6;
  return 10;
}

// Helper to capitalize age
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ManageTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Ticket>>({ age: "adult" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error]);

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

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleAgeChange(value: string) {
    setForm(f => ({ ...f, age: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const price = getPrice(form.age || "adult");
    const { error } = await supabase.from("tickets_sold").insert([{ ...form, price }]);
    if (error) setError("Error adding ticket: " + error.message);
    else {
      setForm({ age: "adult" });
      fetchTickets();
      toast({ title: "Success", description: "Ticket added!" });
    }
    setSaving(false);
  }

  async function handleEdit(ticket: Ticket) {
    setEditingId(ticket.ticket_id);
    setForm(ticket);
    scrollToInput();
  }

  function scrollToInput() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();
    const price = getPrice(form.age || "adult");
    const { ticket_id, ...updateFields } = form;
    const { error } = await supabase.from("tickets_sold").update({ ...updateFields, price }).eq("ticket_id", editingId);
    if (error) setError("Error updating ticket: " + error.message);
    else {
      setEditingId(null);
      setForm({ age: "adult" });
      fetchTickets();
      toast({ title: "Success", description: "Ticket updated!" });
    }
    setSaving(false);
  }

  function promptDelete(ticketId: number) {
    setPendingDeleteId(ticketId);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (pendingDeleteId == null) return;
    setSaving(true);
    const supabase = createClient();
    // Fetch the ticket to get showing_id before deleting
    const { data: ticketData, error: fetchError } = await supabase.from("tickets_sold").select("showing_id").eq("ticket_id", pendingDeleteId).single();
    if (fetchError) {
      setError("Failed to fetch ticket info: " + fetchError.message);
      toast({ title: "Error", description: "Failed to fetch ticket info: " + fetchError.message, variant: "destructive" });
      setSaving(false);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
      return;
    }
    const { error } = await supabase.from("tickets_sold").delete().eq("ticket_id", pendingDeleteId);
    if (ticketData && ticketData.showing_id) {
      await supabase.rpc('decrement_available_seats', {
        showing_id_input: ticketData.showing_id,
        decrement_by: -1 // negative to increment
      });
    }
    if (error) {
      setError("Error deleting ticket: " + error.message);
      toast({ title: "Error", description: "Error deleting ticket: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ticket deleted!" });
      fetchTickets();
    }
    setSaving(false);
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ age: "adult" });
  }

  const price = getPrice(form.age || "adult");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Tickets</h1>
      {/* Add/Edit Ticket Form */}
      <form ref={formRef} onSubmit={editingId ? handleUpdate : handleAdd} className="mb-8 space-y-4 bg-background border p-4 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="showing_id">Showing ID</Label>
            <Input
              id="showing_id"
              name="showing_id"
              type="number"
              value={form.showing_id || ""}
              onChange={handleInput}
              placeholder="Showing ID"
              required
              disabled={saving}
            />
          </div>
          <div>
            <Label htmlFor="seat_number">Seat Number</Label>
            <Input
              id="seat_number"
              name="seat_number"
              value={form.seat_number || ""}
              onChange={handleInput}
              placeholder="Seat Number"
              required
              disabled={saving}
            />
          </div>
          <div>
            <Label>Age Group</Label>
            <RadioGroup value={form.age || "adult"} onValueChange={handleAgeChange} className="flex gap-6 mt-2">
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
          <div>
            <Label>Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={price}
              readOnly
              disabled
              className="opacity-70 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="submit" disabled={saving}>
            {editingId ? "Update Ticket" : "Add Ticket"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </form>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
      {loading ? (
        <div>Loading...</div>
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
                <TableCell className="text-center">${Number(ticket.price).toFixed(2)}</TableCell>
                <TableCell className="text-center">{capitalize(ticket.age)}</TableCell>
                <TableCell className="text-center flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(ticket)} disabled={saving}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => promptDelete(ticket.ticket_id)} disabled={saving}>
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
