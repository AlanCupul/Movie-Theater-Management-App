import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/showings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movie_id");
    const where = movieId ? { movie_id: Number(movieId) } : undefined;
    const showings = await prisma.showing.findMany({
      where,
      orderBy: { showing_id: "asc" },
    });
    const showingsSerialized = showings.map((showing) => ({
      ...showing,
      showing_id: showing.showing_id?.toString(),
      movie_id: showing.movie_id ? showing.movie_id.toString() : null,
      theater_id: showing.theater_id ? showing.theater_id.toString() : null,
    }));
    return NextResponse.json(showingsSerialized);
  } catch (error) {
    console.error("/api/showings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/showings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // fetch seat_capacity for selected theater
    const theater = await prisma.theater.findUnique({
      where: { theater_id: Number(body.theater_id) },
    });
    if (!theater) {
      return NextResponse.json({ error: "Theater not found" }, { status: 400 });
    }

    // convert show_time to UTC ISO string
    const show_time = new Date(body.show_time).toISOString();

    const showing = await prisma.showing.create({
      data: {
        movie_id: Number(body.movie_id),
        theater_id: Number(body.theater_id),
        show_time,
        available_seats: Math.max(0, Math.min(Number(body.available_seats ?? theater.seat_capacity), theater.seat_capacity)),
        status: body.status ?? true,
      },
    });
    const showingSerialized = {
      ...showing,
      showing_id: showing.showing_id?.toString(),
      movie_id: showing.movie_id ? showing.movie_id.toString() : null,
      theater_id: showing.theater_id ? showing.theater_id.toString() : null,
    };
    return NextResponse.json(showingSerialized, { status: 201 });
  } catch (error) {
    console.error("/api/showings POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
