import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/movies/[movie_id] - Get a single movie
export async function GET(_req: NextRequest, context: any) {
  try {
    const params = context.params;
    const movie = await prisma.movie.findUnique({
      where: { movie_id: Number(params.movie_id) },
    });
    if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    // Serialize BigInt field
    const movieSerialized = { ...movie, movie_id: movie.movie_id.toString() };
    return NextResponse.json(movieSerialized);
  } catch (error) {
    console.error("/api/movies/[movie_id] GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/movies/[movie_id] - Update a movie
export async function PUT(req: NextRequest, context: any) {
  try {
    const params = context.params;
    const body = await req.json();
    const movie = await prisma.movie.update({
      where: { movie_id: Number(params.movie_id) },
      data: {
        name: body.name,
        duration: body.duration,
        release_date: new Date(body.release_date),
        movie_poster_url: body.movie_poster_url,
        featured: body.featured ?? false,
        rating: body.rating !== undefined ? Number(body.rating) : null,
        status: body.status ?? true,
      },
    });
    // Serialize BigInt field
    const movieSerialized = { ...movie, movie_id: movie.movie_id.toString() };
    return NextResponse.json(movieSerialized);
  } catch (error) {
    console.error("/api/movies/[movie_id] PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/movies/[movie_id] - Soft delete a movie
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const params = (await context).params;
    const movie = await prisma.movie.update({
      where: { movie_id: Number(params.movie_id) },
      data: { status: false },
    });
    // Serialize BigInt field
    const movieSerialized = { ...movie, movie_id: movie.movie_id.toString() };
    return NextResponse.json(movieSerialized);
  } catch (error) {
    console.error("/api/movies/[movie_id] DELETE error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
