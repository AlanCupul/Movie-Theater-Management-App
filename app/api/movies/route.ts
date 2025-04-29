import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/movies
export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { movie_id: "asc" },
    });
    const moviesSerialized = movies.map((movie) => ({
      ...movie,
      movie_id: movie.movie_id.toString(),
    }));
    return NextResponse.json(moviesSerialized);
  } catch (error) {
    console.error("/api/movies error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/movies
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const movie = await prisma.movie.create({
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

    const movieSerialized = { ...movie, movie_id: movie.movie_id.toString() };
    return NextResponse.json(movieSerialized, { status: 201 });
  } catch (error) {
    console.error("/api/movies POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
