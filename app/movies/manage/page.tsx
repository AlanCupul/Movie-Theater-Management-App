"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import Link from "next/link";

interface Movie {
  movie_id: number;
  name: string;
  release_date: string;
  movie_poster_url?: string;
  duration?: number;
  rating?: string;
  featured?: boolean;
  status: boolean;
}

export default function ManageMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Movie>>({ status: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const inputSectionRef = useRef<HTMLFormElement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number|null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (!loading && movies.length === 0) {
      fetchMovies();
    }
  }, [loading, movies]);

  async function fetchMovies() {
    setLoading(true);
    const { data, error } = await supabase.from("movies").select("*").order("release_date", { ascending: false });
    if (error) toast({ title: "Error", description: "Error fetching movies: " + error.message, variant: "destructive" });
    else setMovies(data || []);
    setLoading(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.type === "number" ? parseInt(e.target.value) : e.target.value });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Validate rating
    let ratingNum = form.rating === undefined || form.rating === "" ? undefined : Number(form.rating);
    if (ratingNum !== undefined && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10)) {
      toast({ title: "Invalid Rating", description: "Rating must be a number between 0 and 10.", variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("movies").insert([{ ...form, rating: ratingNum, status: true }]);
    if (error) toast({ title: "Error", description: "Error adding movie: " + error.message, variant: "destructive" });
    else {
      setForm({ status: true });
      fetchMovies();
      toast({ title: "Success", description: "Movie added!" });
    }
    setSaving(false);
  }

  async function handleEdit(movie: Movie) {
    setEditingId(movie.movie_id);
    setForm({ ...movie, status: movie.status ?? true });
    scrollToInput();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    const { movie_id, ...updateFields } = form;
    // Validate rating
    let ratingNum = form.rating === undefined || form.rating === "" ? undefined : Number(form.rating);
    if (ratingNum !== undefined && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10)) {
      toast({ title: "Invalid Rating", description: "Rating must be a number between 0 and 10.", variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("movies").update({ ...updateFields, rating: ratingNum }).eq("movie_id", editingId);
    if (error) toast({ title: "Error", description: "Error updating movie: " + error.message, variant: "destructive" });
    else {
      setEditingId(null);
      setForm({ status: true });
      fetchMovies();
      toast({ title: "Success", description: "Movie updated!" });
    }
    setSaving(false);
  }

  function promptDelete(movieId: number) {
    setPendingDeleteId(movieId);
    setDeleteDialogOpen(true);
  }
  async function confirmDelete() {
    if (pendingDeleteId == null) return;
    setSaving(true);
    const { error } = await supabase.from("movies").update({ status: false }).eq("movie_id", pendingDeleteId);
    if (error) toast({ title: "Error", description: "Error marking movie inactive: " + error.message, variant: "destructive" });
    else {
      fetchMovies();
      toast({ title: "Success", description: "Movie marked inactive!", variant: "default" });
    }
    setSaving(false);
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ status: true });
  }

  function scrollToInput() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Movies</h1>
          <Button asChild variant="outline">
            <Link href="/movies">Browse Movies</Link>
          </Button>
        </div>

        {/* Add/Edit Movie Form */}
        <form ref={inputSectionRef} onSubmit={editingId ? handleUpdate : handleAdd} className="mb-8 space-y-4 bg-background border p-4 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Movie Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name || ""}
                onChange={handleInput}
                placeholder="Movie Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="release_date">Release Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={"w-full justify-start text-left font-normal " + (!form.release_date ? "text-muted-foreground" : "")}
                  >
                    {form.release_date
                      ? form.release_date
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.release_date
                      ? new Date(
                          Number(form.release_date.slice(0, 4)),
                          Number(form.release_date.slice(5, 7)) - 1,
                          Number(form.release_date.slice(8, 10))
                        )
                      : undefined}
                    onSelect={date => setForm(f => ({ ...f, release_date: date ? date.toISOString().slice(0, 10) : undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={form.duration || ""}
                onChange={handleInput}
                placeholder="Duration (minutes)"
                required
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="movie_poster_url">Poster URL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 leading-none font-semibold select-none cursor-default">?</Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      Visit <a href="https://www.movieposters.com/collections/size-27-x-40" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">https://www.movieposters.com/collections/size-27-x-40</a> and copy the image address of a poster
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="movie_poster_url"
                name="movie_poster_url"
                value={form.movie_poster_url || ""}
                onChange={handleInput}
                placeholder="Poster URL"
                className="md:col-span-2"
              />
            </div>
            <div>
              <Label htmlFor="rating">Rating (0-10)</Label>
              <Input
                id="rating"
                name="rating"
                type="text"
                inputMode="decimal"
                value={form.rating ?? ""}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, rating: val }));
                }}
                placeholder="Rating (0-10)"
                maxLength={3}
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
            <div className="flex items-center gap-2 mt-6">
              <Checkbox
                id="featured"
                checked={!!form.featured}
                onCheckedChange={checked => setForm(f => ({ ...f, featured: !!checked }))}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {editingId ? "Update Movie" : "Add Movie"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Data Table Section */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Poster</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center p-4">Loading...</TableCell></TableRow>
              ) : movies.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center p-4">No movies found.</TableCell></TableRow>
              ) : movies.map((movie) => (
                <TableRow key={movie.movie_id}>
                  <TableCell className="text-center">{movie.movie_id}</TableCell>
                  <TableCell className="text-center">
                    {movie.movie_poster_url ? (
                      <img src={movie.movie_poster_url} alt={movie.name} className="h-20 aspect-[27/40] object-cover mx-auto rounded shadow" />
                    ) : (
                      <span className="text-muted-foreground">No Image</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{movie.name}</TableCell>
                  <TableCell>
                    {movie.release_date
                      ? format(
                          new Date(
                            Number(movie.release_date.slice(0, 4)),
                            Number(movie.release_date.slice(5, 7)) - 1,
                            Number(movie.release_date.slice(8, 10))
                          ),
                          "MMMM d, yyyy"
                        )
                      : ""}
                  </TableCell>
                  <TableCell>{movie.duration ? `${movie.duration} min` : "-"}</TableCell>
                  <TableCell>{movie.rating}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={!!movie.featured} disabled className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={!!movie.status} disabled className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2 h-full">
                      <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(movie)}>
                        Edit
                      </Button>
                      <AlertDialog open={deleteDialogOpen && pendingDeleteId === movie.movie_id} onOpenChange={open => {
                        setDeleteDialogOpen(open);
                        if (!open) setPendingDeleteId(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="destructive" onClick={() => promptDelete(movie.movie_id)}>
                            Mark Inactive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Movie Inactive</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to mark <span className="font-semibold">{movie.name}</span> inactive?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} disabled={saving}>Mark Inactive</AlertDialogAction>
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
    </>
  );
}
