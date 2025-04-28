import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/theaters - List all theaters
export async function GET() {
  try {
    const theaters = await prisma.theater.findMany({ orderBy: { theater_id: "asc" } });
    const theatersSerialized = theaters.map((theater) => ({
      ...theater,
      theater_id: theater.theater_id.toString(),
      seat_capacity: theater.seat_capacity,
      theater_number: theater.theater_number,
      status: theater.status,
    }));
    return NextResponse.json(theatersSerialized);
  } catch (error) {
    console.error("/api/theaters error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/theaters - Create a new theater
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const theater = await prisma.theater.create({
      data: {
        theater_number: body.theater_number,
        seat_capacity: body.seat_capacity,
        status: body.status ?? true,
      },
    });
    const theaterSerialized = {
      ...theater,
      theater_id: theater.theater_id.toString(),
      seat_capacity: theater.seat_capacity,
      theater_number: theater.theater_number,
      status: theater.status,
    };
    return NextResponse.json(theaterSerialized, { status: 201 });
  } catch (error) {
    console.error("/api/theaters POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
